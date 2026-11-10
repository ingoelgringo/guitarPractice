import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLAYBACK_SETTINGS,
  PLAYBACK_SETTINGS_KEY,
  readPlaybackSettings,
  savePlaybackSettings,
} from "./progressionPlaybackSettings";

function memoryStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
}

describe("uppspelningens inställningar i webbläsaren", () => {
  it("är inräkning och alla Instrument när inget är sparat", () => {
    expect(DEFAULT_PLAYBACK_SETTINGS).toEqual({
      countIn: true,
      muted: { drums: false, bass: false, piano: false, pad: false },
    });
    expect(readPlaybackSettings(memoryStorage())).toEqual(DEFAULT_PLAYBACK_SETTINGS);
    expect(readPlaybackSettings(null)).toEqual(DEFAULT_PLAYBACK_SETTINGS);
  });

  it("läses tillbaka som de sparades", () => {
    const storage = memoryStorage();
    const settings = { countIn: false, muted: { drums: false, bass: true, piano: false, pad: true } };
    savePlaybackSettings(storage, settings);
    expect(readPlaybackSettings(storage)).toEqual(settings);
  });

  it("tar förvalet för det som saknas eller är trasigt", () => {
    expect(readPlaybackSettings(memoryStorage({ [PLAYBACK_SETTINGS_KEY]: "inte json" }))).toEqual(DEFAULT_PLAYBACK_SETTINGS);
    const partial = JSON.stringify({ countIn: "ja", muted: { pad: true, okänt: true } });
    expect(readPlaybackSettings(memoryStorage({ [PLAYBACK_SETTINGS_KEY]: partial }))).toEqual({
      countIn: true,
      muted: { drums: false, bass: false, piano: false, pad: true },
    });
  });

  it("fungerar utan lagring som går att nå", () => {
    const broken = {
      getItem: () => {
        throw new Error("blockerad");
      },
      setItem: () => {
        throw new Error("blockerad");
      },
    };
    expect(readPlaybackSettings(broken)).toEqual(DEFAULT_PLAYBACK_SETTINGS);
    expect(() => savePlaybackSettings(broken, DEFAULT_PLAYBACK_SETTINGS)).not.toThrow();
  });
});
