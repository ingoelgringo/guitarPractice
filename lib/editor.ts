import { STANDARD_TUNING, type Bar, type Score } from "./score";

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
}

export type Direction = "up" | "down" | "left" | "right";

export type Command =
  | { type: "enterFret"; fret: number }
  | { type: "moveCursor"; direction: Direction };

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
  };
}

export function apply(state: EditorState, command: Command): EditorState {
  switch (command.type) {
    case "enterFret":
      return enterFret(state, command.fret);
    case "moveCursor":
      return moveCursor(state, command.direction);
  }
}

function barAt(score: Score, cursor: Cursor): Bar {
  return score.tracks[cursor.track].bars[cursor.bar];
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
      return { ...state, cursor: { ...cursor, beat: Math.max(0, cursor.beat - 1) } };
    case "right":
      return moveRight(state);
  }
}

/**
 * Går till nästa slag. Från ett sista slag med toner skapas ett nytt tomt slag,
 * så att man kan skriva vidare. (Att fylla Takter och skapa nya kommer i ticket 03.)
 */
function moveRight(state: EditorState): EditorState {
  const { cursor } = state;
  const beats = barAt(state.score, cursor).beats;
  if (cursor.beat < beats.length - 1) {
    return { ...state, cursor: { ...cursor, beat: cursor.beat + 1 } };
  }
  const current = beats[cursor.beat];
  if (current.notes.length === 0) return state;

  const score = structuredClone(state.score);
  barAt(score, cursor).beats.push({ duration: current.duration, notes: [] });
  return { score, cursor: { ...cursor, beat: cursor.beat + 1 } };
}
