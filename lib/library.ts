import { db } from "./db";
import type { Score } from "./score";
import { parse, SCHEMA_VERSION, serialize } from "./scoreFile";

/**
 * Biblioteket: Ägarens Partitur i databasen. Dokumentet lagras som Partiturfilen (.itab, ADR 0002)
 * i aktuell schemaVersion. Varje sparning ökar revisionen och kräver den revision som klienten
 * senast kände till, så att ingen version tyst skriver över en annan.
 */

/** En rad i Bibliotekets lista. */
export type LibraryEntry = { id: string; title: string; artist: string; updatedAt: string; revision: number };

/** Ett Partitur i Biblioteket med sitt dokument, en Partiturfil som JSON. */
export type LibraryScore = { id: string; revision: number; updatedAt: string; document: unknown };

/** Den revision som klienten senast kände till, eller "overwrite" för att spara oavsett revision (Skriv över). */
export type ExpectedRevision = number | "overwrite";

export type SaveResult =
  | { ok: true; revision: number }
  /** Partituret har sparats från en annan flik eller enhet sedan revisionen klienten kände till. */
  | { ok: false; reason: "conflict"; revision: number }
  | { ok: false; reason: "notFound" };

/**
 * Läser ett dokument som en Partiturfil. Äldre versioner migreras, så Biblioteket lagrar alltid
 * aktuell version. Ger null när dokumentet inte är ett Partitur som går att läsa.
 */
export function readDocument(document: unknown): Score | null {
  const result = parse(JSON.stringify(document) ?? "");
  return result.ok ? result.score : null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Sant om `id` kan vara ett id i Biblioteket. Andra id finns inte och ska inte nå databasen. */
function isLibraryId(id: string): boolean {
  return UUID.test(id);
}

/** Kolumnerna som härleds ur Partituret: titel, artist, dokument och schemaVersion. */
function columnsFor(score: Score): [string, string, string, number] {
  return [score.metadata.title, score.metadata.artist, serialize(score), SCHEMA_VERSION];
}

export async function listScores(): Promise<LibraryEntry[]> {
  const { rows } = await db().query(
    "SELECT id, title, artist, updated_at, revision FROM scores ORDER BY updated_at DESC, id",
  );
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    artist: row.artist,
    updatedAt: row.updated_at.toISOString(),
    revision: row.revision,
  }));
}

export async function createScore(score: Score): Promise<{ id: string; revision: number }> {
  const { rows } = await db().query(
    "INSERT INTO scores (title, artist, document, schema_version) VALUES ($1, $2, $3, $4) RETURNING id, revision",
    columnsFor(score),
  );
  return { id: rows[0].id, revision: rows[0].revision };
}

export async function getScore(id: string): Promise<LibraryScore | null> {
  if (!isLibraryId(id)) return null;
  const { rows } = await db().query("SELECT id, revision, updated_at, document FROM scores WHERE id = $1", [id]);
  if (rows.length === 0) return null;
  const row = rows[0];
  return { id: row.id, revision: row.revision, updatedAt: row.updated_at.toISOString(), document: row.document };
}

/** Ett Partitur i Biblioteket som Partitur, eller null när det inte finns eller inte går att läsa. */
export async function loadScore(id: string): Promise<{ stored: LibraryScore; score: Score } | null> {
  const stored = await getScore(id);
  const score = stored && readDocument(stored.document);
  return stored && score ? { stored, score } : null;
}

/**
 * Sparar Partituret om revisionen i databasen fortfarande är `expectedRevision`. Med "overwrite"
 * sparas det oavsett revision: Ägaren har valt att skriva över en version som sparats någon annanstans.
 */
export async function saveScore(
  id: string,
  score: Score,
  expectedRevision: ExpectedRevision,
): Promise<SaveResult> {
  if (!isLibraryId(id)) return { ok: false, reason: "notFound" };
  // Villkoret på revisionen gör kontrollen och sparningen till en enda atomisk sats. Ett tomt
  // villkor ($6 är null) är Skriv över.
  const { rows } = await db().query(
    `UPDATE scores
        SET title = $1, artist = $2, document = $3, schema_version = $4,
            revision = revision + 1, updated_at = now()
      WHERE id = $5 AND ($6::integer IS NULL OR revision = $6)
      RETURNING revision`,
    [...columnsFor(score), id, expectedRevision === "overwrite" ? null : expectedRevision],
  );
  if (rows.length > 0) return { ok: true, revision: rows[0].revision };

  // Sparningen är redan avgjord. Den här läsningen tar bara reda på varför den inte blev av.
  const current = await db().query("SELECT revision, document = $2::jsonb AS same FROM scores WHERE id = $1", [
    id,
    serialize(score),
  ]);
  if (current.rows.length === 0) return { ok: false, reason: "notFound" };
  // Exakt det här dokumentet är redan sparat, t.ex. av en sparning vars svar aldrig nådde en
  // flik som stängdes. Det är ingen konflikt, och klienten får revisionen som det har.
  if (current.rows[0].same) return { ok: true, revision: current.rows[0].revision };
  return { ok: false, reason: "conflict", revision: current.rows[0].revision };
}

/** Tar bort ett Partitur ur Biblioteket. Ger false när det inte fanns. */
export async function deleteScore(id: string): Promise<boolean> {
  if (!isLibraryId(id)) return false;
  const { rowCount } = await db().query("DELETE FROM scores WHERE id = $1", [id]);
  return rowCount === 1;
}

/**
 * Lägger en kopia av ett Partitur i Biblioteket, med titeln märkt som kopia så att de går att
 * skilja åt i listan. Ger null när originalet inte finns.
 */
export async function duplicateScore(id: string): Promise<{ id: string; revision: number } | null> {
  const loaded = await loadScore(id);
  if (!loaded) return null;
  const { score } = loaded;
  // Listan visar ett Partitur utan titel som Untitled
  const title = `${score.metadata.title || "Untitled"} (copy)`;
  return createScore({ ...score, metadata: { ...score.metadata, title } });
}
