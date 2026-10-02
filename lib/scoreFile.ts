import {
  BEND_TARGETS,
  DURATIONS,
  MAX_FRET,
  MAX_PITCH,
  MAX_REPEAT_COUNT,
  MAX_TEMPO,
  MAX_TIME_SIGNATURE_BEATS,
  MIN_PITCH,
  MIN_REPEAT_COUNT,
  MIN_TEMPO,
  MIN_TIME_SIGNATURE_BEATS,
  TIME_SIGNATURE_BEAT_VALUES,
  VIEW_MODES,
  type Bar,
  type Beat,
  type Metadata,
  type Note,
  type Score,
  type TimeSignature,
  type Track,
  withValidConnections,
} from "./score";

// Partiturfilen (.itab, ADR 0002): samma dokument laddas ner som fil och lagras i databasen.
// Formatet är ett publikt kontrakt så fort en fil har laddats ner, och filer hos användare
// går inte att ta tillbaka. Därför gäller för varje ändring av Partiturmodellen:
// - Utöka rundturstesterna i scoreFile.test.ts med det nya notationselementet.
// - Gränserna i score.ts hör till formatet: en snävare gräns räknas som en ändring av formatet.
// - Ändras formatet: höj SCHEMA_VERSION och lägg till en migrering från den förra versionen
//   i MIGRATIONS. Lägg en fixturfil för den nya versionen i lib/fixtures/ och ändra aldrig
//   de gamla fixturfilerna.

/** Märker dokumentet som en Partiturfil, så att andra JSON-filer känns igen. */
const FORMAT = "itab";

/** Filändelsen för en Partiturfil. */
export const FILE_EXTENSION = ".itab";

/** Formatets nuvarande version. */
export const SCHEMA_VERSION = 3;

/** En migrering tar Partituret i ett dokument från en version till nästa. */
export type Migration = (score: unknown) => unknown;

/** Migreringarna uppåt: `MIGRATIONS[n]` tar ett Partitur från version n till n + 1. */
const MIGRATIONS: Readonly<Record<number, Migration>> = {
  // Version 2 lade till speltekniker på tonerna. Ett Partitur i version 1 har inga och är oförändrat.
  1: (score) => score,
  // Version 3 lade till takt- och tempobyten samt repriser på Takterna. Ett Partitur i version 2
  // har inga och är oförändrat.
  2: (score) => score,
};

export type ParseError =
  /** Texten är inte JSON, t.ex. en avbruten nedladdning. */
  | { kind: "invalidJson" }
  /** JSON, men inte en Partiturfil. */
  | { kind: "notAScoreFile" }
  /** En Partiturfil från en senare version av editorn. */
  | { kind: "unsupportedVersion"; version: number }
  /** En Partiturfil vars Partitur inte går att läsa. */
  | { kind: "invalidScore" };

export type ParseResult = { ok: true; score: Score } | { ok: false; error: ParseError };

export function serialize(score: Score): string {
  return JSON.stringify({ format: FORMAT, schemaVersion: SCHEMA_VERSION, score }, null, 2);
}

export function parse(text: string): ParseResult {
  let document: unknown;
  try {
    document = JSON.parse(text);
  } catch {
    return failure({ kind: "invalidJson" });
  }
  if (!isRecord(document) || document.format !== FORMAT) return failure({ kind: "notAScoreFile" });
  const version = document.schemaVersion;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) return failure({ kind: "notAScoreFile" });
  if (version > SCHEMA_VERSION) return failure({ kind: "unsupportedVersion", version });

  try {
    return { ok: true, score: readScore(migrate(document.score, version, SCHEMA_VERSION, MIGRATIONS)) };
  } catch (error) {
    if (error instanceof InvalidScore) return failure({ kind: "invalidScore" });
    throw error;
  }
}

/** Den längsta titel (tecken) som går in i filnamnet. */
const MAX_FILE_NAME_LENGTH = 100;

/** Namn som Windows reserverar för enheter och inte tillåter som filnamn. */
const RESERVED_NAMES = /^(con|prn|aux|nul|com\d|lpt\d)$/i;

/**
 * Filnamnet för nedladdningen: Partiturets titel utan tecken som filsystem inte tillåter,
 * eller "Untitled" när titeln saknas.
 */
export function fileName(score: Score): string {
  let name = score.metadata.title
    // Tecken som är förbjudna i filnamn på Windows, macOS eller Linux, och styrtecken
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, MAX_FILE_NAME_LENGTH)
    // Windows tillåter inte att ett filnamn slutar med punkt eller mellanslag
    .replace(/[. ]+$/, "")
    .trim();
  if (name === "") name = "Untitled";
  if (RESERVED_NAMES.test(name)) name += "_";
  return `${name}${FILE_EXTENSION}`;
}

/**
 * Kedjar migreringar: tar ett Partitur från version `from` till version `to` genom att låta
 * det passera varje migrering på vägen i tur och ordning.
 */
export function migrate(
  score: unknown,
  from: number,
  to: number,
  migrations: Readonly<Record<number, Migration>>,
): unknown {
  let result = score;
  for (let version = from; version < to; version++) {
    const step = migrations[version];
    if (!step) throw new Error(`Det saknas en migrering från version ${version}`);
    result = step(result);
  }
  return result;
}

/** Kastas när dokumentets Partitur inte följer modellen. */
class InvalidScore extends Error {}

/**
 * Läser ett Partitur ur ett dokument i den nuvarande versionen och kontrollerar det mot
 * samma gränser som Editorn. Okända fält tas bort, och flaggor tas med bara när de är satta,
 * så att resultatet ser ut precis som ett Partitur som Editorn har skapat.
 */
function readScore(data: unknown): Score {
  const score = readRecord(data);
  const tracks = readList(score.tracks, readTrack);
  ensure(tracks.length > 0);
  const result = {
    metadata: readMetadata(score.metadata),
    viewMode: readOneOf(score.viewMode, VIEW_MODES),
    tempo: readInteger(score.tempo, MIN_TEMPO, MAX_TEMPO),
    timeSignature: readTimeSignature(score.timeSignature),
    tracks,
  };
  // Hammer-on, pull-off och slide måste leda till en ton med ett annat band, som i Editorn
  ensure(withValidConnections(result) === result);
  return result;
}

function readMetadata(data: unknown): Metadata {
  const metadata = readRecord(data);
  return {
    title: readText(metadata.title),
    subtitle: readText(metadata.subtitle),
    artist: readText(metadata.artist),
    tabbedBy: readText(metadata.tabbedBy),
  };
}

function readTimeSignature(data: unknown): TimeSignature {
  const timeSignature = readRecord(data);
  return {
    beats: readInteger(timeSignature.beats, MIN_TIME_SIGNATURE_BEATS, MAX_TIME_SIGNATURE_BEATS),
    beatValue: readOneOf(timeSignature.beatValue, TIME_SIGNATURE_BEAT_VALUES),
  };
}

function readTrack(data: unknown): Track {
  const track = readRecord(data);
  const tuning = readList(track.tuning, (pitch) => readInteger(pitch, MIN_PITCH, MAX_PITCH));
  ensure(tuning.length > 0);
  const bars = readList(track.bars, (bar) => readBar(bar, tuning.length));
  ensure(bars.length > 0);
  // I första Takten gäller Partiturets starttaktart och starttempo, som i Editorn
  ensure(bars[0].timeSignature === undefined && bars[0].tempo === undefined);
  return { tuning, capo: readInteger(track.capo, 0, MAX_FRET), bars };
}

function readBar(data: unknown, stringCount: number): Bar {
  const bar = readRecord(data);
  const beats = readList(bar.beats, (beat) => readBeat(beat, stringCount));
  ensure(beats.length > 0);
  return {
    beats,
    ...(bar.timeSignature !== undefined && { timeSignature: readTimeSignature(bar.timeSignature) }),
    ...(bar.tempo !== undefined && { tempo: readInteger(bar.tempo, MIN_TEMPO, MAX_TEMPO) }),
    ...(readFlag(bar.repeatStart) && { repeatStart: true }),
    ...(bar.repeatEnd !== undefined && { repeatEnd: readInteger(bar.repeatEnd, MIN_REPEAT_COUNT, MAX_REPEAT_COUNT) }),
  };
}

function readBeat(data: unknown, stringCount: number): Beat {
  const beat = readRecord(data);
  // Editorn håller tonerna sorterade efter sträng
  const notes = readList(beat.notes, (note) => readNote(note, stringCount)).sort((a, b) => a.string - b.string);
  ensure(new Set(notes.map((n) => n.string)).size === notes.length);
  return {
    duration: readOneOf(beat.duration, DURATIONS),
    ...(readFlag(beat.dotted) && { dotted: true }),
    ...(readFlag(beat.triplet) && { triplet: true }),
    notes,
  };
}

function readNote(data: unknown, stringCount: number): Note {
  const note = readRecord(data);
  const hammerPull = readFlag(note.hammerPull);
  const slide = readFlag(note.slide);
  ensure(!(hammerPull && slide));
  return {
    string: readInteger(note.string, 1, stringCount),
    fret: readInteger(note.fret, 0, MAX_FRET),
    ...(hammerPull && { hammerPull: true }),
    ...(slide && { slide: true }),
    ...(note.bend !== undefined && { bend: readOneOf(note.bend, BEND_TARGETS) }),
    ...(readFlag(note.palmMute) && { palmMute: true }),
  };
}

function ensure(condition: boolean): asserts condition {
  if (!condition) throw new InvalidScore();
}

function readRecord(value: unknown): Record<string, unknown> {
  ensure(isRecord(value));
  return value;
}

function readList<T>(value: unknown, read: (item: unknown) => T): T[] {
  ensure(Array.isArray(value));
  return value.map(read);
}

function readText(value: unknown): string {
  ensure(typeof value === "string");
  return value;
}

/** Ett heltal från `min` till och med `max`. */
function readInteger(value: unknown, min: number, max: number): number {
  ensure(typeof value === "number" && Number.isInteger(value) && value >= min && value <= max);
  return value;
}

/** En flagga som får utelämnas. */
function readFlag(value: unknown): boolean {
  ensure(value === undefined || typeof value === "boolean");
  return value === true;
}

function readOneOf<T>(value: unknown, allowed: readonly T[]): T {
  ensure(allowed.includes(value as T));
  return value as T;
}

function failure(error: ParseError): ParseResult {
  return { ok: false, error };
}

/** Ett JSON-objekt, inte en lista eller `null`. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
