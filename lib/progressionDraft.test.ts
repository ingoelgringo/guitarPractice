import { describe, expect, it } from "vitest";
import { newProgression, placeChord, SILENCE, triad } from "./progression";
import {
  loadProgressionDraft,
  PROGRESSION_DRAFT_KEY,
  PROGRESSION_SCHEMA_VERSION,
  parseProgression,
  progressionReplacingLosesWork,
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

  it("läser tillbaka Tystnad", () => {
    const base = sample();
    const progression = placeChord(base, { section: base.sections[0].id, bar: 2, pulse: 0 }, SILENCE);
    expect(parseProgression(serializeProgression(progression))).toEqual(progression);
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

describe("Ackordföljdens format med tillägg", () => {
  it("läser tillbaka tilläggen och Basen", () => {
    const progression = newProgression();
    const chord = { root: 7, type: "sus4", extensions: ["7", "♭9"], bass: 2 } as const;
    const withExtensions = placeChord(progression, { section: progression.sections[0].id, bar: 0, pulse: 0 }, chord);
    expect(parseProgression(serializeProgression(withExtensions))).toEqual(withExtensions);
  });

  it("ger null för tillägg som inte finns", () => {
    const data = JSON.parse(serializeProgression(sample()));
    data.sections[0].chords[0].chord.extensions = ["7", "x"];
    expect(parseProgression(JSON.stringify(data))).toBeNull();
  });

  it("skriver tilläggen i den fasta ordningen", () => {
    const data = JSON.parse(serializeProgression(sample()));
    data.sections[0].chords[0].chord.extensions = ["♭9", "7", "7"];
    expect(parseProgression(JSON.stringify(data))?.sections[0].chords[0].chord).toMatchObject({ extensions: ["7", "♭9"] });
  });
});

describe("Utkastet av en Ackordföljd", () => {
  it("sparas och läses i webbläsaren", () => {
    const storage = memoryStorage();
    const progression = sample();
    saveProgressionDraft(storage, { progression });
    expect(loadProgressionDraft(storage)).toEqual({ progression });
  });

  it("minns vilken Ackordföljd i Biblioteket det är, med revision och om den är sparad", () => {
    const storage = memoryStorage();
    const draft = { progression: sample(), library: { id: "p1", revision: 3, saved: false } };
    saveProgressionDraft(storage, draft);
    expect(loadProgressionDraft(storage)).toEqual(draft);
  });

  it("läser ett Utkast från före Biblioteket, som bara är Ackordföljden", () => {
    const progression = sample();
    const storage = memoryStorage({ [PROGRESSION_DRAFT_KEY]: serializeProgression(progression) });
    expect(loadProgressionDraft(storage)).toEqual({ progression });
  });

  it("är null när Bibliotekets uppgifter inte går att läsa", () => {
    const text = JSON.stringify({ progression: serializeProgression(sample()), library: { id: "p1", revision: "3" } });
    expect(loadProgressionDraft(memoryStorage({ [PROGRESSION_DRAFT_KEY]: text }))).toBeNull();
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
    expect(() => saveProgressionDraft(broken, { progression: sample() })).not.toThrow();
  });
});

describe("Att ersätta Utkastet med en Ackordföljd från Biblioteket", () => {
  const target = { id: "p1", revision: 2 };

  it("förlorar inget när det inte finns något Utkast eller Utkastet saknar Ackord", () => {
    expect(progressionReplacingLosesWork(null, target)).toBe(false);
    expect(progressionReplacingLosesWork({ progression: newProgression() }, target)).toBe(false);
  });

  it("förlorar arbete när Utkastet har Ackord och inte ligger i Biblioteket", () => {
    expect(progressionReplacingLosesWork({ progression: sample() }, target)).toBe(true);
  });

  it("förlorar inget när Utkastet är sparat i Biblioteket", () => {
    expect(progressionReplacingLosesWork({ progression: sample(), library: { id: "p9", revision: 1, saved: true } }, target)).toBe(false);
  });

  it("förlorar osparade ändringar, utom när det är samma revision av samma Ackordföljd", () => {
    const unsaved = (id: string, revision: number) => ({ progression: sample(), library: { id, revision, saved: false } });
    expect(progressionReplacingLosesWork(unsaved("p9", 2), target)).toBe(true);
    expect(progressionReplacingLosesWork(unsaved("p1", 1), target)).toBe(true);
    expect(progressionReplacingLosesWork(unsaved("p1", 2), target)).toBe(false);
  });
});
