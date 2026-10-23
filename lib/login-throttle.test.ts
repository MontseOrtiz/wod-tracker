import { describe, expect, it } from 'vitest';
import { GLOBAL_LIMIT, IP_LIMIT, isLoginBlocked } from './login-throttle';

describe('isLoginBlocked', () => {
  it('lets a clean client through', () => {
    expect(isLoginBlocked({ ipFailures: 0, globalFailures: 0 })).toBe(false);
  });

  it('allows one failure fewer than the per-IP limit and blocks at the limit', () => {
    expect(isLoginBlocked({ ipFailures: IP_LIMIT.failures - 1, globalFailures: 0 })).toBe(false);
    expect(isLoginBlocked({ ipFailures: IP_LIMIT.failures, globalFailures: 0 })).toBe(true);
  });

  it('blocks everyone once the global ceiling is hit, even from a fresh IP', () => {
    expect(isLoginBlocked({ ipFailures: 0, globalFailures: GLOBAL_LIMIT.failures - 1 })).toBe(false);
    expect(isLoginBlocked({ ipFailures: 0, globalFailures: GLOBAL_LIMIT.failures })).toBe(true);
  });

  it('keeps the global ceiling above the per-IP limit so one IP cannot trip it alone', () => {
    expect(GLOBAL_LIMIT.failures).toBeGreaterThan(IP_LIMIT.failures);
  });
});
