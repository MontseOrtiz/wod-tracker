// `toISOString()` is UTC, so logging a late-evening workout in a timezone behind UTC
// would store tomorrow's date. Build YYYY-MM-DD from local components instead.
export function todayLocal(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
