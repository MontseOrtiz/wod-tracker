import { GoogleGenAI, createUserContent, createPartFromBase64, ApiError } from '@google/genai';
import { z } from 'zod';
import { workoutResponseSchema } from '@/lib/workout-schema';
import {
  VisionError,
  VisionUnavailableError,
  type WhiteboardImage,
  type WhiteboardReader,
} from './types';

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash';
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

// The output shape is enforced through `responseJsonSchema`, so the prompt only
// has to describe how to read the workout, not how to format the answer.
const PROMPT = `You are reading a photo of a CrossFit gym's workout of the day (a screen or a whiteboard).
Extract the workout shown.

Rules:
- Never invent exercises that aren't in the photo.
- If a section isn't visible or doesn't apply, use an empty string or an empty array.
- "weight" and "unit" must be null when no weight is written for that exercise.
- "strength_skill" holds the strength or skill work. "wod" holds the metcon, with its format (e.g. "For Time", "AMRAP 12", "21-15-9") in "wod_format".`;

// Gemini rejects the `$schema` key that Zod adds.
const responseJsonSchema: Record<string, unknown> = z.toJSONSchema(workoutResponseSchema);
delete responseJsonSchema.$schema;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isUnavailable(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 503 || err.status === 429);
}

export function createGeminiReader(apiKey = process.env.GEMINI_API_KEY): WhiteboardReader {
  const ai = new GoogleGenAI({ apiKey });

  return {
    async read({ data, mimeType }: WhiteboardImage) {
      let text: string | undefined;
      let lastError: unknown;

      // Retries only on "unavailable"; any other error fails immediately.
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const result = await ai.models.generateContent({
            model: MODEL,
            contents: createUserContent([PROMPT, createPartFromBase64(data.toString('base64'), mimeType)]),
            config: { responseMimeType: 'application/json', responseJsonSchema },
          });
          text = result.text;
          lastError = undefined;
          break;
        } catch (err) {
          lastError = err;
          if (!isUnavailable(err) || attempt === MAX_ATTEMPTS) break;
          await sleep(RETRY_DELAY_MS);
        }
      }

      if (lastError) {
        if (isUnavailable(lastError)) throw new VisionUnavailableError('Gemini is unavailable');
        throw new VisionError(lastError instanceof Error ? lastError.message : 'Unknown Gemini error');
      }
      if (!text) throw new VisionError('Gemini returned an empty response');

      try {
        return JSON.parse(text);
      } catch {
        throw new VisionError('Gemini returned invalid JSON');
      }
    },
  };
}
