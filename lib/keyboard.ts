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

/** Tangent, kommando och namn i hjälprutan för speltekniker. Tangenterna gäller oavsett skiftläge. */
const TECHNIQUE_KEYS: Record<string, { command: TechniqueCommand; name: string }> = {
  p: { command: "toggleHammerPull", name: "Toggle hammer-on / pull-off to the next note" },
  l: { command: "toggleSlide", name: "Toggle slide to the next note" },
  b: { command: "cycleBend", name: "Bend: ½ → full → 1½ → none" },
  m: { command: "togglePalmMute", name: "Toggle palm mute" },
};

type TechniqueCommand = Extract<Command["type"], "toggleHammerPull" | "toggleSlide" | "cycleBend" | "togglePalmMute">;

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
  if (Object.hasOwn(TECHNIQUE_KEYS, lower)) return { type: TECHNIQUE_KEYS[lower].command };
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
  ...Object.entries(TECHNIQUE_KEYS).map(([key, { name }]) => ({ keys: key.toUpperCase(), action: name })),
  { keys: "Delete", action: "Delete note on the cursor's string" },
  { keys: "Shift+Delete", action: "Delete beat" },
  { keys: "Ctrl+Z", action: "Undo" },
  { keys: "Ctrl+Y / Ctrl+Shift+Z", action: "Redo" },
];
