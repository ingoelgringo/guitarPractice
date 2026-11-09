/**
 * Ackordtext: tolkningen av det man skriver i ackordfältet, t.ex. `F#m7/C`, `Bbmaj7` eller `Hm` i
 * svenskt Notnamnsläge, och förslagen medan man skriver. Ren modul utan React.
 */

import type { NoteNameMode } from "./noteNameMode";
import {
  ALTERATIONS,
  type ChordType,
  type Extension,
  extensionsConflict,
  inExtensionOrder,
  type Key,
  keyChords,
  progressionChordName,
  type ProgressionChord,
} from "./progression";

const LETTER_PITCH: Record<NoteNameMode, Record<string, number>> = {
  english: { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 },
  swedish: { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, H: 11, B: 10 },
};

/** Om tangenten är en tonbokstav i Notnamnsläget, så att den öppnar ackordfältet. */
export function opensChordText(key: string, mode: NoteNameMode): boolean {
  return key.length === 1 && key.toUpperCase() in LETTER_PITCH[mode];
}

const ACCIDENTAL: Record<string, number> = { "#": 1, "♯": 1, b: -1, "♭": -1 };

/** En tonklass i början av texten, t.ex. "F#" eller "Hb", och hur många tecken den tar. */
function readNote(text: string, mode: NoteNameMode): { pitch: number; length: number } | null {
  const letter = text.charAt(0).toUpperCase();
  const base = LETTER_PITCH[mode][letter];
  if (base === undefined) return null;
  const accidental = ACCIDENTAL[text.charAt(1)] ?? 0;
  // På svenska är B redan B♭, men många skriver ändå Bb.
  const lowered = mode === "swedish" && letter === "B" && accidental === -1 ? 0 : accidental;
  return { pitch: (base + lowered + 12) % 12, length: accidental === 0 ? 1 : 2 };
}

/** Skrivsätt för ackordtypen direkt efter grundtonen. `ø` är halvförminskat, alltså m7♭5. */
const TYPE_TOKENS: readonly (readonly [string, ChordType, readonly Extension[]])[] = [
  ["min", "minor", []],
  ["dim", "diminished", []],
  ["aug", "augmented", []],
  ["°", "diminished", []],
  ["ø", "minor", ["7", "♭5"]],
  ["+", "augmented", []],
  ["-", "minor", []],
];

/** Skrivsätt för tilläggen och sus, längst först så att t.ex. "13" inte läses som "1". */
const TOKENS: readonly (readonly [string, readonly Extension[], ChordType?])[] = [
  ["maj13", ["maj7", "13"]],
  ["maj11", ["maj7", "11"]],
  ["maj9", ["maj7", "9"]],
  ["maj7", ["maj7"]],
  ["add9", ["add9"]],
  ["sus2", [], "sus2"],
  ["sus4", [], "sus4"],
  ["sus", [], "sus4"],
  ["6/9", ["6", "9"]],
  ["69", ["6", "9"]],
  ["M7", ["maj7"]],
  ["Δ", ["maj7"]],
  ...ALTERATIONS.flatMap((e): [string, Extension[]][] => [
    [e, [e]],
    [e.replace("♭", "b").replace("♯", "#"), [e]],
  ]),
  ["13", ["13"]],
  ["11", ["11"]],
  ["9", ["9"]],
  ["7", ["7"]],
  ["6", ["6"]],
].sort((a, b) => b[0].length - a[0].length) as [string, Extension[], ChordType?][];

/** Tecken mellan tilläggen som inte betyder något, t.ex. i `G7(b9,b13)`. */
const SEPARATORS = new Set(["(", ")", ",", " "]);

/**
 * Ackordet som texten beskriver: grundton, ackordtyp, tillägg och `/Bas`, med bokstäverna i
 * Notnamnsläget (i svenskt läge är H B och B B♭). Text som inte är ett ackord ger `null`.
 */
export function parseChordText(input: string, mode: NoteNameMode): ProgressionChord | null {
  let text = input.trim();
  const root = readNote(text, mode);
  if (!root) return null;
  text = text.slice(root.length);

  let bass = root.pitch;
  const slash = text.lastIndexOf("/");
  if (slash >= 0) {
    const note = readNote(text.slice(slash + 1), mode);
    if (note && note.length === text.length - slash - 1) {
      bass = note.pitch;
      text = text.slice(0, slash);
    }
  }

  let type: ChordType = "major";
  const extensions = new Set<Extension>();
  const typeToken = TYPE_TOKENS.find(([token]) => text.startsWith(token));
  if (typeToken) {
    type = typeToken[1];
    typeToken[2].forEach((e) => extensions.add(e));
    text = text.slice(typeToken[0].length);
    // ø har redan septiman, men skrivs ofta ø7.
    if (typeToken[0] === "ø" && text.startsWith("7")) text = text.slice(1);
  } else if (text.startsWith("m") && !text.startsWith("maj")) {
    type = "minor";
    text = text.slice(1);
  }

  while (text.length > 0) {
    if (SEPARATORS.has(text.charAt(0))) {
      text = text.slice(1);
      continue;
    }
    const token = TOKENS.find(([t]) => text.startsWith(t));
    if (!token) return null;
    const [written, added, sus] = token;
    if (added.some((e) => extensions.has(e) || [...extensions].some((on) => extensionsConflict(on, e)))) return null;
    if (sus) {
      if (type !== "major") return null;
      type = sus;
    }
    added.forEach((e) => extensions.add(e));
    text = text.slice(written.length);
  }

  return { root: root.pitch, type, extensions: inExtensionOrder(extensions), bass };
}

/** Ackord att föreslå utöver tonartens: på varje grundton dur, moll och de vanliga septimackorden. */
const COMMON: readonly (readonly [ChordType, readonly Extension[]])[] = [
  ["major", []],
  ["minor", []],
  ["major", ["7"]],
  ["minor", ["7"]],
  ["major", ["maj7"]],
  ["diminished", []],
  ["sus4", []],
];

const MAX_SUGGESTIONS = 8;

/** För jämförelsen: ♯ och ♭ som # och b, utan skillnad på stora och små bokstäver. */
const normalized = (text: string) => text.trim().replaceAll("♯", "#").replaceAll("♭", "b").toLowerCase();

/**
 * Förslagen för texten: först tonartens ackord vars namn börjar med texten, sedan ackordet som
 * texten beskriver och sist andra vanliga ackord vars namn börjar med texten.
 */
export function chordSuggestions(text: string, key: Key, mode: NoteNameMode): ProgressionChord[] {
  const typed = normalized(text);
  if (typed === "") return [];
  const parsed = parseChordText(text, mode);
  const common = Array.from({ length: 12 }, (_, root) =>
    COMMON.map(([type, extensions]): ProgressionChord => ({ root, type, extensions, bass: root })),
  ).flat();
  const candidates = [...keyChords(key).map(({ chord }) => chord), ...(parsed ? [parsed] : []), ...common];

  const seen = new Set<string>();
  const result: ProgressionChord[] = [];
  for (const chord of candidates) {
    const name = progressionChordName(chord, key, mode);
    if (seen.has(name) || (chord !== parsed && !normalized(name).startsWith(typed))) continue;
    seen.add(name);
    result.push(chord);
    if (result.length === MAX_SUGGESTIONS) break;
  }
  return result;
}
