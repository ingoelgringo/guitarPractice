/**
 * Ackordföljden: Tonart, tempo, taktart, Delar med Ackord på Taktslag, och Formen. Ren modul utan
 * React. Alla funktioner returnerar en ny Ackordföljd och ändrar aldrig den de får.
 */

import type { NoteNameMode } from "./noteNameMode";

export const TIME_SIGNATURES = ["4/4", "3/4", "2/4", "6/8", "12/8"] as const;
export type TimeSignature = (typeof TIME_SIGNATURES)[number];

const PULSES: Record<TimeSignature, number> = { "4/4": 4, "3/4": 3, "2/4": 2, "6/8": 6, "12/8": 12 };

/** Antalet Taktslag i ett slag som tempot räknas i: tre i 6/8 och 12/8 (punkterade fjärdedelar), annars ett. */
export function pulsesPerBeat(timeSignature: TimeSignature): number {
  return timeSignature.endsWith("/8") ? 3 : 1;
}

/** Antalet Taktslag i en Takt. */
export function pulsesPerBar(timeSignature: TimeSignature): number {
  return PULSES[timeSignature];
}

export type KeyMode = "major" | "minor";

/** Tonarten: en grundton 0–11 (C = 0) och dur eller moll. */
export interface Key {
  tonic: number;
  mode: KeyMode;
}

export const CHORD_TYPES = ["major", "minor", "diminished", "augmented", "sus2", "sus4"] as const;
export type ChordType = (typeof CHORD_TYPES)[number];

/** Ett Ackord: grundton och Bas 0–11, ackordtyp och tillägg (t.ex. "7", "♭9"). */
export interface ProgressionChord {
  root: number;
  type: ChordType;
  extensions: readonly string[];
  bass: number;
}

/** Ett Ackord på ett Taktslag i en Del. Takter och Taktslag räknas från 0. */
export interface PlacedChord {
  bar: number;
  pulse: number;
  chord: ProgressionChord;
}

export interface Section {
  id: string;
  name: string;
  bars: number;
  /** Sorterade i tidsordning. */
  chords: readonly PlacedChord[];
}

export interface Progression {
  key: Key;
  tempo: number;
  timeSignature: TimeSignature;
  sections: readonly Section[];
  /** Delarnas id i den ordning de spelas. */
  form: readonly string[];
}

/** Ett Taktslag i en Del. */
export interface Position {
  section: string;
  bar: number;
  pulse: number;
}

export const MIN_TEMPO = 40;
export const MAX_TEMPO = 240;
const DEFAULT_TEMPO = 100;

export function newProgression(): Progression {
  const verse: Section = { id: newSectionId(), name: "Verse", bars: 4, chords: [] };
  return { key: { tonic: 0, mode: "major" }, tempo: DEFAULT_TEMPO, timeSignature: "4/4", sections: [verse], form: [verse.id] };
}

function newSectionId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** En treklang utan tillägg, med grundtonen som Bas. */
export function triad(root: number, type: ChordType): ProgressionChord {
  return { root, type, extensions: [], bass: root };
}

// Stavning: ett steg i skalan (0–6) och en förtecknad avvikelse från det, för varje intervall från
// Tonartens grundton. Toner utanför Tonarten stavas i dur som sänkta steg (♭2, ♭3, ♭6, ♭7) utom den
// överstigande kvarten, och i moll som höjda steg (♯3, ♯4, ♯6, ♯7) utom ♭2.
const SPELLING: Record<KeyMode, readonly (readonly [step: number, accidental: number])[]> = {
  major: [[0, 0], [1, -1], [1, 0], [2, -1], [2, 0], [3, 0], [3, 1], [4, 0], [5, -1], [5, 0], [6, -1], [6, 0]],
  minor: [[0, 0], [1, -1], [1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [4, 0], [5, 0], [5, 1], [6, 0], [6, 1]],
};

const SCALE: Record<KeyMode, readonly number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL = [0, 2, 4, 5, 7, 9, 11];
/** Grundtonens bokstav (0–6, C = 0) per tonklass: D♭-dur och F♯-dur, men C♯-moll och G♯-moll. */
const TONIC_LETTER: Record<KeyMode, readonly number[]> = {
  major: [0, 1, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6],
  minor: [0, 0, 1, 2, 2, 3, 3, 4, 4, 5, 6, 6],
};
/** Den fasta stavningen, när stavningen efter Tonarten skulle behöva dubbla förtecken. */
const FIXED = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

/** På svenska heter B H, och B♭ heter B. */
function inMode(name: string, mode: NoteNameMode): string {
  if (mode !== "swedish") return name;
  if (name === "B♭") return "B";
  return name.replace(/^B/, "H");
}

/** Tonklassen stavad efter Tonarten, t.ex. B♭ i F-dur och F♯ i a-moll. */
export function spellInKey(pitch: number, key: Key, mode: NoteNameMode): string {
  const interval = (((pitch - key.tonic) % 12) + 12) % 12;
  const [step] = SPELLING[key.mode][interval];
  const letter = (TONIC_LETTER[key.mode][key.tonic] + step) % 7;
  const accidental = ((((pitch - NATURAL[letter]) % 12) + 18) % 12) - 6;
  if (Math.abs(accidental) > 1) return inMode(FIXED[pitch], mode);
  return inMode(LETTERS[letter] + (accidental === 1 ? "♯" : accidental === -1 ? "♭" : ""), mode);
}

const TYPE_SUFFIX: Record<ChordType, string> = {
  major: "",
  minor: "m",
  diminished: "°",
  augmented: "+",
  sus2: "sus2",
  sus4: "sus4",
};

/** Ackordets namn stavat efter Tonarten, t.ex. "B♭", "F♯m", "B°" eller "G/B". */
export function progressionChordName(chord: ProgressionChord, key: Key, mode: NoteNameMode): string {
  const name = spellInKey(chord.root, key, mode) + TYPE_SUFFIX[chord.type] + chord.extensions.join("");
  return chord.bass === chord.root ? name : `${name}/${spellInKey(chord.bass, key, mode)}`;
}

/** Tonartens grundton stavad, t.ex. "F♯" eller "C♯". */
export function keyTonicName(key: Key, mode: NoteNameMode): string {
  return spellInKey(key.tonic, key, mode);
}

/** Ett av tonartens ackord med sitt steg, t.ex. "ii" för Dm i C-dur. */
export interface KeyChord {
  degree: string;
  chord: ProgressionChord;
}

const DEGREES: Record<KeyMode, readonly string[]> = {
  major: ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
  minor: ["i", "ii°", "III", "iv", "v", "VI", "VII"],
};

const DEGREE_TYPES: Record<KeyMode, readonly ChordType[]> = {
  major: ["major", "minor", "minor", "major", "major", "minor", "diminished"],
  minor: ["minor", "diminished", "major", "minor", "minor", "major", "major"],
};

/** Treklangen på steg 1–7 i Tonartens skala (naturlig moll i moll). */
export function degreeChord(key: Key, degree: number): ProgressionChord {
  const index = degree - 1;
  return triad((key.tonic + SCALE[key.mode][index]) % 12, DEGREE_TYPES[key.mode][index]);
}

/** Tonartens ackord: de sju treklangerna, och i moll även dur-V efter v. */
export function keyChords(key: Key): KeyChord[] {
  const chords = DEGREES[key.mode].map((degree, index) => ({ degree, chord: degreeChord(key, index + 1) }));
  if (key.mode === "minor") chords.splice(5, 0, { degree: "V", chord: triad((key.tonic + 7) % 12, "major") });
  return chords;
}

/** `+` ger dur och `−` ger moll. Tillägg och Bas finns kvar. */
export function withQuality(chord: ProgressionChord, type: "major" | "minor"): ProgressionChord {
  return { ...chord, type };
}

function section(progression: Progression, id: string): Section | undefined {
  return progression.sections.find((s) => s.id === id);
}

/** Ackordet på Taktslaget, eller `null` om där inte står något. */
export function chordAt(progression: Progression, position: Position): ProgressionChord | null {
  return (
    section(progression, position.section)?.chords.find((c) => c.bar === position.bar && c.pulse === position.pulse)?.chord ??
    null
  );
}

function updateSection(progression: Progression, id: string, change: (section: Section) => Section): Progression {
  return { ...progression, sections: progression.sections.map((s) => (s.id === id ? change(s) : s)) };
}

const byTime = (a: PlacedChord, b: PlacedChord) => a.bar - b.bar || a.pulse - b.pulse;

/** Placerar Ackordet på Taktslaget och ersätter det som stod där. */
export function placeChord(progression: Progression, position: Position, chord: ProgressionChord): Progression {
  return updateSection(progression, position.section, (s) => ({
    ...s,
    chords: [...s.chords.filter((c) => c.bar !== position.bar || c.pulse !== position.pulse), { bar: position.bar, pulse: position.pulse, chord }].sort(byTime),
  }));
}

export function removeChord(progression: Progression, position: Position): Progression {
  return updateSection(progression, position.section, (s) => ({
    ...s,
    chords: s.chords.filter((c) => c.bar !== position.bar || c.pulse !== position.pulse),
  }));
}

export function setKey(progression: Progression, key: Key): Progression {
  return { ...progression, key };
}

/** Byter taktart. Ackord på Taktslag som inte längre finns tas bort. */
export function setTimeSignature(progression: Progression, timeSignature: TimeSignature): Progression {
  const pulses = pulsesPerBar(timeSignature);
  return {
    ...progression,
    timeSignature,
    sections: progression.sections.map((s) => ({ ...s, chords: s.chords.filter((c) => c.pulse < pulses) })),
  };
}

/** Sätter tempot avrundat till hela bpm mellan 40 och 240. Ett ogiltigt tal ändrar inget. */
export function setTempo(progression: Progression, tempo: number): Progression {
  if (!Number.isFinite(tempo)) return progression;
  return { ...progression, tempo: clampTempo(tempo) };
}

function clampTempo(tempo: number): number {
  return Math.min(MAX_TEMPO, Math.max(MIN_TEMPO, Math.round(tempo)));
}

/** Hur länge ett uppehåll mellan två tryck får vara innan man räknas börja om, i millisekunder. */
const TAP_RESET = 2000;
/** Hur många av de senaste mellanrummen som räknas. */
const TAP_INTERVALS = 4;

/**
 * Tempot från trycken (tidpunkter i millisekunder, äldst först): medelvärdet av de senaste
 * mellanrummen efter det senaste uppehållet, eller `null` när det bara finns ett tryck.
 */
export function tapTempo(taps: readonly number[]): number | null {
  let start = 0;
  for (let i = 1; i < taps.length; i++) if (taps[i] - taps[i - 1] > TAP_RESET) start = i;
  const recent = taps.slice(start).slice(-(TAP_INTERVALS + 1));
  if (recent.length < 2) return null;
  const average = (recent[recent.length - 1] - recent[0]) / (recent.length - 1);
  return clampTempo(60000 / average);
}

/** Trycken som är värda att spara inför nästa tryck: de efter det senaste uppehållet. */
export function recentTaps(taps: readonly number[], now: number): number[] {
  const last = taps[taps.length - 1];
  if (last === undefined || now - last > TAP_RESET) return [now];
  return [...taps.slice(-TAP_INTERVALS), now];
}

/**
 * Markeringen efter en piltangent: ←/→ går en Takt till dess första Taktslag, Alt+←/→ ett
 * Taktslag och ↑/↓ en Del, över gränserna mellan Takter och Delar. Vid början och slutet står den
 * kvar. Andra tangenter ger `null`.
 */
export function move(progression: Progression, position: Position, { key, altKey }: { key: string; altKey: boolean }): Position | null {
  const pulses = pulsesPerBar(progression.timeSignature);
  const sections = progression.sections;
  const index = sections.findIndex((s) => s.id === position.section);
  if (index < 0) return null;
  const current = sections[index];

  switch (key) {
    case "ArrowRight":
      if (altKey && position.pulse < pulses - 1) return { ...position, pulse: position.pulse + 1 };
      if (position.bar < current.bars - 1) return { ...position, bar: position.bar + 1, pulse: 0 };
      if (index < sections.length - 1) return { section: sections[index + 1].id, bar: 0, pulse: 0 };
      return position;
    case "ArrowLeft":
      if (altKey) {
        if (position.pulse > 0) return { ...position, pulse: position.pulse - 1 };
        if (position.bar > 0) return { ...position, bar: position.bar - 1, pulse: pulses - 1 };
        if (index > 0) {
          const previous = sections[index - 1];
          return { section: previous.id, bar: previous.bars - 1, pulse: pulses - 1 };
        }
        return position;
      }
      if (position.bar > 0) return { ...position, bar: position.bar - 1, pulse: 0 };
      if (index > 0) {
        const previous = sections[index - 1];
        return { section: previous.id, bar: previous.bars - 1, pulse: 0 };
      }
      return position;
    case "ArrowDown":
    case "ArrowUp": {
      const target = sections[index + (key === "ArrowDown" ? 1 : -1)];
      if (!target) return position;
      return { section: target.id, bar: Math.min(position.bar, target.bars - 1), pulse: position.pulse };
    }
    default:
      return null;
  }
}
