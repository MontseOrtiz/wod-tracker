// Best-effort sliding-window limiter, kept in memory.
// On serverless each warm instance has its own counter, so this only blunts
// casual abuse. Swap for a shared store (Upstash, Vercel Firewall) to enforce it globally.
const hits = new Map<string, number[]>();

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter(t => now - t < windowMs);

  if (recent.length >= limit) {
    hits.set(key, recent);
    return { allowed: false, retryAfterSeconds: Math.ceil((recent[0] + windowMs - now) / 1000) };
  }

  recent.push(now);
  hits.set(key, recent);

  // Drop idle keys so the map can't grow without bound.
  if (hits.size > 1000) {
    for (const [k, times] of hits) {
      if (times.every(t => now - t >= windowMs)) hits.delete(k);
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}
