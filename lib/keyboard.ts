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

/** Tangent, Notvärde och namn på knapparna. Tangenterna gäller oavsett skiftläge. */
const DURATION_KEYS: readonly { key: string; duration: Duration; name: string; symbol: string }[] = [
  { key: "w", duration: 1, name: "Whole note", symbol: "\u{1D15D}" },
  { key: "h", duration: 2, name: "Half note", symbol: "\u{1D15E}" },
  { key: "q", duration: 4, name: "Quarter note", symbol: "\u{1D15F}" },
  { key: "e", duration: 8, name: "Eighth note", symbol: "\u{1D160}" },
  { key: "s", duration: 16, name: "Sixteenth note", symbol: "\u{1D161}" },
  { key: "t", duration: 32, name: "Thirty-second note", symbol: "\u{1D162}" },
];

/** Tangent, kommando och namn på knapparna för speltekniker. Tangenterna gäller oavsett skiftläge. */
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

/** Tangent, etikett och namn för textfälten på slaget. Tangenterna gäller oavsett skiftläge. */
const BEAT_TEXT_KEYS: Record<string, { field: BeatText; label: string; name: string }> = {
  c: { field: "chordName", label: "Chord", name: "Chord name above the beat (Tab: next beat, Enter: done)" },
  a: { field: "annotation", label: "Text", name: "Annotation on the beat (Tab: next beat, Enter: done)" },
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

/** Det tangenttryck som en knapp gör, med modifierarna som behövs. */
export type ShortcutPress = Pick<KeyPress, "key"> & Partial<Pick<KeyPress, "ctrlKey" | "shiftKey">>;

/**
 * Ett kortkommando som det visas som knapp i editorn. Knappen gör samma tangenttryck, så att
 * knappen och tangenten alltid gör samma sak.
 */
export interface Shortcut {
  press: ShortcutPress;
  /** Notationstecknet, eller en kort text när det inte finns något bra tecken. */
  label: string;
  /** Om etiketten är ett notationstecken, som behöver ett typsnitt med musiksymbolerna. */
  symbol?: boolean;
  /** Kortkommandot som det skrivs bredvid knappen. Utelämnas när det är etiketten, t.ex. siffrorna. */
  keys?: string;
  description: string;
}

export interface ShortcutGroup {
  name: string;
  shortcuts: readonly Shortcut[];
}

/** Kortkommandona som knappar, i grupper. */
export const SHORTCUT_GROUPS: readonly ShortcutGroup[] = [
  {
    name: "Cursor",
    shortcuts: [
      { press: { key: "ArrowLeft" }, label: "←", keys: "←", description: "Previous beat" },
      { press: { key: "ArrowRight" }, label: "→", keys: "→", description: "Next beat" },
      { press: { key: "ArrowUp" }, label: "↑", keys: "↑", description: "Higher string" },
      { press: { key: "ArrowDown" }, label: "↓", keys: "↓", description: "Lower string" },
    ],
  },
  {
    name: "Fret (type two digits quickly for 10–24)",
    shortcuts: Array.from({ length: 10 }, (_, digit) => ({
      press: { key: String(digit) },
      label: String(digit),
      description: `Enter fret ${digit}`,
    })),
  },
  {
    name: "Duration",
    shortcuts: DURATION_KEYS.map(({ key, name, symbol }) => ({
      press: { key },
      label: symbol,
      symbol: true,
      keys: key.toUpperCase(),
      description: name,
    })),
  },
  {
    name: "Rhythm",
    shortcuts: [
      { press: { key: "." }, label: "\u{1D15F}.", symbol: true, keys: ".", description: "Toggle dotted" },
      { press: { key: "/" }, label: "³", symbol: true, keys: "/", description: "Toggle triplet" },
      { press: { key: "r" }, label: "\u{1D13D}", symbol: true, keys: "R", description: "Insert rest and move on" },
    ],
  },
  {
    name: "Techniques",
    shortcuts: Object.entries(TECHNIQUE_KEYS).map(([key, { name, symbol }]) => ({
      press: { key },
      label: symbol,
      symbol: true,
      keys: key.toUpperCase(),
      description: name,
    })),
  },
  {
    name: "Text",
    shortcuts: Object.entries(BEAT_TEXT_KEYS).map(([key, { label, name }]) => ({
      press: { key },
      label,
      keys: key.toUpperCase(),
      description: name,
    })),
  },
  {
    name: "Repeats",
    shortcuts: [
      { press: { key: "[" }, label: "\u{1D106}", symbol: true, keys: "[", description: "Toggle repeat start on the bar" },
      {
        press: { key: "]" },
        label: "\u{1D107}",
        symbol: true,
        keys: "]",
        description: "Toggle repeat end on the bar (set the count under Bar)",
      },
    ],
  },
  {
    name: "Select",
    shortcuts: [
      { press: { key: "ArrowLeft", shiftKey: true }, label: "Beat ←", keys: "Shift+←", description: "Select beats to the left" },
      { press: { key: "ArrowRight", shiftKey: true }, label: "Beat →", keys: "Shift+→", description: "Select beats to the right" },
      {
        press: { key: "ArrowLeft", ctrlKey: true, shiftKey: true },
        label: "Bar ←",
        keys: "Ctrl+Shift+←",
        description: "Select whole bars to the left",
      },
      {
        press: { key: "ArrowRight", ctrlKey: true, shiftKey: true },
        label: "Bar →",
        keys: "Ctrl+Shift+→",
        description: "Select whole bars to the right",
      },
    ],
  },
  {
    name: "Edit",
    shortcuts: [
      { press: { key: "c", ctrlKey: true }, label: "Copy", keys: "Ctrl+C", description: "Copy selection" },
      { press: { key: "v", ctrlKey: true }, label: "Paste", keys: "Ctrl+V", description: "Paste over the beats from the cursor" },
      {
        press: { key: "Delete" },
        label: "Delete note",
        keys: "Delete",
        description: "Delete selection, or the note on the cursor's string",
      },
      {
        press: { key: "Delete", shiftKey: true },
        label: "Delete beat",
        keys: "Shift+Delete",
        description: "Delete selection, or the beat",
      },
      { press: { key: "z", ctrlKey: true }, label: "↶", keys: "Ctrl+Z", description: "Undo" },
      { press: { key: "y", ctrlKey: true }, label: "↷", keys: "Ctrl+Y / Ctrl+Shift+Z", description: "Redo" },
    ],
  },
];
