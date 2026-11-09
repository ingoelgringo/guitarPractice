import pg from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as list, POST as create } from "./progressions/route";
import { DELETE as remove, GET as get, PATCH as rename, PUT as save } from "./progressions/[id]/route";
import { POST as duplicate } from "./progressions/[id]/duplicate/route";
import { createSessionToken, SESSION_COOKIE } from "../../lib/auth";
import { closeDb } from "../../lib/db";
import { newProgression, type Progression } from "../../lib/progression";
import { parseProgression, serializeProgression } from "../../lib/progressionDraft";
import { migrate } from "../../scripts/migrate.mjs";

// Testerna går mot en riktig Postgres: `docker compose up -d` lokalt, en service-container i CI.
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://guitarpractice:guitarpractice@localhost:5433/guitarpractice_test";
const SECRET = "test-hemlighet-som-är-tillräckligt-lång";

beforeAll(async () => {
  const client = new pg.Client({ connectionString: TEST_DATABASE_URL });
  await client.connect();
  try {
    await migrate(client);
    await client.query("TRUNCATE progressions");
  } finally {
    await client.end();
  }
});

beforeEach(() => {
  vi.stubEnv("DATABASE_URL", TEST_DATABASE_URL);
  vi.stubEnv("SESSION_SECRET", SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

afterAll(async () => {
  await closeDb();
});

type Who = "owner" | "guest";

function request(path: string, who: Who, init: { method?: string; body?: unknown } = {}): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (who === "owner") headers.cookie = `${SESSION_COOKIE}=${createSessionToken()}`;
  return new Request(`http://localhost${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

/** Ett giltigt id som ingen Ackordföljd har. */
const unknown = "00000000-0000-4000-8000-000000000000";

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

/** En Ackordföljd som går att känna igen på sitt tempo. Delen har ett fast id. */
function progressionAt(tempo: number): Progression {
  const progression = newProgression();
  const verse = { ...progression.sections[0], id: "verse" };
  return { ...progression, tempo, sections: [verse], form: [verse.id] };
}

function documentOf(progression: Progression): unknown {
  return JSON.parse(serializeProgression(progression));
}

function read(document: unknown): Progression | null {
  return parseProgression(JSON.stringify(document));
}

async function createProgression(name: string, progression: Progression): Promise<{ id: string; revision: number }> {
  const response = await create(
    request("/api/progressions", "owner", { method: "POST", body: { name, document: documentOf(progression) } }),
  );
  expect(response.status).toBe(201);
  return response.json();
}

function saveRequest(id: string, progression: Progression, revision: number | "overwrite", who: Who = "owner") {
  const condition = revision === "overwrite" ? { overwrite: true } : { revision };
  return save(
    request(`/api/progressions/${id}`, who, { method: "PUT", body: { ...condition, document: documentOf(progression) } }),
    context(id),
  );
}

async function fetchStored(id: string) {
  const body = await (await get(request(`/api/progressions/${id}`, "owner"), context(id))).json();
  return { ...body, progression: read(body.document) };
}

async function listed(): Promise<{ id: string; name: string; revision: number; updatedAt: string }[]> {
  return (await (await list(request("/api/progressions", "owner"))).json()).progressions;
}

describe("Ackordföljder i Biblioteket utan inloggning", () => {
  it("varje anrop utan session ger 401 och ändrar inget", async () => {
    const { id } = await createProgression("Hemlig", progressionAt(90));

    const responses = await Promise.all([
      list(request("/api/progressions", "guest")),
      create(request("/api/progressions", "guest", { method: "POST", body: { name: "Gästens", document: documentOf(progressionAt(91)) } })),
      get(request(`/api/progressions/${id}`, "guest"), context(id)),
      saveRequest(id, progressionAt(92), 1, "guest"),
      rename(request(`/api/progressions/${id}`, "guest", { method: "PATCH", body: { name: "Omdöpt" } }), context(id)),
      duplicate(request(`/api/progressions/${id}/duplicate`, "guest", { method: "POST" }), context(id)),
      remove(request(`/api/progressions/${id}`, "guest", { method: "DELETE" }), context(id)),
    ]);

    expect(responses.map((r) => r.status)).toEqual([401, 401, 401, 401, 401, 401, 401]);
    const names = (await listed()).map((p) => p.name);
    expect(names).toContain("Hemlig");
    expect(names).not.toContain("Gästens");
    expect(names).not.toContain("Omdöpt");
    expect((await fetchStored(id)).progression.tempo).toBe(90);
  });
});

describe("Skapa, hämta och lista", () => {
  it("en skapad Ackordföljd får ett id och revision 1 och hämtas oförändrad", async () => {
    const progression = progressionAt(120);

    const { id, revision } = await createProgression("Blues i A", progression);
    const stored = await fetchStored(id);

    expect(revision).toBe(1);
    expect(stored).toMatchObject({ id, name: "Blues i A", revision: 1 });
    expect(stored.progression).toEqual(progression);
  });

  it("ett dokument som inte är en Ackordföljd, eller ett namn som saknas, avvisas med 400", async () => {
    const post = (body: unknown) => create(request("/api/progressions", "owner", { method: "POST", body }));

    expect((await post({ name: "Trasig", document: { hello: "world" } })).status).toBe(400);
    expect((await post({ document: documentOf(progressionAt(100)) })).status).toBe(400);
  });

  it("ett okänt id ger 404", async () => {
    expect((await get(request(`/api/progressions/${unknown}`, "owner"), context(unknown))).status).toBe(404);
    expect((await get(request("/api/progressions/inte-ett-id", "owner"), context("inte-ett-id"))).status).toBe(404);
  });

  it("listan visar namn, senast ändrad och revision, senast ändrade först", async () => {
    const first = await createProgression("Först", progressionAt(100));
    const second = await createProgression("Sedan", progressionAt(100));
    await saveRequest(first.id, progressionAt(101), 1);

    const ours = (await listed()).filter((p) => p.id === first.id || p.id === second.id);

    expect(ours).toEqual([
      { id: first.id, name: "Först", revision: 2, updatedAt: expect.any(String) },
      { id: second.id, name: "Sedan", revision: 1, updatedAt: expect.any(String) },
    ]);
  });

  it("Partitur och Ackordföljder är olika sorter: Ackordföljderna syns inte i Partiturens lista", async () => {
    const { GET: listScores } = await import("./library/route");
    const { id } = await createProgression("Bara här", progressionAt(100));

    const { scores } = await (await listScores(request("/api/library", "owner"))).json();

    expect(scores.map((s: { id: string }) => s.id)).not.toContain(id);
  });
});

describe("Spara", () => {
  it("sparning med rätt revision ger ny revision, och det sparade hämtas", async () => {
    const { id } = await createProgression("Spara", progressionAt(100));

    const response = await saveRequest(id, progressionAt(140), 1);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ revision: 2 });
    expect(await fetchStored(id)).toMatchObject({ revision: 2, progression: progressionAt(140) });
  });

  it("sparning med fel revision ger 409 med serverns revision och ändrar inget", async () => {
    const { id } = await createProgression("Konflikt", progressionAt(100));
    await saveRequest(id, progressionAt(110), 1);

    const response = await saveRequest(id, progressionAt(120), 1);

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ revision: 2 });
    expect((await fetchStored(id)).progression.tempo).toBe(110);
  });

  it("en sparning som redan har gjorts ger ingen konflikt", async () => {
    const { id } = await createProgression("Igen", progressionAt(100));
    const mine = progressionAt(130);
    await saveRequest(id, mine, 1);

    const response = await saveRequest(id, mine, 1);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ revision: 2 });
  });

  it("av två samtidiga sparningar med samma revision lyckas bara den ena", async () => {
    const { id } = await createProgression("Samtidigt", progressionAt(100));

    const responses = await Promise.all([
      saveRequest(id, progressionAt(101), 1),
      saveRequest(id, progressionAt(102), 1),
      saveRequest(id, progressionAt(103), 1),
    ]);

    expect(responses.map((r) => r.status).sort()).toEqual([200, 409, 409]);
  });

  it("Skriv över sparar oavsett revision och ger ny revision", async () => {
    const { id } = await createProgression("Över", progressionAt(100));
    await saveRequest(id, progressionAt(110), 1);

    const response = await saveRequest(id, progressionAt(150), "overwrite");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ revision: 3 });
    expect(await fetchStored(id)).toMatchObject({ revision: 3, progression: progressionAt(150) });
  });

  it("sparning av en okänd Ackordföljd ger 404", async () => {
    expect((await saveRequest(unknown, progressionAt(100), 1)).status).toBe(404);
    expect((await saveRequest(unknown, progressionAt(100), "overwrite")).status).toBe(404);
  });

  it("sparning utan giltig revision eller med ett ogiltigt dokument ger 400", async () => {
    const { id } = await createProgression("Giltig", progressionAt(100));
    const put = (body: unknown) => save(request(`/api/progressions/${id}`, "owner", { method: "PUT", body }), context(id));

    expect((await put({ document: documentOf(progressionAt(100)) })).status).toBe(400);
    expect((await put({ document: { schemaVersion: 1 }, revision: 1 })).status).toBe(400);
  });
});

describe("Byta namn", () => {
  it("ett nytt namn syns i listan och ändrar varken dokumentet eller revisionen", async () => {
    const { id } = await createProgression("Gammalt namn", progressionAt(100));

    const response = await rename(
      request(`/api/progressions/${id}`, "owner", { method: "PATCH", body: { name: "Nytt namn" } }),
      context(id),
    );

    expect(response.status).toBe(204);
    expect(await fetchStored(id)).toMatchObject({ name: "Nytt namn", revision: 1, progression: progressionAt(100) });
    // En öppen flik med revision 1 kan fortfarande spara utan Konflikt
    expect((await saveRequest(id, progressionAt(101), 1)).status).toBe(200);
  });

  it("namnet trimmas, och ett tomt namn eller en okänd Ackordföljd ger fel", async () => {
    const { id } = await createProgression("Namn", progressionAt(100));
    const patch = (target: string, body: unknown) =>
      rename(request(`/api/progressions/${target}`, "owner", { method: "PATCH", body }), context(target));

    expect((await patch(id, { name: "  Trimmat  " })).status).toBe(204);
    expect((await fetchStored(id)).name).toBe("Trimmat");
    expect((await patch(id, { name: "   " })).status).toBe(400);
    expect((await patch(id, {})).status).toBe(400);
    expect((await patch(unknown, { name: "Finns inte" })).status).toBe(404);
  });
});

describe("Kopiera", () => {
  it("en kopia är en ny Ackordföljd med samma innehåll och namnet märkt som kopia", async () => {
    const { id } = await createProgression("Original", progressionAt(100));
    await saveRequest(id, progressionAt(125), 1);

    const response = await duplicate(request(`/api/progressions/${id}/duplicate`, "owner", { method: "POST" }), context(id));

    expect(response.status).toBe(201);
    const copy = await response.json();
    expect(copy).toEqual({ id: expect.any(String), revision: 1, name: "Original (copy)" });
    expect(await fetchStored(copy.id)).toMatchObject({ name: "Original (copy)", progression: progressionAt(125) });
    expect(await fetchStored(id)).toMatchObject({ name: "Original", revision: 2 });
  });

  it("en okänd Ackordföljd går inte att kopiera", async () => {
    const response = await duplicate(
      request(`/api/progressions/${unknown}/duplicate`, "owner", { method: "POST" }),
      context(unknown),
    );

    expect(response.status).toBe(404);
  });
});

describe("Ta bort", () => {
  it("en borttagen Ackordföljd finns inte längre i listan och går inte att hämta eller spara", async () => {
    const { id } = await createProgression("Bort", progressionAt(100));

    const response = await remove(request(`/api/progressions/${id}`, "owner", { method: "DELETE" }), context(id));

    expect(response.status).toBe(204);
    expect((await listed()).map((p) => p.id)).not.toContain(id);
    expect((await get(request(`/api/progressions/${id}`, "owner"), context(id))).status).toBe(404);
    expect((await saveRequest(id, progressionAt(101), 1)).status).toBe(404);
  });

  it("en okänd Ackordföljd ger 404", async () => {
    const del = (target: string) =>
      remove(request(`/api/progressions/${target}`, "owner", { method: "DELETE" }), context(target));

    expect((await del(unknown)).status).toBe(404);
    expect((await del("inte-ett-id")).status).toBe(404);
  });
});
