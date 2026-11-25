import { STANDARD_TUNING } from "./score";

/** En namngiven Stämning: MIDI-tonhöjd per lös sträng eller Strängpar, sträng 1 först. */
export interface TuningPreset {
  name: string;
  tuning: readonly number[];
}

/**
 * Hur en sträng sitter på ett Stränginstrument: ensam, som ett Strängpar med samma ton
 * eller som ett Strängpar med en oktavsträng en oktav över Stämningens tonhöjd.
 */
export type CourseKind = "single" | "unison" | "octave";

export type StringInstrumentId = "guitar6" | "guitar7" | "guitar12" | "bass4" | "bass5" | "ukulele" | "mandolin";

/** Det man stämmer i Stämmaren, med sina strängar eller Strängpar, sträng 1 (närmast golvet) först. */
export interface StringInstrument {
  id: StringInstrumentId;
  courses: readonly CourseKind[];
  /** De färdiga stämningarna, förvalet först. */
  tunings: readonly TuningPreset[];
}

export const STANDARD_TUNING_NAME = "Standard tuning";

const singles = (count: number): CourseKind[] => Array<CourseKind>(count).fill("single");

export const STRING_INSTRUMENTS: readonly StringInstrument[] = [
  {
    id: "guitar6",
    courses: singles(6),
    tunings: [
      { name: STANDARD_TUNING_NAME, tuning: STANDARD_TUNING },
      { name: "Eb standard", tuning: [63, 58, 54, 49, 44, 39] },
      { name: "D standard", tuning: [62, 57, 53, 48, 43, 38] },
      { name: "Drop D", tuning: [64, 59, 55, 50, 45, 38] },
      { name: "Drop C#", tuning: [63, 58, 54, 49, 44, 37] },
      { name: "Drop C", tuning: [62, 57, 53, 48, 43, 36] },
      { name: "DADGAD", tuning: [62, 57, 55, 50, 45, 38] },
      { name: "Open D", tuning: [62, 57, 54, 50, 45, 38] },
      { name: "Open E", tuning: [64, 59, 56, 52, 47, 40] },
      { name: "Open G", tuning: [62, 59, 55, 50, 43, 38] },
      { name: "Open C", tuning: [64, 60, 55, 48, 43, 36] },
    ],
  },
  {
    id: "guitar7",
    courses: singles(7),
    tunings: [
      { name: "Standard", tuning: [64, 59, 55, 50, 45, 40, 35] },
      { name: "Drop A", tuning: [64, 59, 55, 50, 45, 40, 33] },
    ],
  },
  {
    id: "guitar12",
    courses: ["unison", "unison", "octave", "octave", "octave", "octave"],
    tunings: [{ name: "Standard", tuning: STANDARD_TUNING }],
  },
  {
    id: "bass4",
    courses: singles(4),
    tunings: [
      { name: "Standard", tuning: [43, 38, 33, 28] },
      { name: "Drop D", tuning: [43, 38, 33, 26] },
      { name: "Eb standard", tuning: [42, 37, 32, 27] },
    ],
  },
  {
    id: "bass5",
    courses: singles(5),
    tunings: [{ name: "Standard", tuning: [43, 38, 33, 28, 23] }],
  },
  {
    id: "ukulele",
    courses: singles(4),
    tunings: [
      // Hög G: sträng 4 är ljusare än sträng 3
      { name: "Standard", tuning: [69, 64, 60, 67] },
      { name: "Low G", tuning: [69, 64, 60, 55] },
      { name: "Baritone", tuning: [64, 59, 55, 50] },
    ],
  },
  {
    id: "mandolin",
    courses: ["unison", "unison", "unison", "unison"],
    tunings: [{ name: "Standard", tuning: [76, 69, 62, 55] }],
  },
];

/** Stränginstrumentet med id `id`. */
export function stringInstrument(id: StringInstrumentId): StringInstrument {
  const instrument = STRING_INSTRUMENTS.find((i) => i.id === id);
  if (!instrument) throw new Error(`Okänt Stränginstrument: ${id}`);
  return instrument;
}

const OCTAVE = 12;

/** Tonhöjderna man stämmer i en sträng eller ett Strängpar, den grövsta först. */
export function coursePitches(kind: CourseKind, pitch: number): number[] {
  return kind === "octave" ? [pitch, pitch + OCTAVE] : [pitch];
}

/** En sträng eller ett Strängpar som det visas i Stämmaren. */
export interface DisplayCourse {
  /** Strängnumret: 1 sitter närmast golvet. */
  course: number;
  /** En tonhöjd per knapp, den grövsta först. */
  pitches: number[];
}

/**
 * Strängarna i visningsordning, från den grövsta till vänster till den ljusaste till höger, som i "EADGBE".
 * Ordningen följer strängarna och inte tonhöjden, så ukulele med hög G visas som GCEA.
 */
export function displayCourses(instrument: StringInstrument, tuning: readonly number[]): DisplayCourse[] {
  return instrument.courses
    .map((kind, i) => ({ course: i + 1, pitches: coursePitches(kind, tuning[i]) }))
    .reverse();
}

/** Tabbeditorns förval: de färdiga stämningarna för 6-strängad gitarr. */
export const TUNING_PRESETS: readonly TuningPreset[] = stringInstrument("guitar6").tunings;

/** Förvalet som `tuning` motsvarar, eller `undefined` för en egen Stämning. */
export function findTuningPreset(tuning: readonly number[]): TuningPreset | undefined {
  return TUNING_PRESETS.find(
    (preset) => preset.tuning.length === tuning.length && preset.tuning.every((pitch, i) => pitch === tuning[i]),
  );
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Tonnamn med oktav för en MIDI-tonhöjd, t.ex. 40 → "E2". */
export function noteName(pitch: number): string {
  return `${NOTE_NAMES[pitch % 12]}${Math.floor(pitch / 12) - 1}`;
}
