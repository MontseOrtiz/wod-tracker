import { z } from 'zod';
import { MAX_ROUNDS, MAX_REPS_PER_ROUND } from './rep-scheme';

// The model is unreliable on details ("135" as a string, "lbs", "10-12" reps), so each
// field is normalised and anything unrecoverable becomes null instead of failing the
// whole photo. The athlete reviews every value in the wizard before saving anyway.

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const n = Number(value.trim().replace(',', '.'));
    return value.trim() !== '' && Number.isFinite(n) ? n : null;
  }
  return null;
}

function toUnit(value: unknown): 'kg' | 'lb' | '%' | null {
  if (typeof value !== 'string') return null;
  const u = value.trim().toLowerCase();
  if (u === '%') return '%';
  if (u === 'kg' || u === 'kgs' || u === 'kilo' || u === 'kilos') return 'kg';
  if (u === 'lb' || u === 'lbs' || u === 'libras') return 'lb';
  return null;
}

const weight = z.preprocess(toNumber, z.number().nonnegative().nullable()).catch(null);
const count = z.preprocess(toNumber, z.number().int().nonnegative().nullable()).catch(null);
const unit = z.preprocess(toUnit, z.enum(['kg', 'lb', '%']).nullable()).catch(null);

// Reps of each round for ladders (10-15-20-15-10); anything malformed becomes null.
const repScheme = z
  .array(z.number().int().min(1).max(MAX_REPS_PER_ROUND))
  .min(1)
  .max(MAX_ROUNDS)
  .nullable()
  .catch(null);

const exerciseSchema = z.object({
  exercise_name: z.string().trim().min(1),
  weight,
  unit,
  reps: count,
  sets: count,
  rep_scheme: z.preprocess(v => (v === undefined ? null : v), repScheme),
});

// One round is just plain reps; two or more is a ladder, where `sets` is the round
// count and `reps` stays empty (same convention as the database).
function normaliseReps<T extends z.infer<typeof exerciseSchema>>(ex: T): T {
  const scheme = ex.rep_scheme;
  if (!scheme) return ex;
  if (scheme.length === 1) return { ...ex, rep_scheme: null, reps: ex.reps ?? scheme[0] };
  return { ...ex, sets: scheme.length, reps: null };
}

// Drops malformed entries (e.g. no name) instead of failing the whole array.
const exerciseList = z
  .array(z.unknown())
  .catch([])
  .transform(items =>
    items.flatMap(item => {
      const parsed = exerciseSchema.safeParse(item);
      // A unit without a weight is noise.
      return parsed.success
        ? [normaliseReps({ ...parsed.data, unit: parsed.data.weight === null ? null : parsed.data.unit })]
        : [];
    })
  );

export const parsedWorkoutSchema = z.object({
  warmup_notes: z.string().catch(''),
  strength_skill: exerciseList,
  wod: z
    .object({
      wod_format: z.string().catch(''),
      exercises: exerciseList,
    })
    .catch({ wod_format: '', exercises: [] }),
});

export type ParsedWorkout = z.infer<typeof parsedWorkoutSchema>;
export type ParsedExercise = ParsedWorkout['strength_skill'][number];

// Contract sent to the model as a JSON Schema so it answers in this exact shape.
// Kept separate from `parsedWorkoutSchema`: that one is deliberately lenient and
// uses transforms, which have no JSON Schema representation.
const wireExercise = z.object({
  exercise_name: z.string(),
  weight: z.number().nullable(),
  unit: z.enum(['kg', 'lb', '%']).nullable(),
  reps: z.number().nullable(),
  sets: z.number().nullable(),
  rep_scheme: z.array(z.number()).nullable(),
});

export const workoutResponseSchema = z.object({
  warmup_notes: z.string(),
  strength_skill: z.array(wireExercise),
  wod: z.object({
    wod_format: z.string(),
    exercises: z.array(wireExercise),
  }),
});
