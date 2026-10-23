import { describe, expect, it } from 'vitest';
import { formatRepScheme, MAX_ROUNDS, parseRepScheme, totalReps } from './rep-scheme';

describe('parseRepScheme', () => {
  it.each([
    ['10-15-20-15-10', [10, 15, 20, 15, 10]],
    ['21, 15, 9', [21, 15, 9]],
    ['10 15', [10, 15]],
    ['21–15–9', [21, 15, 9]], // en dash
  ])('reads %j', (input, expected) => {
    expect(parseRepScheme(input)).toEqual(expected);
  });

  it.each(['', 'abc', '7', '10-0-5', '5-1001', Array(MAX_ROUNDS + 1).fill(1).join('-')])(
    'rejects %j',
    input => {
      expect(parseRepScheme(input)).toBeNull();
    }
  );

  it('accepts exactly the maximum number of rounds', () => {
    expect(parseRepScheme(Array(MAX_ROUNDS).fill(1).join('-'))).toHaveLength(MAX_ROUNDS);
  });
});

describe('totalReps / formatRepScheme', () => {
  it('sums the rounds', () => {
    expect(totalReps([10, 15, 20, 15, 10])).toBe(70);
  });

  it('formats with the dash by default and a custom separator on request', () => {
    expect(formatRepScheme([21, 15, 9])).toBe('21-15-9');
    expect(formatRepScheme([21, 15, 9], ' · ')).toBe('21 · 15 · 9');
  });
});
