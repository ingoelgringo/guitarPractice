/** Greppbrädan: vilka Prickar halsen visar för ett urval. Ren modul utan React. */

/** Antal band som visas utöver lös sträng. */
export const FRET_COUNT = 15;

/** Band med bandmarkering (inlay) på halsen. Band 12 har två. */
export const INLAY_FRETS: readonly number[] = [3, 5, 7, 9, 12];

export type ScaleId = "major" | "naturalMinor" | "majorPentatonic" | "minorPentatonic" | "blues";

/** Skalans intervall i halvtoner från Grundtonen. */
const SCALE_INTERVALS: Record<ScaleId, readonly number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  naturalMinor: [0, 2, 3, 5, 7, 8, 10],
  majorPentatonic: [0, 2, 4, 7, 9],
  minorPentatonic: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
};

/** Intervalletikett per antal halvtoner över Grundtonen. */
const INTERVAL_LABELS = ["1", "♭2", "2", "♭3", "3", "4", "♭5", "5", "♭6", "6", "♭7", "7"];

export interface FretboardSelection {
  /** Grundtonens tonklass, C = 0 … H/B = 11. */
  root: number;
  scale: ScaleId;
  /** Stämningen: MIDI-tonhöjd per lös sträng, sträng 1 först. */
  tuning: readonly number[];
}

/** En Prick: en markerad position på halsen. Sträng 1 är den ljusaste. */
export interface Dot {
  string: number;
  fret: number;
  label: string;
  isRoot: boolean;
}

export interface FretboardView {
  dots: Dot[];
}

export function fretboardView(selection: FretboardSelection): FretboardView {
  const intervals = SCALE_INTERVALS[selection.scale];
  const dots: Dot[] = [];
  selection.tuning.forEach((openPitch, index) => {
    for (let fret = 0; fret <= FRET_COUNT; fret++) {
      const interval = (((openPitch + fret - selection.root) % 12) + 12) % 12;
      if (!intervals.includes(interval)) continue;
      dots.push({ string: index + 1, fret, label: INTERVAL_LABELS[interval], isRoot: interval === 0 });
    }
  });
  return { dots };
}

/** Skalorna i den ordning de erbjuds, med namn för gränssnittet. */
export const SCALES: readonly { id: ScaleId; name: string }[] = [
  { id: "major", name: "Major" },
  { id: "naturalMinor", name: "Natural minor" },
  { id: "majorPentatonic", name: "Major pentatonic" },
  { id: "minorPentatonic", name: "Minor pentatonic" },
  { id: "blues", name: "Blues" },
];

/** Grundtonernas namn per tonklass. Tillfälliga tills Notnamnsläget finns. */
export const ROOT_NAMES: readonly string[] = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
