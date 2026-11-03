import { describe, expect, it } from "vitest";
import {
  DEFAULT_NOTE_NAME_MODE,
  LEGACY_FRETBOARD_NOTE_NAME_KEY,
  NOTE_NAME_MODE_KEY,
  readNoteNameMode,
  saveNoteNameMode,
} from "./noteNameMode";

function memoryStorage(entries: Record<string, string> = {}) {
  const map = new Map(Object.entries(entries));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    map,
  };
}

describe("Notnamnsläget i webbläsaren", () => {
  it("är engelskt tills man väljer något annat", () => {
    expect(DEFAULT_NOTE_NAME_MODE).toBe("english");
    expect(readNoteNameMode(memoryStorage())).toBe("english");
    expect(readNoteNameMode(null)).toBe("english");
  });

  it("läser valet under den gemensamma nyckeln", () => {
    expect(readNoteNameMode(memoryStorage({ [NOTE_NAME_MODE_KEY]: "swedish" }))).toBe("swedish");
    expect(readNoteNameMode(memoryStorage({ [NOTE_NAME_MODE_KEY]: "english" }))).toBe("english");
  });

  it("läser Greppbrädans gamla nyckel när den gemensamma saknas", () => {
    expect(readNoteNameMode(memoryStorage({ [LEGACY_FRETBOARD_NOTE_NAME_KEY]: "swedish" }))).toBe("swedish");
  });

  it("den gemensamma nyckeln går före den gamla", () => {
    const storage = memoryStorage({ [NOTE_NAME_MODE_KEY]: "english", [LEGACY_FRETBOARD_NOTE_NAME_KEY]: "swedish" });
    expect(readNoteNameMode(storage)).toBe("english");
  });

  it("ett ogiltigt värde räknas som inget val", () => {
    expect(readNoteNameMode(memoryStorage({ [NOTE_NAME_MODE_KEY]: "klingon" }))).toBe("english");
    const storage = memoryStorage({ [NOTE_NAME_MODE_KEY]: "klingon", [LEGACY_FRETBOARD_NOTE_NAME_KEY]: "swedish" });
    expect(readNoteNameMode(storage)).toBe("swedish");
  });

  it("en lagring som kastar fel ger förvalet", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readNoteNameMode(broken)).toBe("english");
    expect(() => saveNoteNameMode(broken, "swedish")).not.toThrow();
  });

  it("sparar under den gemensamma nyckeln", () => {
    const storage = memoryStorage();
    saveNoteNameMode(storage, "swedish");
    expect(storage.map.get(NOTE_NAME_MODE_KEY)).toBe("swedish");
    expect(readNoteNameMode(storage)).toBe("swedish");
  });
});
