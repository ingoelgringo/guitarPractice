import type { Command, Direction } from "./editor";
import type { Duration } from "./score";

const ARROW_KEYS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

/** Tangent, Notvärde och namn i hjälprutan. Tangenterna gäller oavsett skiftläge. */
const DURATION_KEYS: readonly { key: string; duration: Duration; name: string }[] = [
  { key: "w", duration: 1, name: "Whole note" },
  { key: "h", duration: 2, name: "Half note" },
  { key: "q", duration: 4, name: "Quarter note" },
  { key: "e", duration: 8, name: "Eighth note" },
  { key: "s", duration: 16, name: "Sixteenth note" },
  { key: "t", duration: 32, name: "Thirty-second note" },
];

/** Det tangentbordsskalet behöver av ett `KeyboardEvent`. */
export type KeyPress = Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey" | "timeStamp">;

/** Tunt tangentbordsskal: översätter ett tangenttryck till ett Editor-kommando. */
export function keyToCommand(press: KeyPress): Command | null {
  const { key } = press;
  if (press.altKey) return null;
  if (press.ctrlKey || press.metaKey) {
    const lower = key.toLowerCase();
    if (lower === "z") return { type: press.shiftKey ? "redo" : "undo" };
    if (lower === "y") return { type: "redo" };
    return null;
  }
  if (key === "Delete" || key === "Backspace") return { type: press.shiftKey ? "deleteBeat" : "deleteNote" };
  if (Object.hasOwn(ARROW_KEYS, key)) return { type: "moveCursor", direction: ARROW_KEYS[key] };
  if (/^[0-9]$/.test(key)) return { type: "typeDigit", digit: Number(key), time: press.timeStamp };
  if (key === ".") return { type: "toggleDot" };
  if (key === "/") return { type: "toggleTriplet" };
  const lower = key.toLowerCase();
  if (lower === "r") return { type: "insertRest" };
  const duration = DURATION_KEYS.find((d) => d.key === lower);
  return duration ? { type: "setDuration", duration: duration.duration } : null;
}

/** Kortkommandona som de visas i editorns hjälpruta. */
export const SHORTCUTS: readonly { keys: string; action: string }[] = [
  { keys: "← → ↑ ↓", action: "Move cursor between beats and strings" },
  { keys: "0–9", action: "Enter fret (type two digits quickly for 10–24)" },
  ...DURATION_KEYS.map(({ key, name }) => ({ keys: key.toUpperCase(), action: name })),
  { keys: ".", action: "Toggle dotted" },
  { keys: "/", action: "Toggle triplet" },
  { keys: "R", action: "Insert rest and move on" },
  { keys: "Delete", action: "Delete note on the cursor's string" },
  { keys: "Shift+Delete", action: "Delete beat" },
  { keys: "Ctrl+Z", action: "Undo" },
  { keys: "Ctrl+Y / Ctrl+Shift+Z", action: "Redo" },
];
