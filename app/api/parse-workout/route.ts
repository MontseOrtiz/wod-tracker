import { NextResponse } from 'next/server';
import { validateImage } from '@/lib/upload-validation';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { parseWhiteboard, VisionUnavailableError } from '@/lib/vision';

export const dynamic = 'force-dynamic';

const RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };

export async function POST(request: Request) {
  // Checked before reading the body so rejected requests stay cheap.
  const { allowed, retryAfterSeconds } = rateLimit(getClientIp(request), RATE_LIMIT);
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
    return NextResponse.json(
      { error: 'Se esperaba un formulario multipart/form-data con un campo "image".' },
      { status: 400 }
    );
  }

  const file = formData.get('image');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No se proporcionó ninguna imagen.' }, { status: 400 });
  }

  const validation = validateImage(file);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // The photo is not stored here; it is uploaded together with the workout on save.
  try {
    const data = await parseWhiteboard({ data: buffer, mimeType: file.type });
    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof VisionUnavailableError) {
      return NextResponse.json(
        { error: 'El servicio de IA está saturado, intenta de nuevo en unos minutos' },
        { status: 503 }
      );
    }
    console.error('parse-workout failed:', err);
    return NextResponse.json(
      { error: 'No se pudo interpretar el entrenamiento. Intenta con otra foto o llénalo manualmente.' },
      { status: 502 }
    );
  }
}
