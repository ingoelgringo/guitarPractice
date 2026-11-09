import type { ExpectedRevision } from "./library";
import { type LibraryResult, send } from "./libraryClient";
import type { Progression } from "./progression";
import { parseProgression, serializeProgression } from "./progressionDraft";

/**
 * Tunt skal kring API:t för Ackordföljder i Biblioteket (`/api/progressions`) i webbläsaren. Fel
 * blir resultat i stället för undantag, som i `lib/libraryClient.ts`.
 */

/** En rad i listan med Ackordföljder, som servern skickar den. */
export type ProgressionListEntry = { id: string; name: string; updatedAt: string; revision: number };

/** Namnet på en kopia, så att original och kopia går att skilja åt i listan. */
export function copyName(name: string): string {
  return `${name} (copy)`;
}

const url = (id: string) => `/api/progressions/${encodeURIComponent(id)}`;

export function listProgressionsInLibrary(): Promise<LibraryResult<{ progressions: ProgressionListEntry[] }>> {
  return send("/api/progressions", "GET");
}

/** Lägger Ackordföljden i Biblioteket med ett namn. Används också för Spara som kopia. */
export function addProgressionToLibrary(
  name: string,
  progression: Progression,
): Promise<LibraryResult<{ id: string; revision: number; name: string }>> {
  return send("/api/progressions", "POST", `{"name":${JSON.stringify(name)},"document":${serializeProgression(progression)}}`);
}

/** Sparar Ackordföljden om revisionen fortfarande är `revision`, eller oavsett med "overwrite". */
export function saveProgressionToLibrary(
  id: string,
  progression: Progression,
  revision: ExpectedRevision,
): Promise<LibraryResult<{ revision: number }>> {
  const condition = revision === "overwrite" ? `"overwrite":true` : `"revision":${revision}`;
  return send(url(id), "PUT", `{${condition},"document":${serializeProgression(progression)}}`);
}

/** Hämtar den senaste revisionen av en Ackordföljd i Biblioteket. */
export async function loadProgressionFromLibrary(
  id: string,
): Promise<LibraryResult<{ revision: number; name: string; progression: Progression }>> {
  const result = await send<{ revision: number; name: string; document: unknown }>(url(id), "GET");
  if (!result.ok) return result;
  const progression = parseProgression(JSON.stringify(result.document));
  if (!progression) return { ok: false, reason: "failed" };
  return { ok: true, revision: result.revision, name: result.name, progression };
}

export function renameProgressionInLibrary(id: string, name: string): Promise<LibraryResult<object>> {
  return send(url(id), "PATCH", JSON.stringify({ name }));
}

export function duplicateProgressionInLibrary(id: string): Promise<LibraryResult<{ id: string; revision: number; name: string }>> {
  return send(`${url(id)}/duplicate`, "POST");
}

export function deleteProgressionFromLibrary(id: string): Promise<LibraryResult<object>> {
  return send(url(id), "DELETE");
}
