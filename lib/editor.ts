import { barCapacity, barTicks, beatTicks, STANDARD_TUNING, type Bar, type Beat, type Duration, type Score } from "./score";

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
  /** Den senast skrivna siffran, som nästa siffra kan bilda ett tvåsiffrigt band med. */
  pendingDigit: { digit: number; time: number } | null;
}

/** Hur länge (ms) efter en siffra som nästa siffra slås ihop med den till ett tvåsiffrigt band. */
export const TWO_DIGIT_WINDOW_MS = 1000;

/** Det högsta band som två siffror kan bilda. */
const MAX_FRET = 24;

/** Notvärdena från längst till kortast. */
const DURATIONS: readonly Duration[] = [1, 2, 4, 8, 16, 32];

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
  | { type: "insertRest" };

export function createEditor(): EditorState {
  return {
    score: {
      timeSignature: { beats: 4, beatValue: 4 },
      tracks: [
        {
          tuning: [...STANDARD_TUNING],
          bars: [{ beats: [{ duration: 4, notes: [] }] }],
        },
      ],
    },
    cursor: { track: 0, bar: 0, beat: 0, string: 1 },
    pendingDigit: null,
  };
}

export function apply(state: EditorState, command: Command): EditorState {
  if (command.type === "typeDigit") return typeDigit(state, command.digit, command.time);
  // Alla andra kommandon bryter ett påbörjat tvåsiffrigt band
  return { ...applyCommand(state, command), pendingDigit: null };
}

function applyCommand(state: EditorState, command: Exclude<Command, { type: "typeDigit" }>): EditorState {
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
    case "insertRest":
      return advance(
        updateBeat(state, (beat) => {
          beat.notes = [];
        }),
        { force: true },
      );
  }
}

function barAt(score: Score, cursor: Cursor): Bar {
  return score.tracks[cursor.track].bars[cursor.bar];
}

/** Ändrar en kopia av slaget under markören. */
function updateBeat(state: EditorState, change: (beat: Beat) => void): EditorState {
  const { cursor } = state;
  const score = structuredClone(state.score);
  change(barAt(score, cursor).beats[cursor.beat]);
  return { ...state, score };
}

function toggle(beat: Beat, flag: "dotted" | "triplet") {
  if (beat[flag]) delete beat[flag];
  else beat[flag] = true;
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
    if (combined <= MAX_FRET) return { ...enterFret(state, combined), pendingDigit: null };
  }
  return { ...enterFret(state, digit), pendingDigit: { digit, time } };
}

function enterFret(state: EditorState, fret: number): EditorState {
  const { cursor } = state;
  const score = structuredClone(state.score);
  barAt(score, cursor).beats[cursor.beat].notes = [{ string: cursor.string, fret }];
  return { ...state, score };
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
  const room = barCapacity(score.timeSignature) - barTicks(bar);
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
