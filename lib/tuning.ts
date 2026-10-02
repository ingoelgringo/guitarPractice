import { STANDARD_TUNING } from "./score";

/** En namngiven Stämning för 6-strängad gitarr: MIDI-tonhöjd per lös sträng, sträng 1 först. */
export interface TuningPreset {
  name: string;
  tuning: readonly number[];
}

export const STANDARD_TUNING_NAME = "Standard tuning";

export const TUNING_PRESETS: readonly TuningPreset[] = [
  { name: STANDARD_TUNING_NAME, tuning: STANDARD_TUNING },
  { name: "Drop D", tuning: [64, 59, 55, 50, 45, 38] },
  { name: "DADGAD", tuning: [62, 57, 55, 50, 45, 38] },
];

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
