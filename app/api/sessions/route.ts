import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { saveSessionSchema } from '@/lib/session-schema';
import { validateImage } from '@/lib/upload-validation';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const RATE_LIMIT = { limit: 20, windowMs: 10 * 60 * 1000 };
const BUCKET = 'whiteboard-photos';

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  const { allowed, retryAfterSeconds } = rateLimit(`save:${getClientIp(request)}`, RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return fail('Se esperaba un formulario multipart/form-data.', 400);
  }

  let rawPayload: unknown;
  try {
    rawPayload = JSON.parse(String(formData.get('payload') ?? ''));
  } catch {
    return fail('Los datos del entrenamiento no son válidos.', 400);
  }

  const parsed = saveSessionSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return fail('Los datos del entrenamiento no son válidos o están vacíos.', 400);
  }

  const photo = formData.get('photo');
  let photoFile: File | null = null;
  let extension = '';
  if (photo instanceof File && photo.size > 0) {
    const validation = validateImage(photo);
    if (!validation.ok) return fail(validation.error, validation.status);
    photoFile = photo;
    extension = validation.extension;
  }

  const supabase = createServiceClient();

  // 1 — Upload the photo only now that the data is known to be valid
  let photoPath: string | null = null;
  let photoUrl: string | null = null;
  if (photoFile) {
    photoPath = `${randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(photoPath, Buffer.from(await photoFile.arrayBuffer()), { contentType: photoFile.type });

    if (uploadError) {
      console.error('save-session upload failed:', uploadError);
      return fail('No se pudo subir la foto. Intenta de nuevo.', 500);
    }
    photoUrl = supabase.storage.from(BUCKET).getPublicUrl(photoPath).data.publicUrl;
  }

  // 2 — Save everything in one transaction
  const { data: id, error } = await supabase.rpc('create_session', {
    payload: { ...parsed.data, photo_url: photoUrl },
  });

  if (error || !id) {
    console.error('save-session rpc failed:', error);
    // Don't leave an orphan photo behind.
    if (photoPath) await supabase.storage.from(BUCKET).remove([photoPath]);
    return fail('No se pudo guardar el entrenamiento. Intenta de nuevo.', 500);
  }

  return NextResponse.json({ id });
}
