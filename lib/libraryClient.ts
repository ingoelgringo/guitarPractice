import type { Score } from "./score";
import { serialize } from "./scoreFile";

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

/** Sparar Partituret i Biblioteket, om revisionen där fortfarande är `revision`. */
export function saveToLibrary(id: string, score: Score, revision: number): Promise<LibraryResult<{ revision: number }>> {
  const body = `{"revision":${revision},"document":${serialize(score)}}`;
  return send(`/api/library/${encodeURIComponent(id)}`, "PUT", body);
}

async function send<T>(url: string, method: string, body: string): Promise<LibraryResult<T>> {
  let response: Response;
  let data: Record<string, unknown>;
  try {
    response = await fetch(url, { method, body, headers: { "content-type": "application/json" } });
    data = await response.json();
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
