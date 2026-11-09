/**
 * Historiken för Ackordföljden: Ackordföljderna före de ändringar som går att ångra, och efter dem
 * som går att göra om. Den aktuella Ackordföljden hålls utanför, så att historiken inte går ur
 * takt med den när Ackordföljden byts ut någon annanstans.
 */

import type { KeyPress } from "./keyboard";
import type { Progression } from "./progression";

export interface ProgressionHistory {
  /** Äldst först. */
  readonly undo: readonly Progression[];
  /** Den som görs om först ligger sist. */
  readonly redo: readonly Progression[];
}

export const EMPTY_HISTORY: ProgressionHistory = { undo: [], redo: [] };

/** Hur många ändringar som går att ångra. */
export const MAX_HISTORY = 100;

/** Ackordföljden är JSON, så två med samma innehåll ger samma text. */
const same = (a: Progression, b: Progression) => a === b || JSON.stringify(a) === JSON.stringify(b);

/**
 * Lägger ändringen från `before` till `after` i historiken och glömmer det som gick att göra om.
 * En ändring som inte ändrade något lämnar historiken som den var.
 */
export function record(history: ProgressionHistory, before: Progression, after: Progression): ProgressionHistory {
  if (same(before, after)) return history;
  return { undo: [...history.undo, before].slice(-MAX_HISTORY), redo: [] };
}

export interface HistoryStep {
  progression: Progression;
  history: ProgressionHistory;
}

/** Ackordföljden före den senaste ändringen, eller `null` när det inte finns något att ångra. */
export function undo(history: ProgressionHistory, current: Progression): HistoryStep | null {
  const previous = history.undo.at(-1);
  if (!previous) return null;
  return { progression: previous, history: { undo: history.undo.slice(0, -1), redo: [...history.redo, current] } };
}

/** Ackordföljden efter den senast ångrade ändringen, eller `null` när det inte finns något att göra om. */
export function redo(history: ProgressionHistory, current: Progression): HistoryStep | null {
  const next = history.redo.at(-1);
  if (!next) return null;
  return { progression: next, history: { undo: [...history.undo, current], redo: history.redo.slice(0, -1) } };
}

/** Ctrl+Z ångrar, Ctrl+Y och Ctrl+Shift+Z gör om. Cmd räknas som Ctrl. */
export function historyKey({ key, ctrlKey, metaKey, shiftKey, altKey }: Omit<KeyPress, "timeStamp">): "undo" | "redo" | null {
  if (!(ctrlKey || metaKey) || altKey) return null;
  const lower = key.toLowerCase();
  if (lower === "z") return shiftKey ? "redo" : "undo";
  if (lower === "y") return "redo";
  return null;
}
