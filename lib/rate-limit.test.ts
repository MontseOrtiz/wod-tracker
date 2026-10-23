import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getClientIp, rateLimit } from './rate-limit';

const options = { limit: 3, windowMs: 60_000 };

describe('rateLimit', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('allows up to the limit, then blocks with a retry hint', () => {
    for (let i = 0; i < 3; i++) expect(rateLimit('a', options).allowed).toBe(true);
    const blocked = rateLimit('a', options);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(60);
  });

  it('counts each key separately', () => {
    for (let i = 0; i < 3; i++) rateLimit('b', options);
    expect(rateLimit('b', options).allowed).toBe(false);
    expect(rateLimit('c', options).allowed).toBe(true);
  });

  it('lets requests through again once the window has passed', () => {
    for (let i = 0; i < 3; i++) rateLimit('d', options);
    vi.advanceTimersByTime(60_001);
    expect(rateLimit('d', options).allowed).toBe(true);
  });

  it('reports the time left until the oldest hit expires', () => {
    rateLimit('e', options);
    vi.advanceTimersByTime(20_000);
    rateLimit('e', options);
    rateLimit('e', options);
    expect(rateLimit('e', options).retryAfterSeconds).toBe(40);
  });
});

describe('getClientIp', () => {
  it('uses the first address of x-forwarded-for', () => {
    const request = new Request('http://x', { headers: { 'x-forwarded-for': '1.2.3.4, 10.0.0.1' } });
    expect(getClientIp(request)).toBe('1.2.3.4');
  });

  it('falls back when the header is missing', () => {
    expect(getClientIp(new Request('http://x'))).toBe('unknown');
  });
});
