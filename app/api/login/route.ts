import { NextResponse } from "next/server";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SESSION_MAX_AGE_SECONDS,
  verifyCredentials,
} from "../../../lib/auth";
import { beginLoginAttempt, clientIp, recordSuccessfulLogin } from "../../../lib/loginAttempts";

/** Loggar in Ägaren. Tar `{ username, password }` som JSON. */
export async function POST(request: Request) {
  const credentials = await readCredentials(request);
  if (!credentials) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const ip = clientIp(request);
  const retryAfter = beginLoginAttempt(ip);
  if (retryAfter > 0) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  if (!(await verifyCredentials(credentials.username, credentials.password))) {
    return NextResponse.json({ error: "Wrong username or password." }, { status: 401 });
  }

  const token = createSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Login is not configured on the server." }, { status: 500 });
  }
  recordSuccessfulLogin(ip);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}

async function readCredentials(request: Request): Promise<{ username: string; password: string } | null> {
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) return null;
    const { username, password } = body as Record<string, unknown>;
    if (typeof username !== "string" || typeof password !== "string") return null;
    if (!username || !password) return null;
    return { username, password };
  } catch {
    return null;
  }
}
