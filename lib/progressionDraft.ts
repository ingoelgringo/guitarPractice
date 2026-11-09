/**
 * Ackordföljdens format (versionerad JSON) och Utkastet i webbläsaren. Ackordföljden är ingen
 * Partiturfil och omfattas inte av ADR 0002.
 */

import type { DraftStorage } from "./draft";
import {
  CHORD_TYPES,
  EXTENSIONS,
  inExtensionOrder,
  MAX_TEMPO,
  MIN_TEMPO,
  type PlacedChord,
  type Progression,
  type ProgressionChord,
  pulsesPerBar,
  type Section,
  TIME_SIGNATURES,
  type TimeSignature,
} from "./progression";
import { isRecord } from "./scoreFile";

export const PROGRESSION_SCHEMA_VERSION = 1;

export const PROGRESSION_DRAFT_KEY = "guitarPractice.chordProgressions.draft";

export function serializeProgression(progression: Progression): string {
  return JSON.stringify({ schemaVersion: PROGRESSION_SCHEMA_VERSION, ...progression });
}

const isPitch = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0 && (value as number) < 12;
const isCount = (value: unknown, below: number): value is number =>
  Number.isInteger(value) && (value as number) >= 0 && (value as number) < below;

function readChord(value: unknown): ProgressionChord | null {
  if (!isRecord(value) || !isPitch(value.root) || !isPitch(value.bass)) return null;
  if (!CHORD_TYPES.includes(value.type as never)) return null;
  const extensions = value.extensions;
  if (!Array.isArray(extensions) || !extensions.every((e) => EXTENSIONS.includes(e))) return null;
  return {
    root: value.root,
    type: value.type as ProgressionChord["type"],
    extensions: inExtensionOrder(extensions),
    bass: value.bass,
  };
}

function readSection(value: unknown, pulses: number): Section | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") return null;
  if (!Number.isInteger(value.bars) || (value.bars as number) < 1 || !Array.isArray(value.chords)) return null;
  const bars = value.bars as number;
  const chords: PlacedChord[] = [];
  for (const placed of value.chords) {
    if (!isRecord(placed) || !isCount(placed.bar, bars) || !isCount(placed.pulse, pulses)) return null;
    const chord = readChord(placed.chord);
    if (!chord) return null;
    chords.push({ bar: placed.bar, pulse: placed.pulse, chord });
  }
  return { id: value.id, name: value.name, bars, chords };
}

/** Läser en Ackordföljd, eller `null` när texten inte är en giltig Ackordföljd. */
export function parseProgression(text: string): Progression | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(data) || data.schemaVersion !== PROGRESSION_SCHEMA_VERSION) return null;
  const { key, tempo, timeSignature, sections, form } = data;
  if (!isRecord(key) || !isPitch(key.tonic) || (key.mode !== "major" && key.mode !== "minor")) return null;
  if (!Number.isInteger(tempo) || (tempo as number) < MIN_TEMPO || (tempo as number) > MAX_TEMPO) return null;
  if (!TIME_SIGNATURES.includes(timeSignature as never) || !Array.isArray(sections) || !Array.isArray(form)) return null;
  const pulses = pulsesPerBar(timeSignature as TimeSignature);
  const read = sections.map((s) => readSection(s, pulses));
  if (read.some((s) => s === null)) return null;
  const valid = read as Section[];
  const ids = new Set(valid.map((s) => s.id));
  if (ids.size !== valid.length || !form.every((id) => typeof id === "string" && ids.has(id))) return null;
  return {
    key: { tonic: key.tonic, mode: key.mode },
    tempo: tempo as number,
    timeSignature: timeSignature as TimeSignature,
    sections: valid,
    form: form as string[],
  };
}

/** Sparar Utkastet. Utan fungerande lagring sparas inget, och editorn fungerar ändå. */
export function saveProgressionDraft(storage: DraftStorage | null, progression: Progression): void {
  try {
    storage?.setItem(PROGRESSION_DRAFT_KEY, serializeProgression(progression));
  } catch {
    // Utkastet är ingen säker lagring.
  }
}

/** Utkastet som finns sparat, eller `null` när det inte finns något som går att återställa. */
export function loadProgressionDraft(storage: DraftStorage | null): Progression | null {
  try {
    const text = storage?.getItem(PROGRESSION_DRAFT_KEY) ?? null;
    return text === null ? null : parseProgression(text);
  } catch {
    return null;
  }
}
