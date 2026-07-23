import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { GoogleGenAI, createUserContent, createPartFromBase64, ApiError } from '@google/genai';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MAX_GEMINI_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isUnavailableError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 503;
}

const PROMPT = `You are reading a photo of a handwritten CrossFit gym whiteboard.
Extract the workout written on it and return ONLY valid JSON matching exactly this structure (no markdown, no code fences, no explanation — just the JSON):

{
  "warmup_notes": "string or empty string if not visible",
  "strength_skill": [
    { "exercise_name": "string", "weight": number or null, "unit": "kg" | "lb" | "%" | null, "reps": number or null, "sets": number or null }
  ],
  "wod": {
    "wod_format": "string (e.g. 'For Time', 'AMRAP 12', '21-15-9') or empty string",
    "result": "",
    "exercises": [
      { "exercise_name": "string", "weight": number or null, "unit": "kg" | "lb" | "%" | null, "reps": number or null, "sets": number or null }
    ]
  }
}

Rules:
- "result" must always be an empty string. It is filled in by the athlete after finishing the workout and is never visible on the whiteboard.
- If a section isn't visible or doesn't apply, use an empty string or empty array as appropriate — never invent exercises that aren't in the photo.
- "weight" and "unit" should be null when no weight is written for that exercise.`;

export async function POST(request: Request) {
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
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'El archivo subido no es una imagen.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // 1 — Upload the photo to Supabase Storage
  const extension = file.type.split('/')[1] ?? 'jpg';
  const path = `${randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from('whiteboard-photos')
    .upload(path, buffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json(
      { error: `Error al subir la foto: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('whiteboard-photos').getPublicUrl(path);

  // 2 — Send the photo to Gemini and ask it to read the whiteboard
  // Retries only on 503 (UNAVAILABLE / high demand) — other errors fail immediately.
  let responseText: string | undefined;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_GEMINI_ATTEMPTS; attempt++) {
    try {
      const result = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: createUserContent([
          PROMPT,
          createPartFromBase64(buffer.toString('base64'), file.type),
        ]),
        config: {
          responseMimeType: 'application/json',
        },
      });
      responseText = result.text;
      lastError = undefined;
      break;
    } catch (err) {
      lastError = err;
      if (!isUnavailableError(err) || attempt === MAX_GEMINI_ATTEMPTS) break;
      await sleep(RETRY_DELAY_MS);
    }
  }

  if (lastError) {
    if (isUnavailableError(lastError)) {
      return NextResponse.json(
        { error: 'El servicio de IA está saturado, intenta de nuevo en unos minutos' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: `Error al conectar con Gemini: ${lastError instanceof Error ? lastError.message : 'error desconocido'}` },
      { status: 502 }
    );
  }

  if (!responseText) {
    return NextResponse.json({ error: 'Gemini no devolvió ninguna respuesta.' }, { status: 502 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    return NextResponse.json({ error: 'Gemini devolvió una respuesta que no es JSON válido.' }, { status: 502 });
  }

  return NextResponse.json({ photoUrl: publicUrl, data: parsed });
}
