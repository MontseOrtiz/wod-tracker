import type { ParsedExercise } from '@/lib/workout-schema';
import type { SaveSessionInput } from '@/lib/session-schema';

export type ExerciseRow = {
  id: string;         // local key only — never sent to the database
  exercise_name: string;
  weight: string;     // string so the input can be empty; converted to number on save
  reps: string;
  sets: string;
  unit: 'kg' | 'lb' | '%';
};

export type WorkoutForm = {
  warmupNotes: string;
  strengthExercises: ExerciseRow[];
  wodFormat: string;
  wodResult: string;
  wodExercises: ExerciseRow[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function makeExercise(): ExerciseRow {
  return { id: crypto.randomUUID(), exercise_name: '', weight: '', reps: '', sets: '', unit: 'lb' };
}

export function getInitialData(): WorkoutForm {
  return {
    warmupNotes: '',
    strengthExercises: [makeExercise()],
    wodFormat: '',
    wodResult: '',
    wodExercises: [makeExercise()],
  };
}

export function toInt(value: string): number | null {
  return value.trim() !== '' ? parseInt(value, 10) : null;
}

export function toFloat(value: string): number | null {
  return value.trim() !== '' ? parseFloat(value) : null;
}

export function hasValidWorkoutData(formData: WorkoutForm): boolean {
  const hasWarmup = formData.warmupNotes.trim() !== '';
  const hasStrength = formData.strengthExercises.some(ex => ex.exercise_name.trim() !== '');
  const hasWod =
    formData.wodFormat.trim() !== '' ||
    formData.wodResult.trim() !== '' ||
    formData.wodExercises.some(ex => ex.exercise_name.trim() !== '');
  return hasWarmup || hasStrength || hasWod;
}

export function toExerciseRows(exercises: ParsedExercise[]): ExerciseRow[] {
  if (exercises.length === 0) return [makeExercise()];
  return exercises.map(ex => ({
    id: crypto.randomUUID(),
    exercise_name: ex.exercise_name,
    weight: ex.weight != null ? String(ex.weight) : '',
    reps: ex.reps != null ? String(ex.reps) : '',
    sets: ex.sets != null ? String(ex.sets) : '',
    unit: ex.unit ?? 'lb',
  }));
}


function toPayload(rows: ExerciseRow[]): SaveSessionInput['strength'] {
  return rows
    .filter(ex => ex.exercise_name.trim())
    .map(ex => ({
      exercise_name: ex.exercise_name.trim(),
      sets: toInt(ex.sets),
      reps: toInt(ex.reps),
      weight: toFloat(ex.weight),
      unit: toFloat(ex.weight) !== null ? ex.unit : null,
    }));
}

export function buildSavePayload(form: WorkoutForm, sessionDate: string): SaveSessionInput {
  return {
    session_date: sessionDate,
    warmup_notes: form.warmupNotes,
    wod_format: form.wodFormat,
    wod_result: form.wodResult,
    strength: toPayload(form.strengthExercises),
    wod: toPayload(form.wodExercises),
  };
}
