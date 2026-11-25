import { describe, expect, it } from "vitest";
import { deleteCustomTuning, readCustomTunings, saveCustomTunings } from "./customTunings";
import { DEFAULT_TUNER_SETTINGS, readTunerSettings, saveTunerSettings, TUNER_SETTINGS_KEY } from "./tunerSettings";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

const stored = (value: unknown) => memoryStorage({ [TUNER_SETTINGS_KEY]: JSON.stringify(value) });

describe("Stämmarens inställningar", () => {
  it("är gitarr 6 i standardstämning med stapel och A4 = 440 Hz första gången", () => {
    expect(readTunerSettings(memoryStorage())).toEqual({
      instrument: "guitar6",
      tuning: "Standard tuning",
      display: "bar",
      a4: 440,
    });
    expect(readTunerSettings(null)).toEqual(DEFAULT_TUNER_SETTINGS);
  });

  it("läser tillbaka det som sparats", () => {
    const storage = memoryStorage();
    const settings = { instrument: "ukulele", tuning: "Low G", display: "needle", a4: 442 } as const;
    saveTunerSettings(storage, settings);
    expect(readTunerSettings(storage)).toEqual(settings);
  });

  it("sparar med schemaVersion 1", () => {
    const storage = memoryStorage();
    saveTunerSettings(storage, DEFAULT_TUNER_SETTINGS);
    expect(JSON.parse(storage.getItem(TUNER_SETTINGS_KEY)!)).toMatchObject({ schemaVersion: 1 });
  });

  it("ger förvalen när det sparade inte går att läsa", () => {
    expect(readTunerSettings(memoryStorage({ [TUNER_SETTINGS_KEY]: "{inte json" }))).toEqual(DEFAULT_TUNER_SETTINGS);
    expect(readTunerSettings(stored("text"))).toEqual(DEFAULT_TUNER_SETTINGS);
  });

  it("ger standardstämningen för gitarr 6 när Stränginstrumentet är okänt", () => {
    expect(readTunerSettings(stored({ instrument: "banjo", tuning: "Open G" }))).toMatchObject({
      instrument: "guitar6",
      tuning: "Standard tuning",
    });
  });

  it("ger Stränginstrumentets förval när Stämningen inte finns för det", () => {
    expect(readTunerSettings(stored({ instrument: "bass4", tuning: "Open G" }))).toMatchObject({
      instrument: "bass4",
      tuning: "Standard",
    });
  });

  it("ger stapeln för en okänd visning", () => {
    expect(readTunerSettings(stored({ display: "strobe" })).display).toBe("bar");
  });

  it.each([
    [425, 430],
    [455, 450],
    [436.5, 436.5],
    ["440", 440],
    [Number.NaN, 440],
  ])("begränsar A4 = %s till %d Hz", (a4, expected) => {
    expect(readTunerSettings(stored({ a4 })).a4).toBe(expected);
  });
});

const openA = { instrument: "guitar6", name: "Open A", tuning: [64, 61, 57, 52, 45, 40] } as const;
const dropB = { instrument: "bass4", name: "Drop B", tuning: [43, 38, 33, 23] } as const;

describe("En vald egen stämning", () => {
  it("kan vara en egen stämning", () => {
    const storage = memoryStorage();
    saveCustomTunings(storage, [openA]);
    saveTunerSettings(storage, { instrument: "guitar6", tuning: "Open A", display: "bar", a4: 440 });
    expect(readTunerSettings(storage).tuning).toBe("Open A");
  });

  it("faller tillbaka på Stränginstrumentets standardstämning när den egna stämningen har tagits bort", () => {
    const storage = memoryStorage();
    saveCustomTunings(storage, [openA, dropB]);
    saveTunerSettings(storage, { instrument: "bass4", tuning: "Drop B", display: "bar", a4: 440 });
    saveCustomTunings(storage, deleteCustomTuning(readCustomTunings(storage), "bass4", "Drop B"));
    expect(readTunerSettings(storage)).toMatchObject({ instrument: "bass4", tuning: "Standard" });
  });

  it("gäller bara för sitt eget Stränginstrument", () => {
    const storage = memoryStorage();
    saveCustomTunings(storage, [openA]);
    saveTunerSettings(storage, { instrument: "guitar7", tuning: "Open A", display: "bar", a4: 440 });
    expect(readTunerSettings(storage).tuning).toBe("Standard");
  });
});
