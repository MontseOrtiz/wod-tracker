// A rep scheme lists the reps of each round in order: 10-15-20-15-10, 21-15-9.
// Two rounds is the minimum; a single number is just plain reps.
export const MIN_ROUNDS = 2;
export const MAX_ROUNDS = 50;
export const MAX_REPS_PER_ROUND = 1000;

// Accepts any non-digit separator so "10-15-20", "10, 15, 20" and "10 15 20" all work.
export function parseRepScheme(text: string): number[] | null {
  const rounds = text.split(/\D+/).filter(Boolean).map(Number);
  const valid =
    rounds.length >= MIN_ROUNDS &&
    rounds.length <= MAX_ROUNDS &&
    rounds.every(n => n >= 1 && n <= MAX_REPS_PER_ROUND);
  return valid ? rounds : null;
}

export function totalReps(scheme: number[]): number {
  return scheme.reduce((sum, reps) => sum + reps, 0);
}

export function formatRepScheme(scheme: number[], separator = '-'): string {
  return scheme.join(separator);
}
