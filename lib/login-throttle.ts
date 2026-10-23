// Brute-force limits for the PIN. The per-IP limit stops casual guessing; the global
// ceiling bounds an attacker who rotates IPs. The trade-off: during a sustained
// attack the owner can't start a *new* session (an existing cookie keeps working).
export const IP_LIMIT = { failures: 5, windowMinutes: 15 };
export const GLOBAL_LIMIT = { failures: 30, windowMinutes: 60 };

export function isLoginBlocked(counts: { ipFailures: number; globalFailures: number }): boolean {
  return counts.ipFailures >= IP_LIMIT.failures || counts.globalFailures >= GLOBAL_LIMIT.failures;
}
