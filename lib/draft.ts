import type { Score } from "./score";
import { isRecord, parse, serialize } from "./scoreFile";

/**
 * Utkastet: den automatiskt sparade kopian av Partituret man arbetar med. Den finns bara i den
 * här webbläsaren och är inte en säker lagring.
 */
export type Draft = {
  score: Score;
  /** Om Partituret är detsamma som när det senast laddades ner eller öppnades från en fil. */
  downloaded: boolean;
  /** Finns när Partituret ligger i Biblioteket: dess id och den senast kända revisionen. */
  library?: LibraryRef;
};

export type LibraryRef = { id: string; revision: number };

/** Den del av `localStorage` som Utkastet använder. */
export type DraftStorage = Pick<Storage, "getItem" | "setItem">;

const KEY = "guitarPractice.tabEditor.draft";

/**
 * Webbläsarens `localStorage`, eller `null` när den inte går att nå. Redan åtkomsten kan kasta fel,
 * t.ex. när webbplatsdata är blockerad.
 */
export function browserStorage(): DraftStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Sparar Utkastet. Utan fungerande lagring (privat läge, full kvot) sparas inget, och editorn
 * fungerar ändå.
 */
export function saveDraft(storage: DraftStorage | null, draft: Draft): void {
  try {
    storage?.setItem(
      KEY,
      JSON.stringify({ itab: serialize(draft.score), downloaded: draft.downloaded, library: draft.library }),
    );
  } catch {
    // Utkastet är ingen säker lagring. Hellre inget Utkast än en editor som slutar fungera.
  }
}

/** Utkastet som finns sparat, eller `null` när det inte finns något som går att återställa. */
export function loadDraft(storage: DraftStorage | null): Draft | null {
  let text: string | null;
  try {
    text = storage?.getItem(KEY) ?? null;
  } catch {
    return null;
  }
  if (text === null) return null;
  return readDraft(text);
}

/** Läser ett sparat Utkast. Partiturfilen i det migreras om den är från en äldre version. */
function readDraft(text: string): Draft | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(data) || typeof data.itab !== "string" || typeof data.downloaded !== "boolean") return null;
  const result = parse(data.itab);
  if (!result.ok) return null;
  if (data.library === undefined) return { score: result.score, downloaded: data.downloaded };
  const library = data.library;
  if (!isRecord(library) || typeof library.id !== "string" || !Number.isInteger(library.revision)) return null;
  return {
    score: result.score,
    downloaded: data.downloaded,
    library: { id: library.id, revision: library.revision as number },
  };
}
