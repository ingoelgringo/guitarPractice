import {
  barCapacity,
  barTicks,
  beatTicks,
  BEND_TARGETS,
  CONNECTIONS,
  connectionTarget,
  DURATIONS,
  MAX_BEAT_TEXT_LENGTH,
  MAX_FRET,
  MAX_PITCH,
  MAX_REPEAT_COUNT,
  MAX_TEMPO,
  MAX_TIME_SIGNATURE_BEATS,
  MIN_PITCH,
  MIN_REPEAT_COUNT,
  MIN_TEMPO,
  MIN_TIME_SIGNATURE_BEATS,
  STANDARD_TUNING,
  tempoAt,
  TIME_SIGNATURE_BEAT_VALUES,
  timeSignatureAt, type Bar, type BarChange, type Beat, type BeatText, type Connection, type Duration, type Metadata, type Note, type Score, type TimeSignature, type Track, VIEW_MODES, type ViewMode, withValidConnections } from "./score";

export interface Cursor {
  track: number;
  bar: number;
  beat: number;
  /** Sträng 1 är den ljusaste. */
  string: number;
}

/** Ett slag i markörens Spår: Takt och slag. */
export interface BeatPosition {
  bar: number;
  beat: number;
}

/**
 * En markering av slag i markörens Spår, från `anchor` där den började till `head` där markören
 * står. Båda slagen ingår, och `head` kan ligga före `anchor`.
 */
export interface Selection {
  anchor: BeatPosition;
  head: BeatPosition;
}

export interface EditorState {
  score: Score;
  cursor: Cursor;
  /** Markeringen, eller `null` utan markering. Den tas bort när Partituret ändras. */
  selection: Selection | null;
  /** De senast kopierade slagen, eller `null` om inget har kopierats. Följer med till ett annat Partitur. */
  clipboard: Beat[] | null;
  /**
   * Den senast skrivna siffran, som nästa siffra kan bilda ett tvåsiffrigt band med.
   * `recorded` säger om siffran blev en egen ändring i historiken.
   */
  pendingDigit: { digit: number; time: number; recorded: boolean } | null;
  history: History;
}

/** Ett läge att återvända till med ångra eller gör om. */
interface Snapshot {
  score: Score;
  cursor: Cursor;
}

/** En ändring av Partituret: lägena före och efter. */
interface Change {
  before: Snapshot;
  after: Snapshot;
}

interface History {
  /** Ändringarna som går att ångra, äldst först. */
  undo: Change[];
  /** Ändringarna som ångrats, den senast ångrade sist. */
  redo: Change[];
}

/** Hur länge (ms) efter en siffra som nästa siffra slås ihop med den till ett tvåsiffrigt band. */
export const TWO_DIGIT_WINDOW_MS = 1000;

export type Direction = "up" | "down" | "left" | "right";

/** Riktningarna längs tiden, som en markering kan utökas åt. */
export type Side = Extract<Direction, "left" | "right">;

/** Hur långt en markering utökas åt gången: ett slag eller en hel Takt. */
export type SelectionUnit = "beat" | "bar";

export type Command =
  | { type: "enterFret"; fret: number }
  /** En siffra från tangentbordet; `time` (ms) avgör om den bildar ett tvåsiffrigt band med den förra. */
  | { type: "typeDigit"; digit: number; time: number }
  /** Vänster och höger tar bort markeringen, upp och ner behåller den. */
  | { type: "moveCursor"; direction: Direction }
  /** Flyttar markören till en position, t.ex. efter ett klick i notbilden. Finns den inte händer ingenting. */
  | { type: "moveCursorTo"; position: Cursor }
  /**
   * Utökar markeringen ett slag eller en hel Takt åt sidan, och markören följer med. Utan
   * markering börjar den vid markören. Med `unit: "bar"` omfattar markeringen hela Takter: först
   * markörens, sedan en Takt till eller en färre åt gången.
   */
  | { type: "extendSelection"; direction: Side; unit: SelectionUnit }
  /** Kopierar de markerade slagens toner och Notvärden. Utan markering händer ingenting. */
  | { type: "copy" }
  /**
   * Skriver över slagen från markören, eller från markeringens början, och framåt med de kopierade
   * slagen, även i följande Takter,
   * och markören hamnar på det sista. I slutet av Partituret fylls den sista Takten och nya Takter
   * skapas. Takter som inte längre stämmer flaggas av valideringen men rättas inte.
   */
  | { type: "paste" }
  /**
   * Tar bort de markerade slagen. Helt markerade Takter tas bort, med samma regler som
   * `deleteBar`. Utan markering händer ingenting.
   */
  | { type: "deleteSelection" }
  /**
   * Infogar en tom Takt före eller efter markörens Takt, fylld med pauser i den taktart som gäller
   * där, och markören går till den. Byten och repriser ligger kvar i sina Takter.
   */
  | { type: "insertBarBefore" }
  | { type: "insertBarAfter" }
  /**
   * Tar bort markörens Takt, och markören går till Takten efter. De andra Takterna behåller sin
   * taktart och sitt tempo, så ett Byte i Takten flyttas till nästa. Den enda Takten blir en paus.
   */
  | { type: "deleteBar" }
  | { type: "setDuration"; duration: Duration }
  | { type: "toggleDot" }
  | { type: "toggleTriplet" }
  /** Gör slaget under markören till en paus och går vidare till nästa slag. */
  | { type: "insertRest" }
  /** Tar bort tonen på markörens sträng i slaget under markören. Med en markering tas den bort i stället. */
  | { type: "deleteNote" }
  /**
   * Tar bort slaget under markören. En Takt behåller alltid minst ett slag. Med en markering tas
   * den bort i stället.
   */
  | { type: "deleteBeat" }
  /**
   * Växlar hammer-on/pull-off från tonen på markörens sträng till tonen på samma sträng i nästa
   * slag. Utan en sådan ton, eller om den har samma band, händer ingenting.
   */
  | { type: "toggleHammerPull" }
  /** Växlar slide från tonen på markörens sträng, med samma krav som `toggleHammerPull`. */
  | { type: "toggleSlide" }
  /** Byter bend för tonen på markörens sträng i tur och ordning: ½ ton, hel ton, 1½ ton, ingen. */
  | { type: "cycleBend" }
  /** Växlar palm mute för tonen på markörens sträng. */
  | { type: "togglePalmMute" }
  /**
   * Sätter Ackordnamnet eller Anteckningen på slaget under markören, även med en markering.
   * Blanksteg runt texten tas bort, tom text tar bort fältet och för lång text avvisas.
   */
  | { type: "setBeatText"; field: BeatText; text: string }
  /** Sätter de angivna fälten i metadatan och lämnar resten orörda. */
  | { type: "setMetadata"; metadata: Partial<Metadata> }
  /** Byter Stämning för markörens Spår. Antalet strängar ändras inte. */
  | { type: "setTuning"; tuning: number[] }
  /** Sätter Capo för markörens Spår. Bandnumren i tabben ändras inte, eftersom de är relativa till Capo. */
  | { type: "setCapo"; capo: number }
  /** Sätter starttempot i BPM. */
  | { type: "setTempo"; tempo: number }
  /** Sätter starttaktarten. Takter som inte längre stämmer flaggas av valideringen men rättas inte. */
  | { type: "setTimeSignature"; timeSignature: TimeSignature }
  /**
   * Byter taktart från och med markörens Takt. På första Takten ändras starttaktarten. Ett byte
   * till den taktart som redan gäller före Takten tar bort bytet.
   */
  | { type: "setBarTimeSignature"; timeSignature: TimeSignature }
  /** Tar bort taktartsbytet på markörens Takt, som då följer taktarten före den. */
  | { type: "clearBarTimeSignature" }
  /** Byter tempo från och med markörens Takt, på samma sätt som `setBarTimeSignature`. */
  | { type: "setBarTempo"; tempo: number }
  /** Tar bort tempobytet på markörens Takt. */
  | { type: "clearBarTempo" }
  /** Växlar reprisstart på markörens Takt. */
  | { type: "toggleRepeatStart" }
  /** Växlar reprisslut på markörens Takt. Ett nytt reprisslut spelas två varv. */
  | { type: "toggleRepeatEnd" }
  /** Sätter antalet varv för reprisslutet på markörens Takt. Utan reprisslut händer ingenting. */
  | { type: "setRepeatCount"; count: number }
  /** Byter Vy-läge. Inmatningen är tab-först i alla lägen. */
  | { type: "setViewMode"; viewMode: ViewMode }
  /** Byter Partituret i Editorn mot ett annat, t.ex. en öppnad Partiturfil. Historiken börjar om. */
  | { type: "openScore"; score: Score }
  | { type: "undo" }
  | { type: "redo" };

export function createEditor(): EditorState {
  return editorFor({
    metadata: { title: "", subtitle: "", artist: "", tabbedBy: "" },
    viewMode: "scoreAndTab",
    tempo: 120,
    timeSignature: { beats: 4, beatValue: 4 },
    tracks: [
      {
        tuning: [...STANDARD_TUNING],
        capo: 0,
        bars: [{ beats: [{ duration: 4, notes: [] }] }],
      },
    ],
  });
}

/** En Editor för `score` med markören först och tom historik. */
function editorFor(score: Score): EditorState {
  return {
    score,
    cursor: { track: 0, bar: 0, beat: 0, string: 1 },
    selection: null,
    clipboard: null,
    pendingDigit: null,
    history: { undo: [], redo: [] },
  };
}

export function apply(state: EditorState, command: Command): EditorState {
  if (command.type === "undo") return undo(state);
  if (command.type === "redo") return redo(state);
  if (command.type === "openScore") return { ...editorFor(command.score), clipboard: state.clipboard };
  if (command.type === "typeDigit") return typeDigit(state, command.digit, command.time);
  // Alla andra kommandon bryter ett påbörjat tvåsiffrigt band
  const next = applyCommand(state, command);
  // Varje kommando som ändrar toner kan lämna en hammer-on, pull-off eller slide utan mål
  return record(state, { ...next, score: withValidConnections(next.score), pendingDigit: null });
}

/**
 * Lägger ett kommando i historiken som en ändring om det ändrade Partituret, och rensar då
 * det som gick att göra om. Kommandon som lämnar Partituret som det var lämnar historiken orörd.
 */
function record(before: EditorState, after: EditorState): EditorState {
  if (equal(after.score, before.score)) return { ...after, score: before.score };
  const change = { before: snapshot(before), after: snapshot(after) };
  return { ...after, selection: null, history: { undo: [...before.history.undo, change], redo: [] } };
}

function undo(state: EditorState): EditorState {
  const { undo, redo } = state.history;
  const change = undo.at(-1);
  if (!change) return { ...state, pendingDigit: null };
  return {
    ...state,
    ...change.before,
    selection: null,
    pendingDigit: null,
    history: { undo: undo.slice(0, -1), redo: [...redo, change] },
  };
}

function redo(state: EditorState): EditorState {
  const { undo, redo } = state.history;
  const change = redo.at(-1);
  if (!change) return { ...state, pendingDigit: null };
  return {
    ...state,
    ...change.after,
    selection: null,
    pendingDigit: null,
    history: { undo: [...undo, change], redo: redo.slice(0, -1) },
  };
}

/** Jämför två JSON-liknande värden, som Partitur, på innehåll. */
function equal(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  return (
    keysA.length === keysB.length &&
    keysA.every((key) => Object.hasOwn(b, key) && equal(a[key as keyof typeof a], b[key as keyof typeof b]))
  );
}

function snapshot({ score, cursor }: EditorState): Snapshot {
  return { score, cursor };
}

function applyCommand(
  state: EditorState,
  command: Exclude<Command, { type: "typeDigit" | "undo" | "redo" | "openScore" }>,
): EditorState {
  switch (command.type) {
    case "enterFret":
      return enterFret(state, command.fret);
    case "moveCursor":
      return moveCursor(state, command.direction);
    case "moveCursorTo":
      return moveCursorTo(state, command.position);
    case "extendSelection":
      return extendSelection(state, command.direction, command.unit);
    case "copy":
      return copy(state);
    case "paste":
      return paste(state);
    case "setDuration":
      return updateBeat(state, (beat) => {
        beat.duration = command.duration;
      });
    case "toggleDot":
      return updateBeat(state, (beat) => toggle(beat, "dotted"));
    case "toggleTriplet":
      return updateBeat(state, (beat) => toggle(beat, "triplet"));
    case "toggleHammerPull":
      return toggleConnection(state, "hammerPull");
    case "toggleSlide":
      return toggleConnection(state, "slide");
    case "cycleBend":
      return updateNote(state, (note) => {
        // Efter det största målet blir det ingen bend
        const next = note.bend === undefined ? BEND_TARGETS[0] : BEND_TARGETS[BEND_TARGETS.indexOf(note.bend) + 1];
        if (next) note.bend = next;
        else delete note.bend;
      });
    case "togglePalmMute":
      return updateNote(state, (note) => toggle(note, "palmMute"));
    case "insertRest":
      return advance(
        updateBeat(state, (beat) => {
          beat.notes = [];
        }),
        { force: true },
      );
    case "deleteNote":
      if (state.selection) return deleteSelection(state);
      return updateBeat(state, (beat) => {
        beat.notes = withoutNoteOn(beat, state.cursor.string);
      });
    case "deleteBeat":
      return state.selection ? deleteSelection(state) : deleteBeat(state);
    case "deleteSelection":
      return deleteSelection(state);
    case "insertBarBefore":
      return insertBar(state, state.cursor.bar);
    case "insertBarAfter":
      return insertBar(state, state.cursor.bar + 1);
    case "deleteBar":
      return deleteBar(state);
    case "setBeatText": {
      const text = command.text.trim();
      if (text.length > MAX_BEAT_TEXT_LENGTH[command.field]) return state;
      return updateBeat(state, (beat) => {
        if (text) beat[command.field] = text;
        else delete beat[command.field];
      });
    }
    case "setMetadata":
      return updateScore(state, (score) => {
        for (const [field, value] of Object.entries(command.metadata)) {
          score.metadata[field as keyof Metadata] = value.trim();
        }
      });
    case "setTuning":
      return updateTrack(state, (track) => {
        const valid =
          command.tuning.length === track.tuning.length &&
          command.tuning.every((pitch) => isInRange(pitch, MIN_PITCH, MAX_PITCH));
        if (valid) track.tuning = [...command.tuning];
      });
    case "setCapo":
      return updateTrack(state, (track) => {
        if (isInRange(command.capo, 0, MAX_FRET)) track.capo = command.capo;
      });
    case "setTempo":
      return updateScore(state, (score) => {
        if (isValidTempo(command.tempo)) score.tempo = command.tempo;
      });
    case "setTimeSignature":
      return updateScore(state, (score) => {
        if (isValidTimeSignature(command.timeSignature)) score.timeSignature = copyTimeSignature(command.timeSignature);
      });
    case "setBarTimeSignature":
      if (!isValidTimeSignature(command.timeSignature)) return state;
      return setBarChange(state, "timeSignature", copyTimeSignature(command.timeSignature), timeSignatureAt);
    case "clearBarTimeSignature":
      return updateBars(state, (bar) => delete bar.timeSignature);
    case "setBarTempo":
      if (!isValidTempo(command.tempo)) return state;
      return setBarChange(state, "tempo", command.tempo, tempoAt);
    case "clearBarTempo":
      return updateBars(state, (bar) => delete bar.tempo);
    case "toggleRepeatStart":
      return updateBars(state, (bar) => toggle(bar, "repeatStart"));
    case "toggleRepeatEnd":
      return updateBars(state, (bar) => {
        if (bar.repeatEnd) delete bar.repeatEnd;
        else bar.repeatEnd = MIN_REPEAT_COUNT;
      });
    case "setRepeatCount":
      if (!isInRange(command.count, MIN_REPEAT_COUNT, MAX_REPEAT_COUNT)) return state;
      return updateBars(state, (bar) => {
        if (bar.repeatEnd) bar.repeatEnd = command.count;
      });
    case "setViewMode":
      return updateScore(state, (score) => {
        if ((VIEW_MODES as readonly string[]).includes(command.viewMode)) score.viewMode = command.viewMode;
      });
  }
}

function barAt(score: Score, cursor: Cursor): Bar {
  return score.tracks[cursor.track].bars[cursor.bar];
}

/** Ändrar en kopia av Partituret. */
function updateScore(state: EditorState, change: (score: Score) => void): EditorState {
  const score = structuredClone(state.score);
  change(score);
  return { ...state, score };
}

/** Ändrar en kopia av markörens Spår. */
function updateTrack(state: EditorState, change: (track: Track) => void): EditorState {
  return updateScore(state, (score) => change(score.tracks[state.cursor.track]));
}

/** Ändrar en kopia av markörens Takt i alla Spår, eftersom byten och repriser gäller hela Partituret. */
function updateBars(state: EditorState, change: (bar: Bar) => void): EditorState {
  return updateScore(state, (score) => {
    for (const track of score.tracks) {
      const bar = track.bars[state.cursor.bar];
      if (bar) change(bar);
    }
  });
}

/**
 * Sätter ett taktarts- eller tempobyte på markörens Takt. På första Takten ändras starten i
 * stället, och ett byte till det som redan gäller före Takten blir inget byte.
 */
function setBarChange<F extends BarChange>(
  state: EditorState,
  field: F,
  value: Score[F],
  inEffect: (score: Score, track: number, bar: number) => Score[F],
): EditorState {
  const { cursor } = state;
  if (cursor.bar === 0) return updateScore(state, (score) => (score[field] = value));
  const unchanged = equal(inEffect(state.score, cursor.track, cursor.bar - 1), value);
  return updateBars(state, (bar) => {
    if (unchanged) delete bar[field];
    else bar[field] = value as Bar[F];
  });
}

function isValidTempo(tempo: number): boolean {
  return isInRange(tempo, MIN_TEMPO, MAX_TEMPO);
}

function isValidTimeSignature({ beats, beatValue }: TimeSignature): boolean {
  return isInRange(beats, MIN_TIME_SIGNATURE_BEATS, MAX_TIME_SIGNATURE_BEATS) && TIME_SIGNATURE_BEAT_VALUES.includes(beatValue);
}

/** En taktart utan andra fält än de som hör dit. */
function copyTimeSignature({ beats, beatValue }: TimeSignature): TimeSignature {
  return { beats, beatValue };
}

/** Om `value` är ett heltal från `min` till och med `max`. */
function isInRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

/** Ändrar en kopia av slaget under markören. */
function updateBeat(state: EditorState, change: (beat: Beat) => void): EditorState {
  const { cursor } = state;
  const score = structuredClone(state.score);
  change(barAt(score, cursor).beats[cursor.beat]);
  return { ...state, score };
}

/** Ändrar en kopia av tonen på markörens sträng. Saknas tonen händer ingenting. */
function updateNote(state: EditorState, change: (note: Note) => void): EditorState {
  const { cursor } = state;
  if (!noteOn(barAt(state.score, cursor).beats[cursor.beat], cursor.string)) return state;
  return updateBeat(state, (beat) => change(noteOn(beat, cursor.string)!));
}

function toggleConnection(state: EditorState, connection: Connection): EditorState {
  const { cursor } = state;
  const bars = state.score.tracks[cursor.track].bars;
  if (!connectionTarget(bars, cursor)) return state;
  return updateNote(state, (note) => {
    const on = !note[connection];
    // En ton har högst en förbindelse till nästa ton
    for (const c of CONNECTIONS) delete note[c];
    if (on) note[connection] = true;
  });
}

/** Slår på eller av en flagga, som utelämnas när den är av. */
function toggle<F extends string>(target: Partial<Record<F, boolean>>, flag: F) {
  if (target[flag]) delete target[flag];
  else target[flag] = true;
}

/**
 * Ett nytt tomt slag med samma Notvärde som `beat` om det ryms på `room` ticks, annars
 * med det längsta vanliga Notvärde som ryms. Ryms inget behålls Notvärdet.
 */
function beatThatFits(beat: Beat, room: number): Beat {
  const copy = emptyBeatLike(beat);
  if (beatTicks(copy) <= room) return copy;
  const duration = DURATIONS.find((d) => beatTicks({ duration: d }) <= room);
  return duration ? { duration, notes: [] } : copy;
}

/** Ett nytt tomt slag med samma Notvärde (inklusive punktering och triol) som `beat`. */
function emptyBeatLike(beat: Beat): Beat {
  return { ...beat, notes: [] };
}

/**
 * Skriver en siffra som band. Kommer den inom tidsfönstret efter en ensam siffra på samma
 * ställe, och bildar de tillsammans ett giltigt band, ersätts bandet med det tvåsiffriga.
 */
function typeDigit(state: EditorState, digit: number, time: number): EditorState {
  const pending = state.pendingDigit;
  if (pending && time - pending.time <= TWO_DIGIT_WINDOW_MS) {
    const combined = pending.digit * 10 + digit;
    if (combined <= MAX_FRET) {
      const next = { ...enterFret(state, combined), pendingDigit: null };
      // Den andra siffran hör till samma ändring som den första och ångras tillsammans med den
      return pending.recorded ? extendLastChange(next) : record(state, next);
    }
  }
  const next = record(state, { ...enterFret(state, digit), pendingDigit: null });
  return { ...next, pendingDigit: { digit, time, recorded: next.history !== state.history } };
}

/**
 * Låter den senaste ändringen i historiken sluta i `state` i stället. Leder den då tillbaka
 * till där den började tas den bort.
 */
function extendLastChange(state: EditorState): EditorState {
  const undo = state.history.undo.slice(0, -1);
  const { before } = state.history.undo[undo.length];
  if (equal(before.score, state.score)) return { ...state, history: { ...state.history, undo } };
  return { ...state, history: { ...state.history, undo: [...undo, { before, after: snapshot(state) }] } };
}

/** Slagets ton på `string`, om den finns. */
function noteOn(beat: Beat, string: number): Note | undefined {
  return beat.notes.find((n) => n.string === string);
}

/** Slagets toner utom den på `string`. */
function withoutNoteOn(beat: Beat, string: number): Note[] {
  return beat.notes.filter((n) => n.string !== string);
}

function enterFret(state: EditorState, fret: number): EditorState {
  const { cursor } = state;
  const score = structuredClone(state.score);
  const beat = barAt(score, cursor).beats[cursor.beat];
  // En ton som byter band behåller sina tekniker
  const note = { ...noteOn(beat, cursor.string), string: cursor.string, fret };
  // Toner på andra strängar ligger kvar, så att flera toner i samma slag bygger ett ackord
  beat.notes = [...withoutNoteOn(beat, cursor.string), note].sort((a, b) => a.string - b.string);
  // Det nya bandet kan göra en förbindelse till eller från tonen ogiltig
  return { ...state, score: withValidConnections(score) };
}

function deleteBeat(state: EditorState): EditorState {
  const { cursor } = state;
  const score = structuredClone(state.score);
  const beats = barAt(score, cursor).beats;
  if (beats.length === 1) {
    beats[0] = emptyBeatLike(beats[0]);
    return { ...state, score };
  }
  beats.splice(cursor.beat, 1);
  return { ...state, score, cursor: { ...cursor, beat: Math.min(cursor.beat, beats.length - 1) } };
}

function moveCursor(state: EditorState, direction: Direction): EditorState {
  const { cursor } = state;
  const stringCount = state.score.tracks[cursor.track].tuning.length;
  switch (direction) {
    case "up":
      return { ...state, cursor: { ...cursor, string: Math.max(1, cursor.string - 1) } };
    case "down":
      return { ...state, cursor: { ...cursor, string: Math.min(stringCount, cursor.string + 1) } };
    case "left":
      return { ...moveLeft(state), selection: null };
    case "right":
      return { ...advance(state, { force: false }), selection: null };
  }
}

function moveCursorTo(state: EditorState, cursor: Cursor): EditorState {
  const track = state.score.tracks[cursor.track];
  const beats = track?.bars[cursor.bar]?.beats;
  const exists = beats && isInRange(cursor.beat, 0, beats.length - 1) && isInRange(cursor.string, 1, track.tuning.length);
  if (!exists) return state;
  const { track: trackIndex, bar, beat, string } = cursor;
  return { ...state, cursor: { track: trackIndex, bar, beat, string }, selection: null };
}

function extendSelection(state: EditorState, direction: Side, unit: SelectionUnit): EditorState {
  const { cursor, selection } = state;
  const bars = state.score.tracks[cursor.track].bars;
  const at = { bar: cursor.bar, beat: cursor.beat };
  const { anchor, head } = selection ?? { anchor: at, head: at };
  const selected = unit === "beat" ? extendByBeat(bars, anchor, head, direction) : extendByBar(bars, selection, anchor, head, direction);
  return { ...state, selection: selected, cursor: { ...cursor, ...selected.head } };
}

function extendByBeat(bars: readonly Bar[], anchor: BeatPosition, head: BeatPosition, direction: Side): Selection {
  return { anchor, head: (direction === "left" ? previousBeat(bars, head) : nextBeat(bars, head)) ?? head };
}

/**
 * Utökar till hela Takter. En markering som redan omfattar hela Takter får en Takt till eller en
 * färre, annars blir den de Takter den redan berör, och markeringens början hamnar i den kant
 * av sin Takt som vetter bort från markören.
 */
function extendByBar(
  bars: readonly Bar[],
  selection: Selection | null,
  anchor: BeatPosition,
  head: BeatPosition,
  direction: Side,
): Selection {
  const step = direction === "right" ? 1 : -1;
  const headBar = selection && coversWholeBars(bars, selection) ? Math.min(Math.max(head.bar + step, 0), bars.length - 1) : head.bar;
  const forward = headBar === anchor.bar ? direction === "right" : headBar > anchor.bar;
  const lastBeat = (bar: number) => bars[bar].beats.length - 1;
  return forward
    ? { anchor: { bar: anchor.bar, beat: 0 }, head: { bar: headBar, beat: lastBeat(headBar) } }
    : { anchor: { bar: anchor.bar, beat: lastBeat(anchor.bar) }, head: { bar: headBar, beat: 0 } };
}

/** Om markeringen börjar och slutar vid taktstreck. */
function coversWholeBars(bars: readonly Bar[], selection: Selection): boolean {
  const { start, end } = selectionRange(selection);
  return start.beat === 0 && end.beat === bars[end.bar].beats.length - 1;
}

/**
 * Markören flyttad till slaget före eller efter, även i en annan Takt, eller `null` vid
 * Partiturets början eller slut. Till skillnad från `moveCursor` skapas inget nytt slag.
 */
export function neighbourBeat(state: EditorState, side: Side): Cursor | null {
  const { cursor } = state;
  const bars = state.score.tracks[cursor.track].bars;
  const position = side === "right" ? nextBeat(bars, cursor) : previousBeat(bars, cursor);
  return position && { ...cursor, ...position };
}

/** Slaget före `position`, även i föregående Takt, eller `null` vid Partiturets början. */
function previousBeat(bars: readonly Bar[], { bar, beat }: BeatPosition): BeatPosition | null {
  if (beat > 0) return { bar, beat: beat - 1 };
  if (bar === 0) return null;
  return { bar: bar - 1, beat: bars[bar - 1].beats.length - 1 };
}

/** Slaget efter `position`, även i nästa Takt, eller `null` vid Partiturets slut. */
function nextBeat(bars: readonly Bar[], { bar, beat }: BeatPosition): BeatPosition | null {
  if (beat < bars[bar].beats.length - 1) return { bar, beat: beat + 1 };
  if (bar === bars.length - 1) return null;
  return { bar: bar + 1, beat: 0 };
}

/** Negativt om `a` ligger före `b`, positivt om efter och 0 om det är samma slag. */
function comparePositions(a: BeatPosition, b: BeatPosition): number {
  return a.bar - b.bar || a.beat - b.beat;
}

/** Markeringens första och sista slag. */
export function selectionRange({ anchor, head }: Selection): { start: BeatPosition; end: BeatPosition } {
  return comparePositions(anchor, head) <= 0 ? { start: anchor, end: head } : { start: head, end: anchor };
}

/** Går till föregående slag, vid behov sista slaget i föregående Takt. */
function moveLeft(state: EditorState): EditorState {
  const { cursor } = state;
  if (cursor.beat > 0) return { ...state, cursor: { ...cursor, beat: cursor.beat - 1 } };
  if (cursor.bar === 0) return state;
  const previous = state.score.tracks[cursor.track].bars[cursor.bar - 1];
  return { ...state, cursor: { ...cursor, bar: cursor.bar - 1, beat: previous.beats.length - 1 } };
}

/**
 * Går till nästa slag. Från sista slaget i en Takt fylls Takten på med ett nytt slag
 * så länge det får plats, och därefter går markören till nästa Takt, som skapas om den saknas.
 * Från ett tomt sista slag skapas inget nytt, så att man inte råkar fylla Partituret
 * med pauser, utom när `force` är satt (som när man uttryckligen lägger in en paus).
 */
function advance(state: EditorState, { force }: { force: boolean }): EditorState {
  const { cursor, score } = state;
  const bars = score.tracks[cursor.track].bars;
  const bar = bars[cursor.bar];
  if (cursor.beat < bar.beats.length - 1) {
    return { ...state, cursor: { ...cursor, beat: cursor.beat + 1 } };
  }

  const current = bar.beats[cursor.beat];
  const canExtend = force || current.notes.length > 0;
  const room = barCapacity(timeSignatureAt(score, cursor.track, cursor.bar)) - barTicks(bar);
  const hasNextBar = cursor.bar < bars.length - 1;

  if (room > 0 && canExtend) {
    const next = structuredClone(score);
    barAt(next, cursor).beats.push(beatThatFits(current, room));
    return { ...state, score: next, cursor: { ...cursor, beat: cursor.beat + 1 } };
  }
  if (hasNextBar) {
    return { ...state, cursor: { ...cursor, bar: cursor.bar + 1, beat: 0 } };
  }
  if (canExtend) {
    const next = structuredClone(score);
    next.tracks[cursor.track].bars.push({ beats: [emptyBeatLike(current)] });
    return { ...state, score: next, cursor: { ...cursor, bar: cursor.bar + 1, beat: 0 } };
  }
  return state;
}

function copy(state: EditorState): EditorState {
  if (!state.selection) return state;
  const { start, end } = selectionRange(state.selection);
  const bars = state.score.tracks[state.cursor.track].bars;
  const beats: Beat[] = [];
  for (let position: BeatPosition | null = start; position; position = nextBeat(bars, position)) {
    beats.push(structuredClone(bars[position.bar].beats[position.beat]));
    if (comparePositions(position, end) === 0) break;
  }
  return { ...state, clipboard: beats };
}

function paste(state: EditorState): EditorState {
  const { clipboard, cursor, selection } = state;
  if (!clipboard?.length) return state;
  const score = structuredClone(state.score);
  const bars = score.tracks[cursor.track].bars;
  let position: BeatPosition = selection ? selectionRange(selection).start : { bar: cursor.bar, beat: cursor.beat };
  clipboard.forEach((beat, i) => {
    if (i > 0) position = nextBeat(bars, position) ?? appendBeat(score, cursor.track, beat);
    bars[position.bar].beats[position.beat] = structuredClone(beat);
  });
  return { ...state, score, cursor: { ...cursor, ...position } };
}

/**
 * Gör plats för `beat` efter Spårets sista slag: i den sista Takten om det ryms i taktarten,
 * annars i en ny Takt. Ger platsen, där ett tomt slag med samma Notvärde nu står.
 */
function appendBeat(score: Score, track: number, beat: Beat): BeatPosition {
  const bars = score.tracks[track].bars;
  const last = bars.length - 1;
  const room = barCapacity(timeSignatureAt(score, track, last)) - barTicks(bars[last]);
  if (beatTicks(beat) <= room) {
    bars[last].beats.push(emptyBeatLike(beat));
    return { bar: last, beat: bars[last].beats.length - 1 };
  }
  bars.push({ beats: [emptyBeatLike(beat)] });
  return { bar: last + 1, beat: 0 };
}

function deleteSelection(state: EditorState): EditorState {
  if (!state.selection) return state;
  const { start, end } = selectionRange(state.selection);
  const { cursor } = state;
  const score = structuredClone(state.score);
  const bars = score.tracks[cursor.track].bars;
  const wholeBars = new Set<number>();
  // Bakifrån, så att de tidigare Takternas index står kvar
  for (let b = end.bar; b >= start.bar; b--) {
    const from = b === start.bar ? start.beat : 0;
    const to = b === end.bar ? end.beat : bars[b].beats.length - 1;
    if (from === 0 && to === bars[b].beats.length - 1) wholeBars.add(b);
    else bars[b].beats.splice(from, to - from + 1);
  }
  const result = removeBars(score, wholeBars);
  const remaining = result.tracks[cursor.track].bars;
  const bar = Math.min(start.bar, remaining.length - 1);
  const beat = wholeBars.has(start.bar) ? 0 : Math.min(start.beat, remaining[bar].beats.length - 1);
  return { ...state, score: result, cursor: { ...cursor, bar, beat } };
}

/**
 * Partituret utan Takterna `removed` i alla Spår. Takterna som blir kvar behåller den taktart och
 * det tempo som gällde i dem: ett Byte i en borttagen Takt flyttas till nästa Takt, och tas den
 * första Takten bort blir det som gällde i den nya första Takten Partiturets start. Tas alla bort
 * blir det en Takt med en paus.
 */
function removeBars(score: Score, removed: ReadonlySet<number>): Score {
  if (removed.size === 0) return score;
  const result = structuredClone(score);
  const kept = score.tracks[0].bars.map((_, i) => i).filter((i) => !removed.has(i));
  for (const [t, track] of result.tracks.entries()) {
    track.bars = kept.length ? track.bars.filter((_, i) => !removed.has(i)) : [{ beats: [emptyBeatLike(score.tracks[t].bars[0].beats[0])] }];
  }
  if (kept.length === 0) return result;
  keepInEffect(score, result, kept, "timeSignature", timeSignatureAt);
  keepInEffect(score, result, kept, "tempo", tempoAt);
  return result;
}

/** Sätter Byten i `result` så att varje kvarvarande Takt får det som gällde i den i `original`. */
function keepInEffect<F extends BarChange>(
  original: Score,
  result: Score,
  kept: readonly number[],
  field: F,
  inEffect: (score: Score, track: number, bar: number) => Score[F],
) {
  result[field] = inEffect(original, 0, kept[0]);
  for (const [t, track] of result.tracks.entries()) {
    delete track.bars[0][field];
    for (let i = 1; i < track.bars.length; i++) {
      const wanted = inEffect(original, 0, kept[i]);
      if (!equal(inEffect(result, t, i), wanted)) track.bars[i][field] = wanted as Bar[F];
    }
  }
}

/** Infogar en Takt med pauser i alla Spår så att den får index `index`. */
function insertBar(state: EditorState, index: number): EditorState {
  const { cursor } = state;
  // Taktarten före en eventuell Byte i Takten som nu ligger på `index`
  const { beats, beatValue } = index === 0 ? state.score.timeSignature : timeSignatureAt(state.score, cursor.track, index - 1);
  const score = structuredClone(state.score);
  for (const track of score.tracks) {
    track.bars.splice(index, 0, { beats: Array.from({ length: beats }, () => ({ duration: beatValue, notes: [] })) });
  }
  return { ...state, score, cursor: { ...cursor, bar: index, beat: 0 } };
}

function deleteBar(state: EditorState): EditorState {
  const { cursor } = state;
  const score = removeBars(state.score, new Set([cursor.bar]));
  const bar = Math.min(cursor.bar, score.tracks[cursor.track].bars.length - 1);
  return { ...state, score, cursor: { ...cursor, bar, beat: 0 } };
}
