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
  /** Ackordnamn ovanför slaget, t.ex. "Am7". Tolkas inte. Utelämnas när det saknas. */
  chordName?: string;
  /** Anteckning vid slaget, t.ex. "let ring". Utelämnas när den saknas. */
  annotation?: string;
}

/** Texterna som ett slag kan ha: Ackordnamn och Anteckning. */
export const BEAT_TEXTS = ["chordName", "annotation"] as const;

export type BeatText = (typeof BEAT_TEXTS)[number];

/**
 * En Takt. Byten och repriser gäller hela Partituret och utelämnas när de inte gäller. Editorn
 * sätter dem i varje Spår som har Takten, och översättaren läser dem från det första. Första
 * Takten har inga byten: där gäller Partiturets start.
 */
export interface Bar {
  beats: Beat[];
  /** Taktartsbyte: taktarten från och med den här Takten. */
  timeSignature?: TimeSignature;
  /** Tempobyte: tempot i BPM från och med den här Takten. */
  tempo?: number;
  /** Takten börjar en repris. */
  repeatStart?: boolean;
  /**
   * Takten slutar en repris, som spelas så här många varv sammanlagt. Reprisen går tillbaka
   * till den senaste reprisstart som inte redan hör till en avslutad inre repris, eller till
   * början om det inte finns någon. Repriser kan alltså ligga i varandra, och ett andra
   * reprisslut efter samma start spelar om allt från starten. Så spelar alphaTab dem.
   */
  repeatEnd?: number;
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
  /** Starttempo i slag (fjärdedelar) per minut. Byten ligger på Takterna. */
  tempo: number;
  /** Starttaktart. Byten ligger på Takterna. */
  timeSignature: TimeSignature;
  tracks: Track[];
}

export const STANDARD_TUNING: readonly number[] = [64, 59, 55, 50, 45, 40];

// Gränserna för ett giltigt Partitur. Editorn håller sig inom dem, och Partiturfilen avvisar
// filer utanför dem. De är därför en del av filformatet: en snävare gräns gör gamla filer
// oläsbara och kräver en ny schemaVersion med en migrering (se scoreFile.ts).

/** Det högsta band som går att skriva eller sätta Capo på. */
export const MAX_FRET = 24;

/** Det lägsta och högsta tempot i BPM, vid start och i tempobyten. */
export const MIN_TEMPO = 20;
export const MAX_TEMPO = 400;

/** Det lägsta och högsta antalet slag i en taktart. */
export const MIN_TIME_SIGNATURE_BEATS = 1;
export const MAX_TIME_SIGNATURE_BEATS = 32;

/** De Notvärden som en taktarts slag kan ha, t.ex. 8 i 6/8. */
export const TIME_SIGNATURE_BEAT_VALUES: readonly Duration[] = [2, 4, 8, 16];

/** Det lägsta och högsta antalet varv i en repris. */
export const MIN_REPEAT_COUNT = 2;
export const MAX_REPEAT_COUNT = 99;

/** Det högsta antalet tecken i ett slags Ackordnamn och Anteckning, utan blanksteg runt texten. */
export const MAX_BEAT_TEXT_LENGTH: Readonly<Record<BeatText, number>> = { chordName: 16, annotation: 40 };

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

/** Taktarten som gäller i Takt `bar` i Spår `track`: det senaste bytet, annars starttaktarten. */
export function timeSignatureAt(score: Score, track: number, bar: number): TimeSignature {
  return inEffect(score.tracks[track].bars, bar, "timeSignature") ?? score.timeSignature;
}

/** Tempot som gäller i Takt `bar` i Spår `track`: det senaste bytet, annars starttempot. */
export function tempoAt(score: Score, track: number, bar: number): number {
  return inEffect(score.tracks[track].bars, bar, "tempo") ?? score.tempo;
}

/** Det som kan bytas från en viss Takt: taktarten och tempot. */
export type BarChange = "timeSignature" | "tempo";

/** Det senaste bytet av `field` till och med Takt `bar`. */
function inEffect<F extends BarChange>(bars: readonly Bar[], bar: number, field: F): Bar[F] {
  for (let i = Math.min(bar, bars.length - 1); i > 0; i--) {
    if (bars[i][field] !== undefined) return bars[i][field];
  }
  return undefined;
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
