/**
 * Egna stämningar i Stämmaren. De hör till ett Stränginstrument, sparas i webbläsaren och syns
 * bara i Stämmaren. Namnet skiljer dem åt: inom ett Stränginstrument har ingen egen stämning samma
 * namn som en annan eller som en färdig, oavsett stora och små bokstäver.
 */

import { MIN_FREQUENCY } from "./pitch";
import { STRING_INSTRUMENTS, stringInstrument, type StringInstrument, type StringInstrumentId } from "./tuning";

export const CUSTOM_TUNINGS_KEY = "guitarPractice.tuner.customTunings";
const SCHEMA_VERSION = 1;

export const MAX_TUNING_NAME_LENGTH = 40;

/** Den del av `localStorage` som de egna stämningarna använder. */
export type CustomTuningsStorage = Pick<Storage, "getItem" | "setItem">;

export interface CustomTuning {
  instrument: StringInstrumentId;
  name: string;
  /** MIDI-tonhöjd per sträng eller Strängpar, sträng 1 först. */
  tuning: readonly number[];
}

/** En Stämning i Stämmarens val: en färdig eller en egen. */
export interface TunerTuning {
  name: string;
  tuning: readonly number[];
  custom: boolean;
}

/** Varför en stämning inte går att spara. */
export type CustomTuningError = "empty" | "tooLong" | "taken" | "invalid";

/** Så långt ner en sträng går att stämma under den lägsta färdiga tonen för den, i halvtoner. */
const STEPS_DOWN = 12;
/** Så långt upp en sträng går att stämma över den högsta färdiga tonen för den, i halvtoner. */
const STEPS_UP = 7;
/** Den lägsta MIDI-tonhöjd Stämmaren hör (A#0, cirka 29 Hz). */
const LOWEST_PITCH = Math.ceil(69 + 12 * Math.log2(MIN_FREQUENCY / 440));

/**
 * Hur långt sträng `index` (0 är sträng 1) går att stämma: en oktav under och en kvint över
 * Stränginstrumentets färdiga stämningar, men aldrig under det Stämmaren hör.
 */
export function pitchRange(instrument: StringInstrument, index: number): { min: number; max: number } {
  const pitches = instrument.tunings.map((t) => t.tuning[index]);
  return {
    min: Math.max(LOWEST_PITCH, Math.min(...pitches) - STEPS_DOWN),
    max: Math.max(...pitches) + STEPS_UP,
  };
}

/** `tuning` med sträng `index` stämd `steps` halvtoner, inom gränsen för strängen. */
export function stepString(
  instrument: StringInstrument,
  tuning: readonly number[],
  index: number,
  steps: number,
): number[] {
  const { min, max } = pitchRange(instrument, index);
  return tuning.map((pitch, i) => (i === index ? Math.min(max, Math.max(min, pitch + steps)) : pitch));
}

/** De färdiga stämningarna för Stränginstrumentet och sedan de egna. */
export function tuningsFor(instrument: StringInstrumentId, customs: readonly CustomTuning[]): TunerTuning[] {
  return [
    ...stringInstrument(instrument).tunings.map((t) => ({ name: t.name, tuning: t.tuning, custom: false })),
    ...customs.filter((t) => t.instrument === instrument).map((t) => ({ name: t.name, tuning: t.tuning, custom: true })),
  ];
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function validTuning(instrument: StringInstrument, tuning: readonly unknown[]): tuning is number[] {
  return (
    tuning.length === instrument.courses.length &&
    tuning.every((pitch, i) => {
      if (typeof pitch !== "number" || !Number.isInteger(pitch)) return false;
      const { min, max } = pitchRange(instrument, i);
      return pitch >= min && pitch <= max;
    })
  );
}

/**
 * Skapar `tuning`, eller ändrar den egna stämningen som hette `previousName` för samma
 * Stränginstrument. Den ändrade stämningen behåller sin plats i listan.
 */
export function putCustomTuning(
  customs: readonly CustomTuning[],
  tuning: CustomTuning,
  previousName?: string,
): { tunings: CustomTuning[] } | { error: CustomTuningError } {
  const name = tuning.name.trim();
  if (name === "") return { error: "empty" };
  if (name.length > MAX_TUNING_NAME_LENGTH) return { error: "tooLong" };
  const instrument = stringInstrument(tuning.instrument);
  if (!validTuning(instrument, tuning.tuning)) return { error: "invalid" };

  const isPrevious = (t: CustomTuning) =>
    previousName !== undefined && t.instrument === tuning.instrument && t.name === previousName;
  const taken =
    instrument.tunings.some((t) => sameName(t.name, name)) ||
    customs.some((t) => t.instrument === tuning.instrument && !isPrevious(t) && sameName(t.name, name));
  if (taken) return { error: "taken" };

  const next: CustomTuning = { instrument: tuning.instrument, name, tuning: [...tuning.tuning] };
  const index = customs.findIndex(isPrevious);
  return { tunings: index < 0 ? [...customs, next] : customs.map((t, i) => (i === index ? next : t)) };
}

/** Listan utan den egna stämningen `name` för Stränginstrumentet. */
export function deleteCustomTuning(
  customs: readonly CustomTuning[],
  instrument: StringInstrumentId,
  name: string,
): CustomTuning[] {
  return customs.filter((t) => t.instrument !== instrument || t.name !== name);
}

/**
 * De sparade egna stämningarna. Det som inte går att läsa hoppas över, liksom en stämning vars
 * namn redan finns för Stränginstrumentet.
 */
export function readCustomTunings(storage: CustomTuningsStorage | null): CustomTuning[] {
  let data: unknown;
  try {
    data = JSON.parse(storage?.getItem(CUSTOM_TUNINGS_KEY) ?? "null");
  } catch {
    return [];
  }
  if (!isRecord(data) || !Array.isArray(data.tunings)) return [];
  if (data.schemaVersion !== SCHEMA_VERSION) return [];

  let tunings: CustomTuning[] = [];
  for (const entry of data.tunings) {
    if (!isRecord(entry) || typeof entry.name !== "string" || !Array.isArray(entry.tuning)) continue;
    const instrument = STRING_INSTRUMENTS.find((i) => i.id === entry.instrument);
    if (!instrument || !validTuning(instrument, entry.tuning)) continue;
    const result = putCustomTuning(tunings, { instrument: instrument.id, name: entry.name, tuning: entry.tuning });
    if ("tunings" in result) tunings = result.tunings;
  }
  return tunings;
}

/** Sparar de egna stämningarna. Utan fungerande lagring gäller de bara tills sidan laddas om. */
export function saveCustomTunings(storage: CustomTuningsStorage | null, tunings: readonly CustomTuning[]): void {
  try {
    storage?.setItem(CUSTOM_TUNINGS_KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION, tunings }));
  } catch {
    // Inget att göra
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
