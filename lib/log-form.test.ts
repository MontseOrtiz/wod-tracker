import { describe, expect, it } from 'vitest';
import {
  buildSavePayload,
  getInitialData,
  hasValidWorkoutData,
  makeExercise,
  toExerciseRows,
  type ExerciseRow,
} from './log-form';
import { saveSessionSchema } from './session-schema';

const row = (overrides: Partial<ExerciseRow>): ExerciseRow => ({ ...makeExercise(), ...overrides });

describe('hasValidWorkoutData', () => {
  it('is false for the untouched form', () => {
    expect(hasValidWorkoutData(getInitialData())).toBe(false);
  });

  it('is true with only a warmup note, a WOD result or a named exercise', () => {
    expect(hasValidWorkoutData({ ...getInitialData(), warmupNotes: 'rowing' })).toBe(true);
    expect(hasValidWorkoutData({ ...getInitialData(), wodResult: '8:42' })).toBe(true);
    expect(hasValidWorkoutData({ ...getInitialData(), strengthExercises: [row({ exercise_name: 'Squat' })] })).toBe(true);
  });

  it('ignores whitespace-only input', () => {
    expect(hasValidWorkoutData({ ...getInitialData(), warmupNotes: '   ' })).toBe(false);
  });
});

describe('toExerciseRows', () => {
  it('always returns at least one editable row', () => {
    expect(toExerciseRows([])).toHaveLength(1);
  });

  it('turns a parsed ladder into ladder mode with editable text', () => {
    const [r] = toExerciseRows([
      { exercise_name: 'Thruster', weight: 43, unit: 'kg', reps: null, sets: 5, rep_scheme: [10, 15, 20, 15, 10] },
    ]);
    expect(r).toMatchObject({ isLadder: true, repScheme: '10-15-20-15-10', weight: '43', unit: 'kg' });
  });

  it('defaults the unit to lb', () => {
    const [r] = toExerciseRows([
      { exercise_name: 'Press', weight: 95, unit: null, reps: 5, sets: 3, rep_scheme: null },
    ]);
    expect(r).toMatchObject({ isLadder: false, unit: 'lb' });
  });
});

describe('buildSavePayload', () => {
  const form = {
    ...getInitialData(),
    wodFormat: 'AMRAP 12',
    strengthExercises: [
      row({ exercise_name: ' Back Squat ', sets: '5', reps: '5', weight: '100', unit: 'kg' }),
      row({ exercise_name: '   ' }), // blank rows are skipped
    ],
    wodExercises: [row({ exercise_name: 'Thruster', isLadder: true, repScheme: '21-15-9', weight: '43', unit: 'kg' })],
  };
  const payload = buildSavePayload(form, '2026-10-23');

  it('skips blank rows and trims names', () => {
    expect(payload.strength).toHaveLength(1);
    expect(payload.strength[0]).toMatchObject({ exercise_name: 'Back Squat', sets: 5, reps: 5, weight: 100 });
  });

  it('sends a ladder as a scheme, with sets = rounds and no reps', () => {
    expect(payload.wod[0]).toMatchObject({ rep_scheme: [21, 15, 9], sets: 3, reps: null });
  });

  it('drops an unreadable scheme instead of saving it half-right', () => {
    const bad = buildSavePayload(
      { ...form, wodExercises: [row({ exercise_name: 'Thruster', isLadder: true, repScheme: 'abc', sets: '4', reps: '8' })] },
      '2026-10-23'
    );
    expect(bad.wod[0]).toMatchObject({ rep_scheme: null, sets: null, reps: null });
  });

  it('sends no unit when there is no weight', () => {
    const p = buildSavePayload({ ...form, strengthExercises: [row({ exercise_name: 'Pull-ups', reps: '10', unit: 'kg' })] }, '2026-10-23');
    expect(p.strength[0].unit).toBeNull();
  });

  it('produces something the server schema accepts', () => {
    expect(saveSessionSchema.safeParse(payload).success).toBe(true);
  });
});
