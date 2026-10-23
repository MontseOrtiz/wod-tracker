import { parsedWorkoutSchema, type ParsedWorkout } from '@/lib/workout-schema';
import { createGeminiReader } from './gemini';
import { VisionError, type WhiteboardImage, type WhiteboardReader } from './types';

export { VisionError, VisionUnavailableError } from './types';

// Swap the provider here; callers only know about `parseWhiteboard`.
const reader: WhiteboardReader = createGeminiReader();

export async function parseWhiteboard(image: WhiteboardImage): Promise<ParsedWorkout> {
  const raw = await reader.read(image);
  const parsed = parsedWorkoutSchema.safeParse(raw);
  if (!parsed.success) throw new VisionError('The response did not match the expected workout shape');
  return parsed.data;
}
