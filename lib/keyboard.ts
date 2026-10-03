import type { Command, Direction, Side } from "./editor";
import type { BeatText, Duration } from "./score";

const ARROW_KEYS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

/** Piltangenterna som utökar en markering med Shift. */
const SIDE_KEYS: Record<string, Side> = {
  ArrowLeft: "left",
  ArrowRight: "right",
};

/** Tangent, Notvärde och namn i hjälprutan. Tangenterna gäller oavsett skiftläge. */
const DURATION_KEYS: readonly { key: string; duration: Duration; name: string; symbol: string }[] = [
  { key: "w", duration: 1, name: "Whole note", symbol: "\u{1D15D}" },
  { key: "h", duration: 2, name: "Half note", symbol: "\u{1D15E}" },
  { key: "q", duration: 4, name: "Quarter note", symbol: "\u{1D15F}" },
  { key: "e", duration: 8, name: "Eighth note", symbol: "\u{1D160}" },
  { key: "s", duration: 16, name: "Sixteenth note", symbol: "\u{1D161}" },
  { key: "t", duration: 32, name: "Thirty-second note", symbol: "\u{1D162}" },
];

/** Tangent, kommando och namn i hjälprutan för speltekniker. Tangenterna gäller oavsett skiftläge. */
const TECHNIQUE_KEYS: Record<string, { command: TechniqueCommand; name: string; symbol: string }> = {
  p: { command: "toggleHammerPull", name: "Toggle hammer-on / pull-off to the next note", symbol: "H/P" },
  l: { command: "toggleSlide", name: "Toggle slide to the next note", symbol: "↗" },
  b: { command: "cycleBend", name: "Bend: ½ → full → 1½ → none", symbol: "⤴" },
  m: { command: "togglePalmMute", name: "Toggle palm mute", symbol: "P.M." },
};

type TechniqueCommand = Extract<Command["type"], "toggleHammerPull" | "toggleSlide" | "cycleBend" | "togglePalmMute">;

/** Det tangentbordsskalet behöver av ett `KeyboardEvent`. */
export type KeyPress = Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey" | "timeStamp">;

/** Tunt tangentbordsskal: översätter ett tangenttryck till ett Editor-kommando. */
export function keyToCommand(press: KeyPress): Command | null {
  const { key } = press;
  // På t.ex. svenskt tangentbord skrivs [ och ] med AltGr (Ctrl+Alt på Windows) eller Option.
  // Andra tangenter med Alt är kortkommandon för annat och lämnas orörda.
  if (press.altKey) return key === "[" || key === "]" ? symbolToCommand(key) : null;
  if (press.ctrlKey || press.metaKey) {
    const lower = key.toLowerCase();
    if (lower === "z") return { type: press.shiftKey ? "redo" : "undo" };
    if (lower === "y") return { type: "redo" };
    if (lower === "c") return { type: "copy" };
    if (lower === "v") return { type: "paste" };
    return press.shiftKey && Object.hasOwn(SIDE_KEYS, key)
      ? { type: "extendSelection", direction: SIDE_KEYS[key], unit: "bar" }
      : null;
  }
  if (press.shiftKey && Object.hasOwn(SIDE_KEYS, key)) {
    return { type: "extendSelection", direction: SIDE_KEYS[key], unit: "beat" };
  }
  if (key === "Delete" || key === "Backspace") return { type: press.shiftKey ? "deleteBeat" : "deleteNote" };
  if (Object.hasOwn(ARROW_KEYS, key)) return { type: "moveCursor", direction: ARROW_KEYS[key] };
  if (/^[0-9]$/.test(key)) return { type: "typeDigit", digit: Number(key), time: press.timeStamp };
  const symbol = symbolToCommand(key);
  if (symbol) return symbol;
  const lower = key.toLowerCase();
  if (lower === "r") return { type: "insertRest" };
  if (Object.hasOwn(TECHNIQUE_KEYS, lower)) return { type: TECHNIQUE_KEYS[lower].command };
  const duration = DURATION_KEYS.find((d) => d.key === lower);
  return duration ? { type: "setDuration", duration: duration.duration } : null;
}

/** Tangent och namn i hjälprutan för textfälten på slaget. Tangenterna gäller oavsett skiftläge. */
const BEAT_TEXT_KEYS: Record<string, { field: BeatText; name: string }> = {
  c: { field: "chordName", name: "Chord name above the beat (Tab: next beat, Enter: done)" },
  a: { field: "annotation", name: "Annotation on the beat (Tab: next beat, Enter: done)" },
};

/**
 * Tunt tangentbordsskal: vilket textfält på slaget under markören ett tangenttryck öppnar.
 * Det är inget Editor-kommando, eftersom fältet bara finns i gränssnittet tills texten sparas.
 */
export function keyToBeatText(press: KeyPress): BeatText | null {
  if (press.ctrlKey || press.metaKey || press.altKey) return null;
  const lower = press.key.toLowerCase();
  return Object.hasOwn(BEAT_TEXT_KEYS, lower) ? BEAT_TEXT_KEYS[lower].field : null;
}

/** Kommandot för ett tecken som varken är bokstav eller siffra. */
function symbolToCommand(key: string): Command | null {
  if (key === ".") return { type: "toggleDot" };
  if (key === "/") return { type: "toggleTriplet" };
  if (key === "[") return { type: "toggleRepeatStart" };
  if (key === "]") return { type: "toggleRepeatEnd" };
  return null;
}

/** Kortkommandona som de visas i editorns hjälpruta, med notationstecknet där det finns ett. */
export const SHORTCUTS: readonly { keys: string; action: string; symbol?: string }[] = [
  { keys: "← → ↑ ↓", action: "Move cursor between beats and strings" },
  { keys: "0–9", action: "Enter fret (type two digits quickly for 10–24)" },
  ...DURATION_KEYS.map(({ key, name, symbol }) => ({ keys: key.toUpperCase(), action: name, symbol })),
  { keys: ".", action: "Toggle dotted", symbol: "\u{1D15F}." },
  { keys: "/", action: "Toggle triplet", symbol: "³" },
  { keys: "R", action: "Insert rest and move on", symbol: "\u{1D13D}" },
  ...Object.entries(TECHNIQUE_KEYS).map(([key, { name, symbol }]) => ({ keys: key.toUpperCase(), action: name, symbol })),
  ...Object.entries(BEAT_TEXT_KEYS).map(([key, { name }]) => ({ keys: key.toUpperCase(), action: name })),
  { keys: "[", action: "Toggle repeat start on the bar", symbol: "\u{1D106}" },
  { keys: "]", action: "Toggle repeat end on the bar (set the count under Bar)", symbol: "\u{1D107}" },
  { keys: "Shift+← →", action: "Select beats" },
  { keys: "Ctrl+Shift+← →", action: "Select whole bars" },
  { keys: "Ctrl+C", action: "Copy selection" },
  { keys: "Ctrl+V", action: "Paste over the beats from the cursor" },
  { keys: "Delete", action: "Delete selection, or the note on the cursor's string" },
  { keys: "Shift+Delete", action: "Delete selection, or the beat" },
  { keys: "Ctrl+Z", action: "Undo" },
  { keys: "Ctrl+Y / Ctrl+Shift+Z", action: "Redo" },
];
