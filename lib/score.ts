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
  /** Punkterat: varar en och en halv gång Notvärdet. Utelämnas när det inte gäller. */
  dotted?: boolean;
  /** I triol: tre slag på två slags tid. Utelämnas när det inte gäller. */
  triplet?: boolean;
  notes: Note[];
}

export interface Bar {
  beats: Beat[];
}

export interface Track {
  /** MIDI-tonhöjd per lös sträng, sträng 1 först. */
  tuning: number[];
  /** Bandet som kapodastern sitter på, 0 utan Capo. Bandnumren i tabben är relativa till Capo. */
  capo: number;
  bars: Bar[];
}

/** Taktart, t.ex. 3/4: tre slag per Takt, där varje slag är en fjärdedel. */
export interface TimeSignature {
  beats: number;
  beatValue: Duration;
}

/** Det som står i huvudet på första Sidan. Tomma fält visas inte. */
export interface Metadata {
  title: string;
  subtitle: string;
  artist: string;
  tabbedBy: string;
}

export interface Score {
  metadata: Metadata;
  /** Starttempo i slag (fjärdedelar) per minut. */
  tempo: number;
  /** Starttaktart. Byten mitt i Partituret kommer i ticket 11. */
  timeSignature: TimeSignature;
  tracks: Track[];
}

export const STANDARD_TUNING: readonly number[] = [64, 59, 55, 50, 45, 40];

/** Ticks per helnot. Delbart så att även punkterade trioler av trettiotvåondelar blir heltal. */
const WHOLE_NOTE_TICKS = 3840;

/** Hur länge ett slag varar, i ticks. */
export function beatTicks(beat: Pick<Beat, "duration" | "dotted" | "triplet">): number {
  let ticks = WHOLE_NOTE_TICKS / beat.duration;
  if (beat.dotted) ticks = (ticks * 3) / 2;
  if (beat.triplet) ticks = (ticks * 2) / 3;
  return ticks;
}

/** Hur många ticks en Takt rymmer i taktarten. */
export function barCapacity(timeSignature: TimeSignature): number {
  return (timeSignature.beats * WHOLE_NOTE_TICKS) / timeSignature.beatValue;
}

/** Hur många ticks slagen i en Takt tar upp tillsammans. */
export function barTicks(bar: Bar): number {
  return bar.beats.reduce((sum, beat) => sum + beatTicks(beat), 0);
}
