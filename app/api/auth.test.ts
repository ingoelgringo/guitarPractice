import bcrypt from "bcryptjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as login } from "./login/route";
import { POST as logout } from "./logout/route";
import { isOwner, SESSION_COOKIE } from "../../lib/auth";

const PASSWORD = "korrekt häst batteri";

beforeEach(() => {
  vi.stubEnv("OWNER_USERNAME", "ingo");
  vi.stubEnv("OWNER_PASSWORD_HASH", bcrypt.hashSync(PASSWORD, 4));
  vi.stubEnv("SESSION_SECRET", "test-hemlighet-som-är-tillräckligt-lång");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

// Varje test har en egen IP, så att begränsningen av försök inte läcker mellan testerna.
let nextIp = 1;
function newIp(): string {
  return `10.0.0.${nextIp++}`;
}

function loginRequest(username: string, password: string, ip = newIp()): Request {
  return new Request("http://localhost/api/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": ip },
    body: JSON.stringify({ username, password }),
  });
}

/** Hela Set-Cookie-raden för sessionen. */
function sessionSetCookie(response: Response): string | undefined {
  return response.headers.getSetCookie().find((c) => c.startsWith(`${SESSION_COOKIE}=`));
}

/** Cookien som svaret sätter, som den skulle skickas tillbaka i nästa anrop. */
function sessionCookieFrom(response: Response): string | undefined {
  return sessionSetCookie(response)?.split(";")[0];
}

function requestWithCookie(cookie: string | undefined): Request {
  return new Request("http://localhost/api/library", {
    headers: cookie ? { cookie } : {},
  });
}

describe("Inloggning", () => {
  it("rätt användarnamn och lösenord ger en sessionscookie som gör anropet till Ägarens", async () => {
    const response = await login(loginRequest("ingo", PASSWORD));

    expect(response.status).toBe(200);
    const cookie = sessionCookieFrom(response);
    expect(cookie).toBeDefined();
    expect(isOwner(requestWithCookie(cookie))).toBe(true);
  });

  it("sessionscookien är httpOnly, secure och SameSite och lever länge", async () => {
    const response = await login(loginRequest("ingo", PASSWORD));

    const header = sessionSetCookie(response)!;
    expect(header).toMatch(/HttpOnly/i);
    expect(header).toMatch(/Secure/i);
    expect(header).toMatch(/SameSite=Lax/i);
    const maxAge = Number(/Max-Age=(\d+)/i.exec(header)?.[1]);
    expect(maxAge).toBeGreaterThanOrEqual(90 * 24 * 60 * 60);
  });

  it("fel lösenord ger 401 och ingen cookie", async () => {
    const response = await login(loginRequest("ingo", "fel"));

    expect(response.status).toBe(401);
    expect(sessionCookieFrom(response)).toBeUndefined();
  });

  it("okänt användarnamn ger 401 och ingen cookie", async () => {
    const response = await login(loginRequest("någon", PASSWORD));

    expect(response.status).toBe(401);
    expect(sessionCookieFrom(response)).toBeUndefined();
  });

  it("ett anrop utan giltiga uppgifter ger 400", async () => {
    const request = new Request("http://localhost/api/login", {
      method: "POST",
      headers: { "x-real-ip": newIp() },
      body: "inte json",
    });

    expect((await login(request)).status).toBe(400);
  });

  it("utan konfigurerat konto går det inte att logga in", async () => {
    vi.stubEnv("OWNER_PASSWORD_HASH", "");

    const response = await login(loginRequest("ingo", PASSWORD));

    expect(response.status).toBe(401);
  });
});

describe("Begränsning av inloggningsförsök", () => {
  it("efter fem felaktiga försök från samma IP spärras även rätt lösenord", async () => {
    const ip = newIp();
    for (let i = 0; i < 5; i++) {
      expect((await login(loginRequest("ingo", "fel", ip))).status).toBe(401);
    }

    const response = await login(loginRequest("ingo", PASSWORD, ip));

    expect(response.status).toBe(429);
    expect(Number(response.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(sessionCookieFrom(response)).toBeUndefined();
  });

  it("spärren gäller bara den IP som gissade fel", async () => {
    const ip = newIp();
    for (let i = 0; i < 5; i++) await login(loginRequest("ingo", "fel", ip));

    expect((await login(loginRequest("ingo", PASSWORD, newIp()))).status).toBe(200);
  });

  it("samtidiga felaktiga försök kan inte ta sig förbi spärren", async () => {
    const ip = newIp();
    const responses = await Promise.all(
      Array.from({ length: 10 }, () => login(loginRequest("ingo", "fel", ip))),
    );

    const statuses = responses.map((r) => r.status);
    expect(statuses.filter((s) => s === 401)).toHaveLength(5);
    expect(statuses.filter((s) => s === 429)).toHaveLength(5);
  });

  it("spärren varar en kvart från det femte felet", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const ip = newIp();
    for (let i = 0; i < 4; i++) await login(loginRequest("ingo", "fel", ip));
    vi.setSystemTime(Date.now() + 14 * 60 * 1000);
    await login(loginRequest("ingo", "fel", ip));

    vi.setSystemTime(Date.now() + 14 * 60 * 1000);

    expect((await login(loginRequest("ingo", PASSWORD, ip))).status).toBe(429);
  });

  it("spärren släpper efter en kvart", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const ip = newIp();
    for (let i = 0; i < 5; i++) await login(loginRequest("ingo", "fel", ip));

    vi.setSystemTime(Date.now() + 15 * 60 * 1000 + 1);

    expect((await login(loginRequest("ingo", PASSWORD, ip))).status).toBe(200);
  });

  it("en lyckad inloggning nollställer räkningen", async () => {
    const ip = newIp();
    for (let i = 0; i < 4; i++) await login(loginRequest("ingo", "fel", ip));
    await login(loginRequest("ingo", PASSWORD, ip));
    for (let i = 0; i < 4; i++) await login(loginRequest("ingo", "fel", ip));

    expect((await login(loginRequest("ingo", PASSWORD, ip))).status).toBe(200);
  });

  it("IP-adressen tas från X-Forwarded-For när X-Real-IP saknas", async () => {
    const ip = newIp();
    const request = (password: string) =>
      new Request("http://localhost/api/login", {
        method: "POST",
        headers: { "x-forwarded-for": `${ip}, 127.0.0.1` },
        body: JSON.stringify({ username: "ingo", password }),
      });
    for (let i = 0; i < 5; i++) await login(request("fel"));

    expect((await login(request(PASSWORD))).status).toBe(429);
  });
});

describe("Utloggning", () => {
  it("utloggning rensar sessionscookien", async () => {
    const response = await logout();

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/");
    const header = sessionSetCookie(response)!;
    expect(header).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);
    expect(isOwner(requestWithCookie(sessionCookieFrom(response)))).toBe(false);
  });
});

describe("isOwner", () => {
  async function ownerCookie(): Promise<string> {
    return sessionCookieFrom(await login(loginRequest("ingo", PASSWORD)))!;
  }

  it("ett anrop utan cookie kommer inte från Ägaren", () => {
    expect(isOwner(requestWithCookie(undefined))).toBe(false);
  });

  it("en förfalskad cookie godtas inte", async () => {
    const [name, value] = (await ownerCookie()).split("=");
    const forged = `${name}=${value.slice(0, -2)}${value.endsWith("AA") ? "BB" : "AA"}`;

    expect(isOwner(requestWithCookie(forged))).toBe(false);
    expect(isOwner(requestWithCookie(`${SESSION_COOKIE}=owner`))).toBe(false);
  });

  it("en cookie signerad med en annan hemlighet godtas inte", async () => {
    const cookie = await ownerCookie();
    vi.stubEnv("SESSION_SECRET", "en-helt-annan-hemlighet-som-också-är-lång");

    expect(isOwner(requestWithCookie(cookie))).toBe(false);
  });

  it("sessionen gäller i 180 dagar och löper sedan ut", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const cookie = await ownerCookie();
    const day = 24 * 60 * 60 * 1000;
    const start = Date.now();

    vi.setSystemTime(start + 179 * day);
    expect(isOwner(requestWithCookie(cookie))).toBe(true);

    vi.setSystemTime(start + 181 * day);
    expect(isOwner(requestWithCookie(cookie))).toBe(false);
  });

  it("utan SESSION_SECRET är ingen Ägare", async () => {
    const cookie = await ownerCookie();
    vi.stubEnv("SESSION_SECRET", "");

    expect(isOwner(requestWithCookie(cookie))).toBe(false);
  });
});
