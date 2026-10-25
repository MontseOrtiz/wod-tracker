import 'server-only';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from './auth';

export function getAuthConfig(): { pin: string; secret: string } {
  const pin = process.env.APP_PIN;
  const secret = process.env.AUTH_SECRET;
  // Fail closed: without both values nobody can sign in or write.
  if (!pin || !secret) throw new Error('Missing APP_PIN or AUTH_SECRET');
  return { pin, secret };
}

export async function isAuthenticated(): Promise<boolean> {
  // Read the cookies first, unconditionally: it is what makes every page behind this
  // check dynamic. Returning early without it would let a build that lacks AUTH_SECRET
  // prerender the PIN form as a static page.
  const store = await cookies();
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  return verifySessionToken(store.get(SESSION_COOKIE)?.value, secret);
}

// For Route Handlers: returns a 401 response to send back, or null when the caller is signed in.
export async function requireAuth(): Promise<NextResponse | null> {
  if (await isAuthenticated()) return null;
  return NextResponse.json(
    { error: 'Tu sesión expiró o no tienes acceso. Recarga la página e ingresa tu PIN.' },
    { status: 401 }
  );
}
