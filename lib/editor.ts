import {
  barCapacity,
  barTicks,
  beatTicks,
  BEND_TARGETS,
  CONNECTIONS,
  connectionTarget,
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
  STANDARD_TUNING,
  tempoAt,
  TIME_SIGNATURE_BEAT_VALUES,
  timeSignatureAt, type Bar, type BarChange, type Beat, type Connection, type Duration, type Metadata, type Note, type Score, type TimeSignature, type Track, VIEW_MODES, type ViewMode, withValidConnections } from "./score";

export interface Cursor {
  track: number;
  bar: number;
  beat: number;
  /** Sträng 1 är den ljusaste. */
  string: number;
}

export interface EditorState {
  score: Score;
  cursor: Cursor;
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

export type Command =
  | { type: "enterFret"; fret: number }
  /** En siffra från tangentbordet; `time` (ms) avgör om den bildar ett tvåsiffrigt band med den förra. */
  | { type: "typeDigit"; digit: number; time: number }
  | { type: "moveCursor"; direction: Direction }
  | { type: "setDuration"; duration: Duration }
  | { type: "toggleDot" }
  | { type: "toggleTriplet" }
  /** Gör slaget under markören till en paus och går vidare till nästa slag. */
  | { type: "insertRest" }
  /** Tar bort tonen på markörens sträng i slaget under markören. */
  | { type: "deleteNote" }
  /** Tar bort slaget under markören. En Takt behåller alltid minst ett slag. */
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
    pendingDigit: null,
    history: { undo: [], redo: [] },
  };
}

export function apply(state: EditorState, command: Command): EditorState {
  if (command.type === "undo") return undo(state);
  if (command.type === "redo") return redo(state);
  if (command.type === "openScore") return editorFor(command.score);
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
  return { ...after, history: { undo: [...before.history.undo, change], redo: [] } };
}

function undo(state: EditorState): EditorState {
  const { undo, redo } = state.history;
  const change = undo.at(-1);
  if (!change) return { ...state, pendingDigit: null };
  return {
    ...change.before,
    pendingDigit: null,
    history: { undo: undo.slice(0, -1), redo: [...redo, change] },
  };
}

function redo(state: EditorState): EditorState {
  const { undo, redo } = state.history;
  const change = redo.at(-1);
  if (!change) return { ...state, pendingDigit: null };
  return {
    ...change.after,
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
      return updateBeat(state, (beat) => {
        beat.notes = withoutNoteOn(beat, state.cursor.string);
      });
    case "deleteBeat":
      return deleteBeat(state);
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
      return moveLeft(state);
    case "right":
      return advance(state, { force: false });
  }
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
