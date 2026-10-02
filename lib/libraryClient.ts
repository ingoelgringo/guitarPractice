import type { ExpectedRevision } from "./library";
import type { Score } from "./score";
import { parse, serialize } from "./scoreFile";

/**
 * Tunt skal kring Bibliotekets API i webbläsaren. Fel blir resultat i stället för undantag, så
 * att UI:t kan visa vad som hände.
 */

export type LibraryFailure =
  /** Sessionen har gått ut eller Ägaren har loggat ut i en annan flik. */
  | { ok: false; reason: "unauthorized" }
  /** Partituret har sparats någon annanstans sedan revisionen som skickades. */
  | { ok: false; reason: "conflict"; revision: number }
  | { ok: false; reason: "notFound" }
  /** Inget nät, eller ett fel på servern. */
  | { ok: false; reason: "failed" };

export type LibraryResult<T> = ({ ok: true } & T) | LibraryFailure;

/** Lägger Partituret i Biblioteket. */
export function addToLibrary(score: Score): Promise<LibraryResult<{ id: string; revision: number }>> {
  return send("/api/library", "POST", serialize(score));
}

/**
 * Sparar Partituret i Biblioteket, om revisionen där fortfarande är `revision`. Med "overwrite"
 * sparas det oavsett revision (Skriv över).
 */
export function saveToLibrary(
  id: string,
  score: Score,
  revision: ExpectedRevision,
): Promise<LibraryResult<{ revision: number }>> {
  const condition = revision === "overwrite" ? `"overwrite":true` : `"revision":${revision}`;
  const body = `{${condition},"document":${serialize(score)}}`;
  return send(`/api/library/${encodeURIComponent(id)}`, "PUT", body);
}

/** Hämtar den senaste revisionen av ett Partitur i Biblioteket. */
export async function loadFromLibrary(id: string): Promise<LibraryResult<{ revision: number; score: Score }>> {
  const result = await send<{ revision: number; document: unknown }>(`/api/library/${encodeURIComponent(id)}`, "GET");
  if (!result.ok) return result;
  const parsed = parse(JSON.stringify(result.document));
  if (!parsed.ok) return { ok: false, reason: "failed" };
  return { ok: true, revision: result.revision, score: parsed.score };
}

/** Lägger en kopia av ett Partitur i Biblioteket. */
export function duplicateInLibrary(id: string): Promise<LibraryResult<{ id: string; revision: number }>> {
  return send(`/api/library/${encodeURIComponent(id)}/duplicate`, "POST");
}

/** Tar bort ett Partitur ur Biblioteket. */
export function deleteFromLibrary(id: string): Promise<LibraryResult<object>> {
  return send(`/api/library/${encodeURIComponent(id)}`, "DELETE");
}

/**
 * Hämtar Partiturfilen för ett Partitur i Biblioteket, så som den laddas ner: utan id och
 * revision, så att en återöppnad fil blir ett nytt Partitur.
 */
export async function scoreFileFromLibrary(id: string): Promise<LibraryResult<{ text: string; score: Score }>> {
  let response: Response;
  let text: string;
  try {
    response = await fetch(`/api/library/${encodeURIComponent(id)}/file`);
    text = await response.text();
  } catch {
    return { ok: false, reason: "failed" };
  }
  if (response.status === 401) return { ok: false, reason: "unauthorized" };
  if (response.status === 404) return { ok: false, reason: "notFound" };
  const parsed = response.ok ? parse(text) : null;
  if (!parsed?.ok) return { ok: false, reason: "failed" };
  return { ok: true, text, score: parsed.score };
}

/**
 * Webbläsare skickar ett anrop med `keepalive` även när fliken stängs, men bara upp till 64 kB.
 * Ett större Partitur skickas utan och kan då avbrytas. Det ligger ändå kvar i Utkastet.
 */
const KEEPALIVE_LIMIT_BYTES = 60_000;

async function send<T>(url: string, method: string, body?: string): Promise<LibraryResult<T>> {
  let response: Response;
  let data: Record<string, unknown>;
  try {
    const keepalive = body !== undefined && new Blob([body]).size < KEEPALIVE_LIMIT_BYTES;
    response = await fetch(url, { method, body, keepalive, headers: { "content-type": "application/json" } });
    // 204 har ingen kropp
    data = response.status === 204 ? {} : await response.json();
  } catch {
    return { ok: false, reason: "failed" };
  }
  if (response.ok) return { ok: true, ...(data as T) };
  switch (response.status) {
    case 401:
      return { ok: false, reason: "unauthorized" };
    case 404:
      return { ok: false, reason: "notFound" };
    case 409:
      return { ok: false, reason: "conflict", revision: data.revision as number };
    default:
      return { ok: false, reason: "failed" };
  }
}
