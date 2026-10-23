import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

// Single-user access control: the owner proves they know the PIN once and gets a
// signed, expiring cookie. Everything here is pure (the secret is a parameter)
// so it can be unit tested; the Next.js glue lives in `auth-server.ts`.

export const SESSION_COOKIE = 'wod_session';
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

function sign(secret: string, payload: string): Buffer {
  return createHmac('sha256', secret).update(payload).digest();
}

// Token format: `<expiry as unix seconds>.<hex hmac of "v1.<expiry>">`.
export function createSessionToken(secret: string, nowMs: number = Date.now()): string {
  const expiry = Math.floor(nowMs / 1000) + SESSION_TTL_SECONDS;
  return `${expiry}.${sign(secret, `v1.${expiry}`).toString('hex')}`;
}

export function verifySessionToken(
  token: string | undefined,
  secret: string,
  nowMs: number = Date.now()
): boolean {
  if (!token) return false;
  const [expiryText, signatureHex, ...rest] = token.split('.');
  if (rest.length > 0 || !expiryText || !signatureHex) return false;
  if (!/^\d+$/.test(expiryText)) return false;
  if (Number(expiryText) <= Math.floor(nowMs / 1000)) return false;

  const expected = sign(secret, `v1.${expiryText}`);
  const given = Buffer.from(signatureHex, 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// Hashing both sides gives equal-length buffers, so the comparison is constant
// time regardless of the input's length.
export function pinMatches(input: string, expected: string): boolean {
  const a = createHash('sha256').update(input).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}
