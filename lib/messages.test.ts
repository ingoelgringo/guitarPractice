import { describe, expect, it } from "vitest";
import { MESSAGES } from "./messages";
import { TOOLS } from "./tools";

/** Texten, eller för en text med luckor, texten med något i luckorna. */
function rendered(text: string | ((...values: never[]) => string)): string {
  return typeof text === "function" ? (text as (...values: unknown[]) => string)("Wonderwall", 2, "Am") : text;
}

describe("sajtens texter", () => {
  it("finns på båda språken", () => {
    expect(Object.keys(MESSAGES.sv).sort()).toEqual(Object.keys(MESSAGES.en).sort());
    for (const messages of [MESSAGES.en, MESSAGES.sv]) {
      for (const [key, text] of Object.entries(messages)) {
        expect(rendered(text).trim(), key).not.toBe("");
      }
    }
  });

  it("en text med en lucka fyller i den på båda språken", () => {
    expect(MESSAGES.en.confirmDelete("Wonderwall")).toContain("Wonderwall");
    expect(MESSAGES.sv.confirmDelete("Wonderwall")).toContain("Wonderwall");
    expect(MESSAGES.en.highlightedChord("Am")).toContain("Am");
    expect(MESSAGES.sv.highlightedChord("Am")).toContain("Am");
    expect(MESSAGES.en.pulseLabel(2, 3, "Am")).toBe("Bar 2, beat 3: Am");
    expect(MESSAGES.sv.pulseLabel(2, 3, null)).toBe("Takt 2, taktslag 3");
  });

  it("Verktygens beskrivningar finns på båda språken", () => {
    for (const tool of TOOLS) {
      expect(tool.description.en.trim(), tool.title).not.toBe("");
      expect(tool.description.sv.trim(), tool.title).not.toBe("");
    }
  });
});
