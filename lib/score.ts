// Partiturmodellen: källan till sanningen (ADR 0001). Inga beroenden till alphaTab.

/** Notvärde som nämnare: 1 = helnot, 4 = fjärdedel, 32 = trettiotvåondel. */
export type Duration = 1 | 2 | 4 | 8 | 16 | 32;

/** Notvärdena från längst till kortast. */
export const DURATIONS: readonly Duration[] = [1, 2, 4, 8, 16, 32];

/**
 * En ton i tabben. Sträng 1 är den ljusaste (ljusa e i standardstämning).
 * Teknikerna utelämnas när de inte gäller.
 */
export interface Note {
  string: number;
  fret: number;
  /**
   * Hammer-on eller pull-off till tonen på samma sträng i nästa slag. Banden avgör vilken:
   * uppåt är det en hammer-on, nedåt en pull-off. Utesluter `slide`.
   */
  hammerPull?: boolean;
  /** Slide till tonen på samma sträng i nästa slag. Utesluter `hammerPull`. */
  slide?: boolean;
  /** Bend upp till målet, i halvtoner: 1 är ½ ton och 2 hel ton. */
  bend?: BendTarget;
  palmMute?: boolean;
}

/** Målen för en bend i halvtoner: ½ ton, hel ton och 1½ ton. */
export const BEND_TARGETS = [1, 2, 3] as const;

export type BendTarget = (typeof BEND_TARGETS)[number];

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

/** Teknikerna som förbinder en ton med nästa ton på samma sträng. */
export const CONNECTIONS = ["hammerPull", "slide"] as const;

export type Connection = (typeof CONNECTIONS)[number];

/** En ton i ett Spårs Takter: Takt, slag och sträng. */
export interface NotePosition {
  bar: number;
  beat: number;
  string: number;
}

/**
 * Tonen som tonen vid `position` förbinds med: tonen på samma sträng i nästa slag, även när det
 * ligger i nästa Takt. `null` om det inte finns någon ton där, eller om den har samma band,
 * eftersom en förbindelse då varken är hammer-on, pull-off eller slide.
 */
export function connectionTarget(bars: readonly Bar[], { bar, beat, string }: NotePosition): Note | null {
  const beats = bars[bar]?.beats ?? [];
  const fret = beats[beat]?.notes.find((n) => n.string === string)?.fret;
  const next = beat + 1 < beats.length ? beats[beat + 1] : bars[bar + 1]?.beats[0];
  const target = next?.notes.find((n) => n.string === string);
  return target && target.fret !== fret ? target : null;
}

/**
 * Partituret utan förbindelser som saknar en ton att leda till, t.ex. efter att målet tagits bort.
 * Är alla förbindelser giltiga kommer samma Partitur tillbaka.
 */
export function withValidConnections(score: Score): Score {
  const result = structuredClone(score);
  let changed = false;
  for (const track of result.tracks) {
    track.bars.forEach((bar, b) =>
      bar.beats.forEach((beat, i) => {
        for (const note of beat.notes) {
          const position = { bar: b, beat: i, string: note.string };
          if (!CONNECTIONS.some((c) => note[c]) || connectionTarget(track.bars, position)) continue;
          for (const connection of CONNECTIONS) delete note[connection];
          changed = true;
        }
      }),
    );
  }
  return changed ? result : score;
}
