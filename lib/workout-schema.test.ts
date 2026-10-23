import { describe, expect, it } from 'vitest';
import { parsedWorkoutSchema } from './workout-schema';

const workoutWith = (exercises: unknown[]) => ({
  warmup_notes: '',
  strength_skill: [],
  wod: { wod_format: '', exercises },
});
const parseExercises = (exercises: unknown[]) => parsedWorkoutSchema.parse(workoutWith(exercises)).wod.exercises;

describe('parsedWorkoutSchema (Gemini output)', () => {
  it('normalises sloppy values from the model', () => {
    const [ex] = parseExercises([{ exercise_name: ' Back Squat ', weight: '135', unit: 'LBS', reps: '5', sets: 5 }]);
    expect(ex).toMatchObject({ exercise_name: 'Back Squat', weight: 135, unit: 'lb', reps: 5, sets: 5 });
  });

  it('accepts a decimal comma in the weight', () => {
    expect(parseExercises([{ exercise_name: 'Press', weight: '42,5', unit: 'kg' }])[0].weight).toBe(42.5);
  });

  it('nulls unreadable numbers instead of failing the photo', () => {
    const [ex] = parseExercises([{ exercise_name: 'Press', weight: '10-12', unit: 'kilos', reps: 3.7 }]);
    expect(ex.weight).toBeNull();
    expect(ex.reps).toBeNull();
    expect(ex.unit).toBeNull(); // a unit without a weight is noise
  });

  it('drops entries without a name and non-objects', () => {
    expect(parseExercises([{ weight: 50 }, 'garbage', null, { exercise_name: 'Pull-ups' }])).toHaveLength(1);
  });

  it('survives wrong container types', () => {
    const result = parsedWorkoutSchema.parse({ warmup_notes: null, strength_skill: 'oops', wod: 'oops' });
    expect(result).toEqual({ warmup_notes: '', strength_skill: [], wod: { wod_format: '', exercises: [] } });
  });

  it('rejects a response that is not an object', () => {
    expect(parsedWorkoutSchema.safeParse(null).success).toBe(false);
    expect(parsedWorkoutSchema.safeParse([]).success).toBe(false);
  });

  describe('rep ladders', () => {
    it('forces sets to the round count and clears reps, whatever the model said', () => {
      const [ex] = parseExercises([{ exercise_name: 'Thruster', rep_scheme: [10, 15, 20, 15, 10], sets: 3, reps: 9 }]);
      expect(ex).toMatchObject({ rep_scheme: [10, 15, 20, 15, 10], sets: 5, reps: null });
    });

    it('turns a single round into plain reps', () => {
      const [ex] = parseExercises([{ exercise_name: 'Thruster', rep_scheme: [7] }]);
      expect(ex).toMatchObject({ rep_scheme: null, reps: 7 });
    });

    it('falls back to sets x reps when the scheme is malformed', () => {
      const [ex] = parseExercises([{ exercise_name: 'Thruster', rep_scheme: [10, 'x', 5], reps: 5, sets: 3 }]);
      expect(ex).toMatchObject({ rep_scheme: null, reps: 5, sets: 3 });
    });

    it('leaves a plain 5x5 untouched when rep_scheme is absent', () => {
      const [ex] = parseExercises([{ exercise_name: 'Squat', weight: 100, unit: 'kg', reps: 5, sets: 5 }]);
      expect(ex).toMatchObject({ rep_scheme: null, reps: 5, sets: 5 });
    });
  });
});
