/**
 * Uppspelningens inställningar som sparas i webbläsaren: inräkningen och vilka Instrument som är
 * urbockade. De hör inte till Ackordföljden och gäller alla Ackordföljder.
 */

import { type Instrument, INSTRUMENTS } from "./progressionPlayback";

export const PLAYBACK_SETTINGS_KEY = "guitarPractice.chordProgressions.playback";

/** Den del av `localStorage` som inställningarna använder. */
export type PlaybackSettingsStorage = Pick<Storage, "getItem" | "setItem">;

export interface PlaybackSettings {
  countIn: boolean;
  /** Vilka Instrument som är urbockade. */
  muted: Record<Instrument, boolean>;
}

export const DEFAULT_PLAYBACK_SETTINGS: PlaybackSettings = {
  countIn: true,
  muted: { drums: false, bass: false, piano: false, pad: false },
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/** De sparade inställningarna. Det som saknas eller inte går att läsa får förvalet. */
export function readPlaybackSettings(storage: PlaybackSettingsStorage | null): PlaybackSettings {
  let data: unknown;
  try {
    data = JSON.parse(storage?.getItem(PLAYBACK_SETTINGS_KEY) ?? "null");
  } catch {
    return DEFAULT_PLAYBACK_SETTINGS;
  }
  if (!isRecord(data)) return DEFAULT_PLAYBACK_SETTINGS;
  const stored = isRecord(data.muted) ? data.muted : {};
  const muted = Object.fromEntries(
    INSTRUMENTS.map((instrument) => {
      const value = stored[instrument];
      return [instrument, typeof value === "boolean" ? value : DEFAULT_PLAYBACK_SETTINGS.muted[instrument]];
    }),
  ) as PlaybackSettings["muted"];
  const countIn = typeof data.countIn === "boolean" ? data.countIn : DEFAULT_PLAYBACK_SETTINGS.countIn;
  return { countIn, muted };
}

/** Sparar inställningarna. Utan fungerande lagring gäller de bara tills sidan laddas om. */
export function savePlaybackSettings(storage: PlaybackSettingsStorage | null, settings: PlaybackSettings): void {
  try {
    storage?.setItem(PLAYBACK_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Inget att göra
  }
}
