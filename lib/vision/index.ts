import { parsedWorkoutSchema, type ParsedWorkout } from '@/lib/workout-schema';
import { createGeminiReader } from './gemini';
import { VisionError, type WhiteboardImage, type WhiteboardReader } from './types';

export { VisionError, VisionUnavailableError } from './types';

// Swap the provider here; callers only know about `parseWhiteboard`.
// Created on first use so builds and tests don't need the API key.
let reader: WhiteboardReader | undefined;
function getReader(): WhiteboardReader {
  return (reader ??= createGeminiReader());
}

export async function parseWhiteboard(image: WhiteboardImage): Promise<ParsedWorkout> {
  const raw = await getReader().read(image);
  const parsed = parsedWorkoutSchema.safeParse(raw);
  if (!parsed.success) throw new VisionError('The response did not match the expected workout shape');
  return parsed.data;
}
