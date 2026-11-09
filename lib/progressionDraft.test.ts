import { describe, expect, it } from "vitest";
import { newProgression, placeChord, triad } from "./progression";
import {
  loadProgressionDraft,
  PROGRESSION_DRAFT_KEY,
  PROGRESSION_SCHEMA_VERSION,
  parseProgression,
  saveProgressionDraft,
  serializeProgression,
} from "./progressionDraft";

function memoryStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
}

const sample = () => {
  const progression = newProgression();
  return placeChord(progression, { section: progression.sections[0].id, bar: 1, pulse: 2 }, { ...triad(7, "major"), bass: 11 });
};

describe("Ackordföljdens format", () => {
  it("har schemaVersion och läses tillbaka likadant", () => {
    const progression = sample();
    const text = serializeProgression(progression);
    expect(JSON.parse(text).schemaVersion).toBe(PROGRESSION_SCHEMA_VERSION);
    expect(parseProgression(text)).toEqual(progression);
  });

  it("ger null för text som inte är en Ackordföljd", () => {
    expect(parseProgression("inte json")).toBeNull();
    expect(parseProgression("{}")).toBeNull();
    const data = JSON.parse(serializeProgression(sample()));
    expect(parseProgression(JSON.stringify({ ...data, schemaVersion: 99 }))).toBeNull();
    expect(parseProgression(JSON.stringify({ ...data, timeSignature: "5/4" }))).toBeNull();
    expect(parseProgression(JSON.stringify({ ...data, tempo: 500 }))).toBeNull();
    expect(parseProgression(JSON.stringify({ ...data, key: { tonic: 12, mode: "major" } }))).toBeNull();
    expect(parseProgression(JSON.stringify({ ...data, form: ["saknas"] }))).toBeNull();
  });

  it("ger null när ett Ackord står utanför sin Del", () => {
    const data = JSON.parse(serializeProgression(sample()));
    data.sections[0].chords[0].bar = 4;
    expect(parseProgression(JSON.stringify(data))).toBeNull();
    data.sections[0].chords[0].bar = 1;
    data.sections[0].chords[0].pulse = 4;
    expect(parseProgression(JSON.stringify(data))).toBeNull();
    data.sections[0].chords[0].pulse = 2;
    data.sections[0].chords[0].chord.type = "power";
    expect(parseProgression(JSON.stringify(data))).toBeNull();
  });
});

describe("Utkastet av en Ackordföljd", () => {
  it("sparas och läses i webbläsaren", () => {
    const storage = memoryStorage();
    const progression = sample();
    saveProgressionDraft(storage, progression);
    expect(loadProgressionDraft(storage)).toEqual(progression);
  });

  it("är null när det saknas eller inte går att läsa", () => {
    expect(loadProgressionDraft(memoryStorage())).toBeNull();
    expect(loadProgressionDraft(null)).toBeNull();
    expect(loadProgressionDraft(memoryStorage({ [PROGRESSION_DRAFT_KEY]: "{" }))).toBeNull();
  });

  it("tål en lagring som kastar fel", () => {
    const broken = {
      getItem: () => {
        throw new Error("blockerad");
      },
      setItem: () => {
        throw new Error("full");
      },
    };
    expect(loadProgressionDraft(broken)).toBeNull();
    expect(() => saveProgressionDraft(broken, sample())).not.toThrow();
  });
});
