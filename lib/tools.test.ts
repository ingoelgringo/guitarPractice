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

  it("alla Verktyg länkar inom gitarrdelen", () => {
    expect(TOOLS.filter((tool) => tool.href).map((tool) => tool.href)).toEqual([
      "/tab-editor",
      "/fretboard",
      "/chord-progressions",
    ]);
  });
});
