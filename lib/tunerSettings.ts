/**
 * Stämmarens inställningar som sparas i webbläsaren, så att Stämmaren öppnas där man slutade:
 * Stränginstrument, Stämning, visning och referenston.
 */

import { readCustomTunings, tuningsFor } from "./customTunings";
import { STANDARD_TUNING_NAME, STRING_INSTRUMENTS, stringInstrument, type StringInstrumentId } from "./tuning";

export const TUNER_SETTINGS_KEY = "guitarPractice.tuner.settings";
/** Formatets version. Ett format utan version läses som version 1. */
const SCHEMA_VERSION = 1;

/** Den del av `localStorage` som inställningarna använder. */
export type TunerSettingsStorage = Pick<Storage, "getItem" | "setItem">;

/** Hur avvikelsen visas: en stapel eller en halvcirkelformad nål. */
export type TunerDisplay = "bar" | "needle";

export interface TunerSettings {
  instrument: StringInstrumentId;
  /** Namnet på Stämningen bland Stränginstrumentets färdiga och egna stämningar. */
  tuning: string;
  display: TunerDisplay;
  /** Referenstonen A4 i Hz. */
  a4: number;
}

export const DEFAULT_TUNER_SETTINGS: TunerSettings = {
  instrument: "guitar6",
  tuning: STANDARD_TUNING_NAME,
  display: "bar",
  a4: 440,
};

/**
 * De sparade inställningarna. Det som saknas eller inte går att läsa får förvalet, och en Stämning
 * som inte finns längre, t.ex. en borttagen egen stämning, ger Stränginstrumentets standardstämning.
 */
export function readTunerSettings(storage: TunerSettingsStorage | null): TunerSettings {
  let data: unknown;
  try {
    data = JSON.parse(storage?.getItem(TUNER_SETTINGS_KEY) ?? "null");
  } catch {
    return DEFAULT_TUNER_SETTINGS;
  }
  if (!isRecord(data)) return DEFAULT_TUNER_SETTINGS;

  // Ett okänt Stränginstrument ger förvalet för både instrument och Stämning.
  const known = STRING_INSTRUMENTS.find((i) => i.id === data.instrument);
  const instrument = known ?? stringInstrument(DEFAULT_TUNER_SETTINGS.instrument);
  const tunings = tuningsFor(instrument.id, readCustomTunings(storage));
  const tuning = (known && tunings.find((t) => t.name === data.tuning)) || tunings[0];
  const display = data.display === "needle" ? "needle" : "bar";
  const a4 =
    typeof data.a4 === "number" && Number.isFinite(data.a4)
      ? Math.min(MAX_A4, Math.max(MIN_A4, data.a4))
      : DEFAULT_TUNER_SETTINGS.a4;
  return { instrument: instrument.id, tuning: tuning.name, display, a4 };
}

export const MIN_A4 = 430;
export const MAX_A4 = 450;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/** Sparar inställningarna. Utan fungerande lagring gäller de bara tills sidan laddas om. */
export function saveTunerSettings(storage: TunerSettingsStorage | null, settings: TunerSettings): void {
  try {
    storage?.setItem(TUNER_SETTINGS_KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION, ...settings }));
  } catch {
    // Inget att göra
  }
}
