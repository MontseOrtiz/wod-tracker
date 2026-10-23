import { describe, expect, it } from 'vitest';
import { todayLocal } from './date';

describe('todayLocal', () => {
  it('uses the local calendar day, not the UTC one', () => {
    // 23:30 local on Oct 23: in a timezone behind UTC, toISOString() would already say Oct 24.
    expect(todayLocal(new Date(2026, 9, 23, 23, 30))).toBe('2026-10-23');
  });

  it('zero-pads month and day', () => {
    expect(todayLocal(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
  });
});
