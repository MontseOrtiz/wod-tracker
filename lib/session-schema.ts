import { z } from 'zod';

// Everything the browser sends is untrusted: this is the single gate before the
// database function runs.
const exerciseSchema = z
  .object({
    exercise_name: z.string().trim().min(1).max(100),
    weight: z.number().nonnegative().max(10_000).nullable(),
    unit: z.enum(['kg', 'lb', '%']).nullable(),
    reps: z.number().int().nonnegative().max(10_000).nullable(),
    sets: z.number().int().nonnegative().max(10_000).nullable(),
  })
  // A unit without a weight is noise.
  .transform(ex => ({ ...ex, unit: ex.weight === null ? null : ex.unit }));

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(value => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), 'Invalid date');

export const saveSessionSchema = z
  .object({
    session_date: isoDate,
    warmup_notes: z.string().trim().max(2000),
    wod_format: z.string().trim().max(200),
    wod_result: z.string().trim().max(200),
    strength: z.array(exerciseSchema).max(50),
    wod: z.array(exerciseSchema).max(50),
  })
  .refine(
    s =>
      s.warmup_notes !== '' ||
      s.wod_format !== '' ||
      s.wod_result !== '' ||
      s.strength.length > 0 ||
      s.wod.length > 0,
    { message: 'Empty workout' }
  );

export type SaveSessionInput = z.input<typeof saveSessionSchema>;
