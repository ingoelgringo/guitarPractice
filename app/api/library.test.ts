import pg from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as list, POST as create } from "./library/route";
import { DELETE as remove, GET as get, PUT as save } from "./library/[id]/route";
import { POST as duplicate } from "./library/[id]/duplicate/route";
import { GET as download } from "./library/[id]/file/route";
import { createSessionToken, SESSION_COOKIE } from "../../lib/auth";
import { closeDb } from "../../lib/db";
import { apply, createEditor } from "../../lib/editor";
import type { Score } from "../../lib/score";
import { parse, serialize } from "../../lib/scoreFile";
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
    await client.query("TRUNCATE scores");
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

function ownerCookie(): string {
  return `${SESSION_COOKIE}=${createSessionToken()}`;
}

type Who = "owner" | "guest";

function request(path: string, who: Who, init: { method?: string; body?: unknown } = {}): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (who === "owner") headers.cookie = ownerCookie();
  return new Request(`http://localhost${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

/** Ett giltigt id som inget Partitur har. */
const unknown = "00000000-0000-4000-8000-000000000000";

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

function scoreWith(title: string, artist = ""): Score {
  return apply(createEditor(), { type: "setMetadata", metadata: { title, artist } }).score;
}

/** Partiturfilen som JSON-dokument, så som klienten skickar den. */
function documentOf(score: Score): unknown {
  return JSON.parse(serialize(score));
}

async function createScore(score: Score): Promise<{ id: string; revision: number }> {
  const response = await create(request("/api/library", "owner", { method: "POST", body: documentOf(score) }));
  expect(response.status).toBe(201);
  return response.json();
}

function saveRequest(id: string, score: Score, revision: number, who: Who = "owner") {
  return save(
    request(`/api/library/${id}`, who, { method: "PUT", body: { document: documentOf(score), revision } }),
    context(id),
  );
}

describe("Biblioteket utan inloggning", () => {
  it("varje anrop utan session ger 401", async () => {
    const { id } = await createScore(scoreWith("Hemlig"));

    const responses = await Promise.all([
      list(request("/api/library", "guest")),
      create(request("/api/library", "guest", { method: "POST", body: documentOf(scoreWith("Gästens")) })),
      get(request(`/api/library/${id}`, "guest"), context(id)),
      saveRequest(id, scoreWith("Ändrad av gäst"), 1, "guest"),
      duplicate(request(`/api/library/${id}/duplicate`, "guest", { method: "POST" }), context(id)),
      remove(request(`/api/library/${id}`, "guest", { method: "DELETE" }), context(id)),
      download(request(`/api/library/${id}/file`, "guest"), context(id)),
    ]);

    expect(responses.map((r) => r.status)).toEqual([401, 401, 401, 401, 401, 401, 401]);
  });

  it("en gäst kan varken skapa, ändra, duplicera eller ta bort något", async () => {
    const { id } = await createScore(scoreWith("Orörd"));
    await create(request("/api/library", "guest", { method: "POST", body: documentOf(scoreWith("Gästens")) }));
    await saveRequest(id, scoreWith("Ändrad av gäst"), 1, "guest");
    await duplicate(request(`/api/library/${id}/duplicate`, "guest", { method: "POST" }), context(id));
    await remove(request(`/api/library/${id}`, "guest", { method: "DELETE" }), context(id));

    const titles = (await (await list(request("/api/library", "owner"))).json()).scores.map(
      (s: { title: string }) => s.title,
    );
    expect(titles.filter((title: string) => title.startsWith("Orörd"))).toEqual(["Orörd"]);
    expect(titles).not.toContain("Gästens");
    expect(titles).not.toContain("Ändrad av gäst");
  });
});

describe("Skapa och hämta", () => {
  it("ett skapat Partitur får ett id och revision 1 och hämtas oförändrat", async () => {
    const score = scoreWith("Blackbird", "The Beatles");

    const { id, revision } = await createScore(score);
    const response = await get(request(`/api/library/${id}`, "owner"), context(id));

    expect(revision).toBe(1);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ id, revision: 1 });
    expect(parse(JSON.stringify(body.document))).toEqual({ ok: true, score });
  });

  it("ett dokument som inte är en Partiturfil avvisas med 400", async () => {
    const response = await create(request("/api/library", "owner", { method: "POST", body: { hello: "world" } }));

    expect(response.status).toBe(400);
  });

  it("ett okänt id ger 404", async () => {

    expect((await get(request(`/api/library/${unknown}`, "owner"), context(unknown))).status).toBe(404);
    expect((await get(request("/api/library/inte-ett-id", "owner"), context("inte-ett-id"))).status).toBe(404);
  });
});

describe("Lista", () => {
  it("listan visar titel, artist, senast ändrad och revision, senast ändrade först", async () => {
    const first = await createScore(scoreWith("Först", "A"));
    const second = await createScore(scoreWith("Sedan", "B"));
    await saveRequest(first.id, scoreWith("Först, ändrad", "A"), 1);

    const response = await list(request("/api/library", "owner"));

    expect(response.status).toBe(200);
    const { scores } = await response.json();
    const ours = scores.filter((s: { id: string }) => s.id === first.id || s.id === second.id);
    expect(ours).toEqual([
      { id: first.id, title: "Först, ändrad", artist: "A", revision: 2, updatedAt: expect.any(String) },
      { id: second.id, title: "Sedan", artist: "B", revision: 1, updatedAt: expect.any(String) },
    ]);
    expect(Date.parse(ours[0].updatedAt)).toBeGreaterThanOrEqual(Date.parse(ours[1].updatedAt));
  });
});

describe("Spara", () => {
  it("sparning med rätt revision ger ny revision, och det sparade hämtas", async () => {
    const { id } = await createScore(scoreWith("Utkast"));
    const changed = scoreWith("Färdig");

    const response = await saveRequest(id, changed, 1);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ revision: 2 });
    const body = await (await get(request(`/api/library/${id}`, "owner"), context(id))).json();
    expect(body.revision).toBe(2);
    expect(parse(JSON.stringify(body.document))).toEqual({ ok: true, score: changed });
  });

  it("sparning med fel revision ger 409 med serverns revision och ändrar inget", async () => {
    const { id } = await createScore(scoreWith("Original"));
    await saveRequest(id, scoreWith("Från en annan flik"), 1);

    const response = await saveRequest(id, scoreWith("Gammal flik"), 1);

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ revision: 2 });
    const body = await (await get(request(`/api/library/${id}`, "owner"), context(id))).json();
    expect(parse(JSON.stringify(body.document))).toEqual({ ok: true, score: scoreWith("Från en annan flik") });
  });

  it("en sparning som redan har gjorts ger ingen konflikt, t.ex. när svaret inte nådde en stängd flik", async () => {
    const { id } = await createScore(scoreWith("Original"));
    const mine = scoreWith("Sparad när fliken stängdes");
    await saveRequest(id, mine, 1);

    const response = await saveRequest(id, mine, 1);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ revision: 2 });
  });

  it("av två samtidiga sparningar med samma revision lyckas bara den ena", async () => {
    const { id } = await createScore(scoreWith("Samtidigt"));

    const responses = await Promise.all([
      saveRequest(id, scoreWith("Flik A"), 1),
      saveRequest(id, scoreWith("Flik B"), 1),
      saveRequest(id, scoreWith("Flik C"), 1),
    ]);

    expect(responses.map((r) => r.status).sort()).toEqual([200, 409, 409]);
  });

  it("sparning av ett okänt Partitur ger 404", async () => {

    expect((await saveRequest(unknown, scoreWith("Finns inte"), 1)).status).toBe(404);
  });

  it("Skriv över sparar oavsett revision och ger ny revision", async () => {
    const { id } = await createScore(scoreWith("Original"));
    await saveRequest(id, scoreWith("Från en annan flik"), 1);
    const mine = scoreWith("Min version");

    const response = await save(
      request(`/api/library/${id}`, "owner", { method: "PUT", body: { document: documentOf(mine), overwrite: true } }),
      context(id),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ revision: 3 });
    const body = await (await get(request(`/api/library/${id}`, "owner"), context(id))).json();
    expect(body.revision).toBe(3);
    expect(parse(JSON.stringify(body.document))).toEqual({ ok: true, score: mine });
  });

  it("Skriv över kräver inloggning och ett Partitur som finns", async () => {
    const { id } = await createScore(scoreWith("Skyddad"));
    const overwrite = (target: string, who: Who) =>
      save(
        request(`/api/library/${target}`, who, {
          method: "PUT",
          body: { document: documentOf(scoreWith("Överskriven")), overwrite: true },
        }),
        context(target),
      );

    expect((await overwrite(id, "guest")).status).toBe(401);
    expect((await overwrite(unknown, "owner")).status).toBe(404);
    const body = await (await get(request(`/api/library/${id}`, "owner"), context(id))).json();
    expect(body.revision).toBe(1);
  });

  it("Spara som kopia skapar ett nytt Partitur och lämnar originalet orört", async () => {
    const { id } = await createScore(scoreWith("Original"));
    await saveRequest(id, scoreWith("Från en annan flik"), 1);

    const copy = await createScore(scoreWith("Min version"));

    expect(copy.id).not.toBe(id);
    const original = await (await get(request(`/api/library/${id}`, "owner"), context(id))).json();
    expect(parse(JSON.stringify(original.document))).toEqual({ ok: true, score: scoreWith("Från en annan flik") });
    const copied = await (await get(request(`/api/library/${copy.id}`, "owner"), context(copy.id))).json();
    expect(parse(JSON.stringify(copied.document))).toEqual({ ok: true, score: scoreWith("Min version") });
  });

  it("sparning utan giltig revision eller med ett ogiltigt dokument ger 400", async () => {
    const { id } = await createScore(scoreWith("Giltig"));
    const put = (body: unknown) =>
      save(request(`/api/library/${id}`, "owner", { method: "PUT", body }), context(id));

    expect((await put({ document: documentOf(scoreWith("Utan revision")) })).status).toBe(400);
    expect((await put({ document: { format: "itab" }, revision: 1 })).status).toBe(400);
  });
});

describe("Duplicera", () => {
  it("en dubblett är ett nytt Partitur med samma innehåll och titeln märkt som kopia", async () => {
    const original = scoreWith("Blackbird", "The Beatles");
    const { id } = await createScore(original);
    await saveRequest(id, original, 1);

    const response = await duplicate(request(`/api/library/${id}/duplicate`, "owner", { method: "POST" }), context(id));

    expect(response.status).toBe(201);
    const copy = await response.json();
    expect(copy).toEqual({ id: expect.any(String), revision: 1 });
    expect(copy.id).not.toBe(id);
    const body = await (await get(request(`/api/library/${copy.id}`, "owner"), context(copy.id))).json();
    const expected = { ...original, metadata: { ...original.metadata, title: "Blackbird (copy)" } };
    expect(parse(JSON.stringify(body.document))).toEqual({ ok: true, score: expected });
    const unchanged = await (await get(request(`/api/library/${id}`, "owner"), context(id))).json();
    expect(parse(JSON.stringify(unchanged.document))).toEqual({ ok: true, score: original });
  });

  it("en dubblett av ett Partitur utan titel heter Untitled (copy)", async () => {
    const { id } = await createScore(scoreWith(""));

    const copy = await (
      await duplicate(request(`/api/library/${id}/duplicate`, "owner", { method: "POST" }), context(id))
    ).json();

    const { scores } = await (await list(request("/api/library", "owner"))).json();
    expect(scores.find((s: { id: string }) => s.id === copy.id).title).toBe("Untitled (copy)");
  });

  it("ett okänt Partitur går inte att duplicera", async () => {

    const response = await duplicate(
      request(`/api/library/${unknown}/duplicate`, "owner", { method: "POST" }),
      context(unknown),
    );

    expect(response.status).toBe(404);
  });
});

describe("Ta bort", () => {
  it("ett borttaget Partitur finns inte längre i listan och går inte att hämta eller spara", async () => {
    const { id } = await createScore(scoreWith("Bort"));

    const response = await remove(request(`/api/library/${id}`, "owner", { method: "DELETE" }), context(id));

    expect(response.status).toBe(204);
    const { scores } = await (await list(request("/api/library", "owner"))).json();
    expect(scores.map((s: { id: string }) => s.id)).not.toContain(id);
    expect((await get(request(`/api/library/${id}`, "owner"), context(id))).status).toBe(404);
    expect((await saveRequest(id, scoreWith("Efteråt"), 1)).status).toBe(404);
  });

  it("ett okänt Partitur ger 404", async () => {
    const del = (target: string) =>
      remove(request(`/api/library/${target}`, "owner", { method: "DELETE" }), context(target));

    expect((await del(unknown)).status).toBe(404);
    expect((await del("inte-ett-id")).status).toBe(404);
  });
});

describe("Ladda ner", () => {
  it("Partiturfilen laddas ner med Partiturets namn och går att öppna", async () => {
    const score = scoreWith("Blackbird", "The Beatles");
    const { id } = await createScore(score);

    const response = await download(request(`/api/library/${id}/file`, "owner"), context(id));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain('filename="Blackbird.itab"');
    expect(parse(await response.text())).toEqual({ ok: true, score });
  });

  it("ett namn med tecken utanför ASCII får ett ASCII-namn och det riktiga namnet kodat", async () => {
    const { id } = await createScore(scoreWith("Smörgås (copy)"));

    const response = await download(request(`/api/library/${id}/file`, "owner"), context(id));

    expect(response.headers.get("content-disposition")).toBe(
      `attachment; filename="Sm_rg_s (copy).itab"; filename*=UTF-8''Sm%C3%B6rg%C3%A5s%20%28copy%29.itab`,
    );
  });

  it("filen innehåller ingen databasidentitet, så en återöppnad fil blir ett nytt Partitur", async () => {
    const { id } = await createScore(scoreWith("Identitetslös"));
    await saveRequest(id, scoreWith("Identitetslös"), 1);

    const text = await (await download(request(`/api/library/${id}/file`, "owner"), context(id))).text();

    expect(text).not.toContain(id);
    expect(text).toBe(serialize(scoreWith("Identitetslös")));
  });

  it("ett okänt Partitur ger 404", async () => {

    expect((await download(request(`/api/library/${unknown}/file`, "owner"), context(unknown))).status).toBe(404);
  });
});
