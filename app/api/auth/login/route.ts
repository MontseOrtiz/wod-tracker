import { NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_TTL_SECONDS, createSessionToken, pinMatches } from '@/lib/auth';
import { getAuthConfig } from '@/lib/auth-server';
import { GLOBAL_LIMIT, IP_LIMIT, isLoginBlocked } from '@/lib/login-throttle';
import { getClientIp } from '@/lib/rate-limit';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

function fail(error: string, status: number, headers?: Record<string, string>) {
  return NextResponse.json({ error }, { status, headers });
}

export async function POST(request: Request) {
  let config: { pin: string; secret: string };
  try {
    config = getAuthConfig();
  } catch (err) {
    console.error('auth misconfigured:', err);
    return fail('El acceso no está configurado.', 500);
  }

  let pin: unknown;
  try {
    ({ pin } = await request.json());
  } catch {
    return fail('Solicitud inválida.', 400);
  }
  if (typeof pin !== 'string' || pin === '' || pin.length > 100) return fail('Solicitud inválida.', 400);

  const supabase = createServiceClient();
  const ip = getClientIp(request);

  // Check the lockout before comparing, so a locked client learns nothing about the PIN.
  const [ipCount, globalCount] = await Promise.all([
    supabase
      .from('login_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', minutesAgo(IP_LIMIT.windowMinutes)),
    supabase
      .from('login_attempts')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', minutesAgo(GLOBAL_LIMIT.windowMinutes)),
  ]);
  if (ipCount.error || globalCount.error) {
    console.error('login throttle lookup failed:', ipCount.error ?? globalCount.error);
    return fail('No se pudo verificar el acceso. Intenta de nuevo.', 503);
  }
  if (isLoginBlocked({ ipFailures: ipCount.count ?? 0, globalFailures: globalCount.count ?? 0 })) {
    return fail('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.', 429, {
      'Retry-After': String(IP_LIMIT.windowMinutes * 60),
    });
  }

  if (!pinMatches(pin, config.pin)) {
    const { error } = await supabase.from('login_attempts').insert({ ip });
    if (error) console.error('could not record failed login:', error);
    return fail('PIN incorrecto.', 401);
  }

  // Success: forgive this IP's earlier failures and drop stale rows from everyone.
  await supabase.from('login_attempts').delete().eq('ip', ip);
  await supabase.from('login_attempts').delete().lt('created_at', minutesAgo(24 * 60));

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(config.secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
