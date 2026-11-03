import { describe, expect, it } from "vitest";
import { TOOLS } from "./tools";

describe("Verktygen på Gitarrsidan", () => {
  it("är Tab Editor, Fretboard Practice och Chord Progressions", () => {
    expect(TOOLS.map((tool) => tool.title)).toEqual([
      "Tab Editor",
      "Fretboard Practice",
      "Chord Progressions",
    ]);
  });

  it("Chord Progressions har ingen länk än", () => {
    const chords = TOOLS.find((tool) => tool.title === "Chord Progressions");
    expect(chords?.href).toBeUndefined();
  });

  it("de färdiga Verktygen länkar inom gitarrdelen", () => {
    expect(TOOLS.filter((tool) => tool.href).map((tool) => tool.href)).toEqual([
      "/tab-editor",
      "/fretboard",
    ]);
  });
});
