// Partiturmodellen: källan till sanningen (ADR 0001). Inga beroenden till alphaTab.

/** Notvärde som nämnare: 1 = helnot, 4 = fjärdedel, 32 = trettiotvåondel. */
export type Duration = 1 | 2 | 4 | 8 | 16 | 32;

/** Notvärdena från längst till kortast. */
export const DURATIONS: readonly Duration[] = [1, 2, 4, 8, 16, 32];

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

/**
 * Hur Partituret visas, på skärmen och i utskriften: noter + tabulatur, bara noter eller
 * Rytmtab (tabulatur med rytmskaft, utan notsystem).
 */
export const VIEW_MODES = ["scoreAndTab", "scoreOnly", "rhythmTab"] as const;

export type ViewMode = (typeof VIEW_MODES)[number];

export interface Score {
  metadata: Metadata;
  viewMode: ViewMode;
  /** Starttempo i slag (fjärdedelar) per minut. */
  tempo: number;
  /** Starttaktart. Byten mitt i Partituret kommer i ticket 11. */
  timeSignature: TimeSignature;
  tracks: Track[];
}

export const STANDARD_TUNING: readonly number[] = [64, 59, 55, 50, 45, 40];

// Gränserna för ett giltigt Partitur. Editorn håller sig inom dem, och Partiturfilen avvisar
// filer utanför dem. De är därför en del av filformatet: en snävare gräns gör gamla filer
// oläsbara och kräver en ny schemaVersion med en migrering (se scoreFile.ts).

/** Det högsta band som går att skriva eller sätta Capo på. */
export const MAX_FRET = 24;

/** Det lägsta och högsta starttempot i BPM. */
export const MIN_TEMPO = 20;
export const MAX_TEMPO = 400;

/** Det lägsta och högsta antalet slag i en taktart. */
export const MIN_TIME_SIGNATURE_BEATS = 1;
export const MAX_TIME_SIGNATURE_BEATS = 32;

/** De Notvärden som en taktarts slag kan ha, t.ex. 8 i 6/8. */
export const TIME_SIGNATURE_BEAT_VALUES: readonly Duration[] = [2, 4, 8, 16];

/** Den lägsta och högsta MIDI-tonhöjd som en lös sträng kan ha. */
export const MIN_PITCH = 0;
export const MAX_PITCH = 127;

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
