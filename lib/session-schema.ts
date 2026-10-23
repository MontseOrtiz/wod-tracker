import { z } from 'zod';
import { MIN_ROUNDS, MAX_ROUNDS, MAX_REPS_PER_ROUND } from './rep-scheme';

// Everything the browser sends is untrusted: this is the single gate before the
// database function runs.
const exerciseSchema = z
  .object({
    exercise_name: z.string().trim().min(1).max(100),
    weight: z.number().nonnegative().max(10_000).nullable(),
    unit: z.enum(['kg', 'lb', '%']).nullable(),
    reps: z.number().int().nonnegative().max(10_000).nullable(),
    sets: z.number().int().nonnegative().max(10_000).nullable(),
    rep_scheme: z
      .array(z.number().int().min(1).max(MAX_REPS_PER_ROUND))
      .min(MIN_ROUNDS)
      .max(MAX_ROUNDS)
      .nullish(),
  })
  .transform(ex => ({
    ...ex,
    // A unit without a weight is noise.
    unit: ex.weight === null ? null : ex.unit,
    rep_scheme: ex.rep_scheme ?? null,
    // With a ladder, `sets` is the number of rounds and `reps` stays empty.
    ...(ex.rep_scheme ? { sets: ex.rep_scheme.length, reps: null } : {}),
  }));

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
