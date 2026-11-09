import { db } from "./db";
import { type ExpectedRevision, isLibraryId, type SaveResult } from "./library";
import type { Progression } from "./progression";
import { parseProgression, PROGRESSION_SCHEMA_VERSION, serializeProgression } from "./progressionDraft";
import { copyName, type ProgressionListEntry } from "./progressionLibraryClient";

/**
 * Ackordföljderna i Biblioteket. Dokumentet lagras som Ackordföljdens versionerade JSON, och
 * sparningen följer samma regler som för Partitur (`lib/library.ts`): varje sparning ökar
 * revisionen och kräver den revision som klienten senast kände till. Namnet hör till Biblioteket
 * och inte till dokumentet, så att byta namn inte ger någon Konflikt.
 */

/** En rad i listan med Ackordföljder. */
export type ProgressionEntry = ProgressionListEntry;

/** En Ackordföljd i Biblioteket med sitt dokument. */
export type StoredProgression = ProgressionEntry & { document: unknown };

/** Läser ett dokument som en Ackordföljd, eller null när det inte är en Ackordföljd. */
export function readProgressionDocument(document: unknown): Progression | null {
  return parseProgression(JSON.stringify(document) ?? "");
}

/** Ett giltigt namn: trimmat och inte tomt. */
export function readName(name: unknown): string | null {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  return trimmed === "" ? null : trimmed;
}

function entryOf(row: { id: string; name: string; updated_at: Date; revision: number }): ProgressionEntry {
  return { id: row.id, name: row.name, updatedAt: row.updated_at.toISOString(), revision: row.revision };
}

export async function listProgressions(): Promise<ProgressionEntry[]> {
  const { rows } = await db().query(
    "SELECT id, name, updated_at, revision FROM progressions ORDER BY updated_at DESC, id",
  );
  return rows.map(entryOf);
}

export async function createProgression(
  name: string,
  progression: Progression,
): Promise<{ id: string; revision: number; name: string }> {
  const { rows } = await db().query(
    "INSERT INTO progressions (name, document, schema_version) VALUES ($1, $2, $3) RETURNING id, revision",
    [name, serializeProgression(progression), PROGRESSION_SCHEMA_VERSION],
  );
  return { id: rows[0].id, revision: rows[0].revision, name };
}

export async function getProgression(id: string): Promise<StoredProgression | null> {
  if (!isLibraryId(id)) return null;
  const { rows } = await db().query(
    "SELECT id, name, updated_at, revision, document FROM progressions WHERE id = $1",
    [id],
  );
  return rows.length === 0 ? null : { ...entryOf(rows[0]), document: rows[0].document };
}

/**
 * Sparar Ackordföljden om revisionen i databasen fortfarande är `expectedRevision`, eller oavsett
 * revision med "overwrite" (Skriv över).
 */
export async function saveProgression(
  id: string,
  progression: Progression,
  expectedRevision: ExpectedRevision,
): Promise<SaveResult> {
  if (!isLibraryId(id)) return { ok: false, reason: "notFound" };
  const document = serializeProgression(progression);
  // Villkoret på revisionen gör kontrollen och sparningen till en enda atomisk sats
  const { rows } = await db().query(
    `UPDATE progressions
        SET document = $1, schema_version = $2, revision = revision + 1, updated_at = now()
      WHERE id = $3 AND ($4::integer IS NULL OR revision = $4)
      RETURNING revision`,
    [document, PROGRESSION_SCHEMA_VERSION, id, expectedRevision === "overwrite" ? null : expectedRevision],
  );
  if (rows.length > 0) return { ok: true, revision: rows[0].revision };

  // Sparningen är redan avgjord. Den här läsningen tar bara reda på varför den inte blev av.
  const current = await db().query(
    "SELECT revision, document = $2::jsonb AS same FROM progressions WHERE id = $1",
    [id, document],
  );
  if (current.rows.length === 0) return { ok: false, reason: "notFound" };
  // Exakt det här dokumentet är redan sparat, t.ex. av en sparning vars svar aldrig nådde fram
  if (current.rows[0].same) return { ok: true, revision: current.rows[0].revision };
  return { ok: false, reason: "conflict", revision: current.rows[0].revision };
}

/** Byter namn på en Ackordföljd utan att ändra revisionen eller när den senast ändrades. Ger false när den inte finns. */
export async function renameProgression(id: string, name: string): Promise<boolean> {
  if (!isLibraryId(id)) return false;
  const { rowCount } = await db().query(
    "UPDATE progressions SET name = $1 WHERE id = $2",
    [name, id],
  );
  return rowCount === 1;
}

/** Tar bort en Ackordföljd ur Biblioteket. Ger false när den inte fanns. */
export async function deleteProgression(id: string): Promise<boolean> {
  if (!isLibraryId(id)) return false;
  const { rowCount } = await db().query("DELETE FROM progressions WHERE id = $1", [id]);
  return rowCount === 1;
}

/** Lägger en kopia av en Ackordföljd i Biblioteket. Ger null när originalet inte finns. */
export async function duplicateProgression(id: string): Promise<{ id: string; revision: number; name: string } | null> {
  const stored = await getProgression(id);
  const progression = stored && readProgressionDocument(stored.document);
  if (!stored || !progression) return null;
  return createProgression(copyName(stored.name), progression);
}
