import { createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

/**
 * Ägarens inloggning. Det finns exakt ett konto, definierat i miljövariabler
 * (`OWNER_USERNAME`, `OWNER_PASSWORD_HASH`), och ingen användartabell.
 *
 * Sessionen är en cookie med utgångstid och en HMAC-signatur med `SESSION_SECRET`.
 * Den lagras inte på servern, så ett byte av hemligheten loggar ut alla sessioner.
 */

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;

/** Attributen för sessionscookien. Utloggningen sätter samma med livslängd 0. */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
} as const;

// En giltig bcrypt-hash som jämförs mot när användarnamnet är fel, så att svarstiden
// inte avslöjar om användarnamnet finns. Kostnaden är densamma som i scripts/hash-password.mjs.
const DUMMY_HASH = "$2b$12$2JCRaKf2Kp0.wFHyiWvtEuHQdhX17pq5w3u3UjCxEL9eNswY0mGMu";

/** Sant om användarnamn och lösenord hör till Ägarens konto. */
export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const ownerUsername = process.env.OWNER_USERNAME;
  const ownerHash = process.env.OWNER_PASSWORD_HASH;
  if (!ownerUsername || !ownerHash) return false;

  const usernameMatches = safeEqual(username, ownerUsername);
  const passwordMatches = await bcrypt.compare(password, usernameMatches ? ownerHash : DUMMY_HASH);
  return usernameMatches && passwordMatches;
}

/** En ny signerad sessionstoken, eller null om `SESSION_SECRET` saknas. */
export function createSessionToken(): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  return `${expiresAt}.${sign(String(expiresAt), secret)}`;
}

/** Sant om token är en giltig, ej utgången session signerad med den aktuella hemligheten. */
function isOwnerSession(token: string | undefined): boolean {
  const secret = sessionSecret();
  if (!secret || !token) return false;

  const [expiresAt, signature, ...rest] = token.split(".");
  if (rest.length > 0 || !expiresAt || !signature || !/^\d+$/.test(expiresAt)) return false;
  if (!safeEqual(signature, sign(expiresAt, secret))) return false;
  return Number(expiresAt) > Date.now();
}

/**
 * Avgör om anropet kommer från den inloggade Ägaren. Allt API som kräver
 * inloggning ska svara 401 när den ger falskt.
 */
export function isOwner(request: Request): boolean {
  return isOwnerSession(readCookie(request.headers.get("cookie"), SESSION_COOKIE));
}

/** Som `isOwner`, för sidor och layouter som inte har något `Request`. */
export async function isOwnerInPage(): Promise<boolean> {
  return isOwnerSession((await cookies()).get(SESSION_COOKIE)?.value);
}

function sessionSecret(): string | undefined {
  return process.env.SESSION_SECRET || undefined;
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(`owner:${value}`).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index !== -1 && part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return undefined;
}
