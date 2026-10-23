import { describe, expect, it } from 'vitest';
import { SESSION_TTL_SECONDS, createSessionToken, pinMatches, verifySessionToken } from './auth';

const SECRET = 'test-secret-with-enough-entropy';
const NOW = Date.UTC(2026, 9, 24, 12, 0, 0);

describe('session tokens', () => {
  it('accepts a freshly created token', () => {
    expect(verifySessionToken(createSessionToken(SECRET, NOW), SECRET, NOW)).toBe(true);
  });

  it('is valid until just before it expires and invalid at the expiry second', () => {
    const token = createSessionToken(SECRET, NOW);
    const expiryMs = NOW + SESSION_TTL_SECONDS * 1000;
    expect(verifySessionToken(token, SECRET, expiryMs - 1000)).toBe(true);
    expect(verifySessionToken(token, SECRET, expiryMs)).toBe(false);
  });

  it('rejects a token signed with another secret', () => {
    expect(verifySessionToken(createSessionToken('other-secret', NOW), SECRET, NOW)).toBe(false);
  });

  it('rejects a token whose expiry was extended (the signature covers it)', () => {
    const [expiry, signature] = createSessionToken(SECRET, NOW).split('.');
    const forged = `${Number(expiry) + 999_999}.${signature}`;
    expect(verifySessionToken(forged, SECRET, NOW)).toBe(false);
  });

  it('rejects a flipped signature', () => {
    const [expiry, signature] = createSessionToken(SECRET, NOW).split('.');
    const flipped = (signature[0] === 'a' ? 'b' : 'a') + signature.slice(1);
    expect(verifySessionToken(`${expiry}.${flipped}`, SECRET, NOW)).toBe(false);
  });

  it.each([undefined, '', 'garbage', '123', '123.', '.abc', '12.ab.cd', 'abc.def', '-5.ab', '1e9.ab'])(
    'rejects the malformed token %j',
    token => {
      expect(verifySessionToken(token, SECRET, NOW)).toBe(false);
    }
  );

  it('rejects a signature of the wrong length', () => {
    const [expiry, signature] = createSessionToken(SECRET, NOW).split('.');
    expect(verifySessionToken(`${expiry}.${signature.slice(0, -2)}`, SECRET, NOW)).toBe(false);
  });
});

describe('pinMatches', () => {
  it('accepts the exact PIN', () => {
    expect(pinMatches('482913', '482913')).toBe(true);
  });

  it.each(['482914', '48291', '4829133', '', ' 482913', '482913 '])('rejects %j', input => {
    expect(pinMatches(input, '482913')).toBe(false);
  });

  it('works for non-numeric passphrases too', () => {
    expect(pinMatches('correct horse', 'correct horse')).toBe(true);
    expect(pinMatches('correct Horse', 'correct horse')).toBe(false);
  });
});
