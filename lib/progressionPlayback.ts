/**
 * Uppspelningsplanen: Ackordföljden som händelser per Instrument, i tid räknat i Taktslag från
 * loopens början. Ren modul utan Tone.js; ljudlagret spelar bara upp planen.
 */

import {
  type ChordType,
  type Position,
  type Progression,
  type ProgressionChord,
  pulsesPerBar,
  pulsesPerBeat,
  type TimeSignature,
} from "./progression";

export const INSTRUMENTS = ["drums", "bass", "piano", "pad"] as const;
export type Instrument = (typeof INSTRUMENTS)[number];

/** Ett Ackord som klingar från `start` till `end`, med platsen där det står i sin Del. */
export interface PlannedChord {
  start: number;
  end: number;
  chord: ProgressionChord;
  position: Position;
}

export type Drum = "kick" | "snare" | "hihat";

export interface DrumHit {
  time: number;
  drum: Drum;
  /** 0–1. */
  velocity: number;
}

/** Toner (MIDI-nummer) som anslås samtidigt och klingar i `duration` Taktslag. */
export interface NoteEvent {
  time: number;
  duration: number;
  notes: number[];
}

export interface PlaybackPlan {
  /** Loopens längd i Taktslag. */
  length: number;
  chords: PlannedChord[];
  drums: DrumHit[];
  bass: NoteEvent[];
  piano: NoteEvent[];
  pad: NoteEvent[];
}

interface Pattern {
  drums: readonly DrumHit[];
  /** Taktslagen i Takten där basen och elpianot slår an, utöver där ett Ackord börjar. */
  bass: readonly number[];
  piano: readonly number[];
}

const hihats = (pulses: number, step: number): DrumHit[] =>
  Array.from({ length: Math.round(pulses / step) }, (_, i) => ({ time: i * step, drum: "hihat", velocity: i % 2 === 0 ? 0.6 : 0.4 }));

const hits = (drum: Drum, times: readonly number[], velocity: number): DrumHit[] => times.map((time) => ({ time, drum, velocity }));

/** De fasta mönstren per taktart, i Taktslag från Taktens början. */
const PATTERNS: Record<TimeSignature, Pattern> = {
  "4/4": {
    drums: [...hits("kick", [0, 2, 2.5], 0.9), ...hits("snare", [1, 3], 0.8), ...hihats(4, 0.5)],
    bass: [0, 2],
    piano: [0, 1.5, 2, 3.5],
  },
  "3/4": {
    drums: [...hits("kick", [0], 0.9), ...hits("snare", [1, 2], 0.7), ...hihats(3, 0.5)],
    bass: [0],
    piano: [1, 2],
  },
  "2/4": {
    drums: [...hits("kick", [0], 0.9), ...hits("snare", [1], 0.8), ...hihats(2, 0.5)],
    bass: [0, 1],
    piano: [0, 1.5],
  },
  "6/8": {
    drums: [...hits("kick", [0], 0.9), ...hits("snare", [3], 0.8), ...hihats(6, 1)],
    bass: [0, 3],
    piano: [0, 2, 3, 5],
  },
  "12/8": {
    drums: [...hits("kick", [0, 6], 0.9), ...hits("snare", [3, 9], 0.8), ...hihats(12, 1)],
    bass: [0, 6, 9],
    piano: [0, 3, 6, 9],
  },
};

/** Anslagen inom `[start, end)`: där Ackordet börjar och på mönstrets Taktslag i varje Takt. */
function onsets(start: number, end: number, pulses: number, pattern: readonly number[]): number[] {
  const times = new Set([start]);
  for (let bar = Math.floor(start / pulses) * pulses; bar < end; bar += pulses) {
    for (const t of pattern) if (bar + t > start && bar + t < end) times.add(bar + t);
  }
  return [...times].sort((a, b) => a - b);
}

/** Varje anslag klingar till nästa, och det sista till Ackordets slut. */
function noteEvents(times: number[], end: number, pitches: number[]): NoteEvent[] {
  return times.map((time, i) => ({ time, duration: (times[i + 1] ?? end) - time, notes: pitches }));
}

const TRIADS: Record<ChordType, readonly number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
};

/** Basen ligger mellan E1 (28) och D♯2 (39). */
const bassNote = (pitch: number) => 28 + ((pitch - 4 + 12) % 12);

/** Elpianot och padden håller sig mellan E3 (52) och G5 (79). */
const LOWEST = 52;
const HIGHEST = 79;
/** Det första ackordet läggs så nära C-durackordet i grundläge kring mittenC som möjligt. */
const START: readonly number[] = [60, 64, 67];

/** Alla lägen av ackordets tonklasser i tät stämföring inom registret. */
function voicings(pitchClasses: readonly number[]): number[][] {
  const result: number[][] = [];
  for (let rotation = 0; rotation < pitchClasses.length; rotation++) {
    const order = [...pitchClasses.slice(rotation), ...pitchClasses.slice(0, rotation)];
    for (let bottom = LOWEST; bottom < LOWEST + 12; bottom++) {
      if ((bottom - order[0]) % 12 !== 0) continue;
      for (let octave = 0; ; octave += 12) {
        const notes: number[] = [];
        for (const pc of order) {
          let note = notes.length === 0 ? bottom + octave : notes[notes.length - 1] + 1;
          while ((note - pc) % 12 !== 0) note++;
          notes.push(note);
        }
        if (notes[notes.length - 1] > HIGHEST) break;
        result.push(notes);
      }
    }
  }
  return result;
}

/** Hur långt tonerna rör sig: summan av varje tons avstånd till den närmaste i det förra läget. */
function distance(from: readonly number[], to: readonly number[]): number {
  return to.reduce((sum, note) => sum + Math.min(...from.map((previous) => Math.abs(previous - note))), 0);
}

/** Det läge av ackordet som ligger närmast det förra. */
function voiceLeading(chord: ProgressionChord, previous: readonly number[]): number[] {
  const pitchClasses = TRIADS[chord.type].map((interval) => (chord.root + interval) % 12);
  let best: number[] = [];
  let bestDistance = Infinity;
  for (const candidate of voicings(pitchClasses)) {
    const d = distance(previous, candidate) + distance(candidate, previous);
    if (d < bestDistance) [best, bestDistance] = [candidate, d];
  }
  return best;
}

/**
 * Hur länge ett Taktslag varar i sekunder. Tempot räknas i fjärdedelar, men i 6/8 och 12/8 i
 * punkterade fjärdedelar, alltså tre Taktslag.
 */
export function pulseSeconds({ tempo, timeSignature }: Pick<Progression, "tempo" | "timeSignature">): number {
  return 60 / tempo / pulsesPerBeat(timeSignature);
}

/** En Takts inräkning före loopen: hi-hat-anslagen och längden i Taktslag. */
export interface CountIn {
  hits: DrumHit[];
  length: number;
}

/**
 * Inräkningen: en Takt med hi-hat på varje fjärdedel, i 6/8 och 12/8 på varje punkterad
 * fjärdedel. Det första anslaget är starkast.
 */
export function countIn(timeSignature: TimeSignature): CountIn {
  const step = pulsesPerBeat(timeSignature);
  const length = pulsesPerBar(timeSignature);
  const hits: DrumHit[] = Array.from({ length: length / step }, (_, i) => ({
    time: i * step,
    drum: "hihat",
    velocity: i === 0 ? 1 : 0.7,
  }));
  return { hits, length };
}

export interface PlanOptions {
  /** Delen som loopas ensam. Utan den, eller om Delen inte finns, spelas Formen. */
  loop?: string | null;
}

/** Delarna i den ordning de spelas: Formen utrullad, eller bara Delen som loopas. */
function playedSections(progression: Progression, loop: string | null | undefined): readonly string[] {
  return loop && progression.sections.some((s) => s.id === loop) ? [loop] : progression.form;
}

export function playbackPlan(progression: Progression, { loop }: PlanOptions = {}): PlaybackPlan {
  const pulses = pulsesPerBar(progression.timeSignature);
  const pattern = PATTERNS[progression.timeSignature];
  const placed: Omit<PlannedChord, "end">[] = [];
  let length = 0;
  for (const id of playedSections(progression, loop)) {
    const section = progression.sections.find((s) => s.id === id);
    if (!section) continue;
    for (const { bar, pulse, chord } of section.chords) {
      placed.push({ start: length + bar * pulses + pulse, chord, position: { section: id, bar, pulse } });
    }
    length += section.bars * pulses;
  }
  const chords = placed.map((c, i) => ({ ...c, end: placed[i + 1]?.start ?? length }));

  const drums: DrumHit[] = [];
  for (let bar = 0; bar < length; bar += pulses) drums.push(...pattern.drums.map((hit) => ({ ...hit, time: bar + hit.time })));

  const plan: PlaybackPlan = { length, chords, drums, bass: [], piano: [], pad: [] };
  let previous = START;
  for (const { start, end, chord } of chords) {
    const voiced = voiceLeading(chord, previous);
    previous = voiced;
    plan.bass.push(...noteEvents(onsets(start, end, pulses, pattern.bass), end, [bassNote(chord.bass)]));
    plan.piano.push(...noteEvents(onsets(start, end, pulses, pattern.piano), end, voiced));
    plan.pad.push({ time: start, duration: end - start, notes: voiced });
  }
  return plan;
}
