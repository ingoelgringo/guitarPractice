// Partiturmodellen: källan till sanningen (ADR 0001). Inga beroenden till alphaTab.

/** Notvärde som nämnare: 1 = helnot, 4 = fjärdedel, 32 = trettiotvåondel. */
export type Duration = 1 | 2 | 4 | 8 | 16 | 32;

/** En ton i tabben. Sträng 1 är den ljusaste (ljusa e i standardstämning). */
export interface Note {
  string: number;
  fret: number;
}

/** Ett slag: en tidpunkt med ett Notvärde. Utan toner är slaget en paus. */
export interface Beat {
  duration: Duration;
  notes: Note[];
}

export interface Bar {
  beats: Beat[];
}

export interface Track {
  /** MIDI-tonhöjd per lös sträng, sträng 1 först. */
  tuning: number[];
  bars: Bar[];
}

/** Taktart, t.ex. 3/4: tre slag per Takt, där varje slag är en fjärdedel. */
export interface TimeSignature {
  beats: number;
  beatValue: Duration;
}

export interface Score {
  /** Starttaktart. Byten mitt i Partituret kommer i ticket 11. */
  timeSignature: TimeSignature;
  tracks: Track[];
}

export const STANDARD_TUNING: readonly number[] = [64, 59, 55, 50, 45, 40];
