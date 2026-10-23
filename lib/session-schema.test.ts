import { describe, expect, it } from 'vitest';
import { saveSessionSchema } from './session-schema';

const base = { session_date: '2026-10-23', warmup_notes: '', wod_format: '', wod_result: '', strength: [], wod: [] };
const exercise = { exercise_name: 'Thruster', weight: 43, unit: 'kg', reps: 5, sets: 3 };
const parse = (overrides: object) => saveSessionSchema.safeParse({ ...base, ...overrides });

describe('saveSessionSchema (untrusted browser input)', () => {
  it('accepts a minimal workout', () => {
    expect(parse({ warmup_notes: 'rowing' }).success).toBe(true);
  });

  it('rejects an empty workout', () => {
    expect(parse({}).success).toBe(false);
  });

  it.each(['23/10/2026', '2026-13-45', '', 'today'])('rejects the date %j', date => {
    expect(parse({ warmup_notes: 'x', session_date: date }).success).toBe(false);
  });

  it('rejects negative weights and non-integer reps', () => {
    expect(parse({ wod: [{ ...exercise, weight: -5 }] }).success).toBe(false);
    expect(parse({ wod: [{ ...exercise, reps: 2.5 }] }).success).toBe(false);
  });

  it('rejects unknown units and nameless exercises', () => {
    expect(parse({ wod: [{ ...exercise, unit: 'stone' }] }).success).toBe(false);
    expect(parse({ wod: [{ ...exercise, exercise_name: '   ' }] }).success).toBe(false);
  });

  it('caps the size of the lists and texts', () => {
    expect(parse({ wod: Array(51).fill(exercise) }).success).toBe(false);
    expect(parse({ warmup_notes: 'x'.repeat(2001) }).success).toBe(false);
  });

  it('drops the unit when there is no weight', () => {
    const result = parse({ wod: [{ ...exercise, weight: null }] });
    expect(result.success && result.data.wod[0].unit).toBeNull();
  });

  describe('rep ladders', () => {
    it('derives sets and clears reps so the client cannot contradict the scheme', () => {
      const result = parse({ wod: [{ ...exercise, rep_scheme: [21, 15, 9], sets: 99, reps: 7 }] });
      expect(result.success && result.data.wod[0]).toMatchObject({ rep_scheme: [21, 15, 9], sets: 3, reps: null });
    });

    it('stores null when no scheme is sent', () => {
      const result = parse({ wod: [exercise] });
      expect(result.success && result.data.wod[0].rep_scheme).toBeNull();
    });

    it.each([[[5]], [[5, 0]], [Array(51).fill(1)], [[1, 1001]]])('rejects the scheme %j', scheme => {
      expect(parse({ wod: [{ ...exercise, rep_scheme: scheme }] }).success).toBe(false);
    });
  });
});
