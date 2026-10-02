import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createEditor } from "./editor";
import type { Score } from "./score";
import { loadDraft, saveDraft, type DraftStorage } from "./draft";
import { serialize } from "./scoreFile";

describe("Utkast: sparning och återställning", () => {
  it("ett sparat Utkast återställs", () => {
    const storage = memoryStorage();
    const score = scoreWith((s) => {
      s.metadata.title = "Blackbird";
      s.tracks[0].bars[0].beats = [{ duration: 8, dotted: true, notes: [{ string: 2, fret: 3 }] }];
    });

    saveDraft(storage, { score, downloaded: false });

    expect(loadDraft(storage)).toEqual({ score, downloaded: false });
  });

  it("utan sparat Utkast finns inget att återställa", () => {
    expect(loadDraft(memoryStorage())).toBeNull();
  });

  it("ett Utkast för ett Partitur i Biblioteket bär id och senast kända revision", () => {
    const storage = memoryStorage();
    const score = createEditor().score;

    saveDraft(storage, { score, downloaded: true, library: { id: "3f2a", revision: 7 } });

    expect(loadDraft(storage)).toEqual({ score, downloaded: true, library: { id: "3f2a", revision: 7 } });
  });
});

describe("Utkast: sparat av en tidigare version av editorn", () => {
  // Utkast ligger kvar i användarnas webbläsare mellan versioner, så nyckeln och formatet är ett kontrakt.
  const KEY = "guitarPractice.tabEditor.draft";

  it("ett Utkast med en äldre schemaVersion migreras vid återställning", () => {
    const storage = memoryStorage();
    const itab = readFileSync(new URL("./fixtures/score-v1.itab", import.meta.url), "utf8");
    storage.setItem(KEY, JSON.stringify({ itab, downloaded: false }));

    const draft = loadDraft(storage);

    expect(draft?.score.metadata.title).toBe("Fixture");
    expect(draft?.score.tempo).toBe(96);
    expect(draft?.downloaded).toBe(false);
  });

  it.each([
    ["inte är JSON", "{\"itab\": "],
    ["saknar Partiturfil", JSON.stringify({ downloaded: true })],
    ["har en trasig Partiturfil", JSON.stringify({ itab: "{}", downloaded: true })],
    ["har en Partiturfil från en senare version", JSON.stringify({ itab: JSON.stringify({ format: "itab", schemaVersion: 999, score: {} }), downloaded: true })],
    ["saknar nedladdningsstatus", JSON.stringify({ itab: serialize(createEditor().score) })],
    ["har en trasig Biblioteks-referens", JSON.stringify({ itab: serialize(createEditor().score), downloaded: true, library: { id: 3 } })],
  ])("ett Utkast som %s återställs inte", (_, text) => {
    const storage = memoryStorage();
    storage.setItem(KEY, text);

    expect(loadDraft(storage)).toBeNull();
  });
});

describe("Utkast: lagringen fungerar inte", () => {
  const draft = { score: createEditor().score, downloaded: false };
  const throwing: DraftStorage = {
    getItem: () => {
      throw new DOMException("The operation is insecure.", "SecurityError");
    },
    setItem: () => {
      throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
    },
  };

  it.each<[string, DraftStorage | null]>([
    ["saknas", null],
    ["kastar fel", throwing],
  ])("när lagringen %s går det att spara utan fel men inget återställs", (_, storage) => {
    expect(() => saveDraft(storage, draft)).not.toThrow();
    expect(loadDraft(storage)).toBeNull();
  });
});

/** En lagring i minnet, som `localStorage`. */
function memoryStorage(): DraftStorage {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
  };
}

/** Ett nytt Partitur, ändrat med `change`. */
function scoreWith(change: (score: Score) => void): Score {
  const score = structuredClone(createEditor().score);
  change(score);
  return score;
}
