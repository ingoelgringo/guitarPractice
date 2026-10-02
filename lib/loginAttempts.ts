/**
 * Begränsning av inloggningsförsök per IP. Räkningen ligger i processens minne,
 * vilket räcker med en enda process. Nginx har dessutom `limit_req` framför.
 */

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

interface Attempts {
  failures: number;
  /** När räkningen börjar om. Efter det femte felet är det spärrens slut. */
  resetAt: number;
}

const attemptsByIp = new Map<string, Attempts>();

/**
 * Påbörjar ett inloggningsförsök. Försöket räknas som misslyckat direkt, innan
 * lösenordet har kontrollerats, så att samtidiga anrop inte kan ta sig förbi
 * spärren. Ett lyckat försök nollställer räkningen med `recordSuccessfulLogin`.
 *
 * Ger 0 om försöket får göras, annars antalet sekunder tills IP:n får försöka igen.
 */
export function beginLoginAttempt(ip: string): number {
  const now = Date.now();
  pruneExpired(now);

  const attempts = attemptsByIp.get(ip) ?? { failures: 0, resetAt: now + LOCKOUT_MS };
  if (attempts.failures >= MAX_FAILED_ATTEMPTS) {
    return Math.ceil((attempts.resetAt - now) / 1000);
  }
  attempts.failures++;
  // Spärren varar en kvart från det femte felet, inte från det första.
  if (attempts.failures === MAX_FAILED_ATTEMPTS) attempts.resetAt = now + LOCKOUT_MS;
  attemptsByIp.set(ip, attempts);
  return 0;
}

export function recordSuccessfulLogin(ip: string): void {
  attemptsByIp.delete(ip);
}

function pruneExpired(now: number): void {
  for (const [ip, attempts] of attemptsByIp) {
    if (attempts.resetAt <= now) attemptsByIp.delete(ip);
  }
}

/**
 * Klientens IP. Appen lyssnar bara på 127.0.0.1 bakom Nginx, som sätter
 * `X-Real-IP` till `$remote_addr`, så rubrikerna går inte att förfalska utifrån.
 * Utan proxy (lokalt) saknas de, och alla anrop delar då samma räkning.
 */
export function clientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}
