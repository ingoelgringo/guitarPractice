import { noteNameOf } from "./chordProgressions";
import type { NoteNameMode } from "./noteNameMode";
import { coursePitches, type StringInstrument } from "./tuning";

/** Tonnamn med oktav, t.ex. "E2" eller "F♯2", med sajtens stavning och i svenskt Notnamnsläge H och B. */
export function tunerNoteName(midi: number, mode: NoteNameMode): string {
  return `${noteNameOf(midi % 12, mode)}${Math.floor(midi / 12) - 1}`;
}

/** En sträng som Stämmaren stämmer mot. Ett Strängpar med oktavsträng ger två. */
export interface TunerString {
  /** Numret som `tunerStep` använder, från 1. */
  number: number;
  /** Strängen eller Strängparet (från 1, närmast golvet) som den sitter i. */
  course: number;
  pitch: number;
}

/** Strängarna att stämma, sträng 1 först och den grövsta först inom ett Strängpar. */
export function tunerStrings(instrument: StringInstrument, tuning: readonly number[]): TunerString[] {
  const pitches = instrument.courses.flatMap((kind, i) => coursePitches(kind, tuning[i]).map((pitch) => ({ course: i + 1, pitch })));
  return pitches.map((s, i) => ({ number: i + 1, ...s }));
}

export interface TunerConfig {
  /** Målton (MIDI) för varje sträng som stäms, sträng 1 först. */
  strings: readonly number[];
  /** Referenstonen A4 i Hz. */
  a4: number;
  /** Den låsta strängens nummer (från 1), eller `null` när Stämmaren väljer närmaste sträng. */
  lockedString: number | null;
}

export interface TunerInput {
  /** Frekvensen från tonhöjdsdetekteringen, eller `null` när ingen ton hörs. */
  frequency: number | null;
  timeMs: number;
}

/** Det Stämmaren visar: en sträng och avvikelsen mot den, eller den närmaste tonen när alla strängar är långt bort. */
export type TunerTarget =
  | { kind: "string"; string: number; cents: number }
  | { kind: "chromatic"; midi: number; cents: number };

export interface TunerState {
  /** Det som visas. Det står kvar när tonen tystnar. */
  target: TunerTarget | null;
  /** Strängarna (från 1) som har fått en bock, i nummerordning. Nytt tillstånd när man byter Stämning. */
  tuned: readonly number[];
  /** När den visade strängen senast kom inom toleransen, eller `null`. */
  inToleranceSince: number | null;
}

/** Inom så här många cent räknas en sträng som stämd. */
const TUNED_TOLERANCE = 3;
/** Så länge måste strängen ligga inom toleransen för att få en bock (ms). */
const TUNED_HOLD_MS = 500;

export function initialTunerState(): TunerState {
  return { target: null, tuned: [], inToleranceSince: null };
}

export function tunerStep(state: TunerState, input: TunerInput, config: TunerConfig): TunerState {
  if (input.frequency === null) return { ...state, inToleranceSince: null };
  const target = nextTarget(state.target, input.frequency, config);

  if (target.kind !== "string" || Math.abs(target.cents) > TUNED_TOLERANCE) {
    return { target, tuned: state.tuned, inToleranceSince: null };
  }
  const sameString = state.target?.kind === "string" && state.target.string === target.string;
  const since = sameString && state.inToleranceSince !== null ? state.inToleranceSince : input.timeMs;
  const tuned =
    input.timeMs - since >= TUNED_HOLD_MS && !state.tuned.includes(target.string)
      ? [...state.tuned, target.string].sort((a, b) => a - b)
      : state.tuned;
  return { target, tuned, inToleranceSince: since };
}

function nextTarget(previous: TunerTarget | null, frequency: number, config: TunerConfig): TunerTarget {
  const exact = 69 + 12 * Math.log2(frequency / config.a4);
  const centsTo = (string: number) => (exact - config.strings[string - 1]) * 100;

  if (config.lockedString !== null) {
    return { kind: "string", string: config.lockedString, cents: centsTo(config.lockedString) };
  }
  const string = automaticString(previous, centsTo, config.strings.length);
  if (string === null) {
    const note = frequencyToNote(frequency, config.a4);
    return { kind: "chromatic", midi: note.midi, cents: note.cents };
  }
  return { kind: "string", string, cents: centsTo(string) };
}

/** Längre bort än så här från alla strängar visar Stämmaren den kromatiska tonen (cent). */
const CHROMATIC_LIMIT = 100;
/** En sträng som redan visas behålls ända till så här långt bort (cent). */
const CHROMATIC_RELEASE = 120;
/** En annan sträng måste ligga så här mycket närmare för att Stämmaren ska byta (cent). */
const SWITCH_MARGIN = 20;

/** Den närmaste strängen, med företräde för den som redan visas, eller `null` när alla är för långt bort. */
function automaticString(
  previous: TunerTarget | null,
  centsTo: (string: number) => number,
  stringCount: number,
): number | null {
  let nearest = 1;
  for (let string = 2; string <= stringCount; string++) {
    if (Math.abs(centsTo(string)) < Math.abs(centsTo(nearest))) nearest = string;
  }

  if (previous?.kind === "string" && previous.string <= stringCount) {
    const current = Math.abs(centsTo(previous.string));
    const keep = current <= CHROMATIC_RELEASE && Math.abs(centsTo(nearest)) > current - SWITCH_MARGIN;
    if (keep) return previous.string;
  }
  return Math.abs(centsTo(nearest)) <= CHROMATIC_LIMIT ? nearest : null;
}

/** Närmaste ton (MIDI) och hur många cent frekvensen ligger från den, givet referenstonen A4 i Hz. */
export function frequencyToNote(frequency: number, a4: number): { midi: number; cents: number } {
  const exact = 69 + 12 * Math.log2(frequency / a4);
  const midi = Math.round(exact);
  return { midi, cents: (exact - midi) * 100 };
}

/** Frekvensen i Hz för tonen `midi`, givet referenstonen A4 i Hz. Den som Stämmaren visar som rätt. */
export function referenceFrequency(midi: number, a4: number): number {
  return a4 * 2 ** ((midi - 69) / 12);
}

/**
 * Strängen vars ton referenstonen spelar: den låsta strängen, annars den som visas, eller `null`
 * när ingen sträng är låst eller visas.
 */
export function referenceString(
  strings: readonly TunerString[],
  lockedString: number | null,
  target: TunerTarget | null,
): TunerString | null {
  const number = lockedString ?? (target?.kind === "string" ? target.string : null);
  return strings.find((s) => s.number === number) ?? null;
}
