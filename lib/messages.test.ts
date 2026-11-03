import { describe, expect, it } from "vitest";
import { MESSAGES } from "./messages";
import { TOOLS } from "./tools";

/** Texten, eller för en text med en lucka, texten med något i luckan. */
function rendered(text: string | ((value: string) => string)): string {
  return typeof text === "function" ? text("Wonderwall") : text;
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
  });

  it("Verktygens beskrivningar finns på båda språken", () => {
    for (const tool of TOOLS) {
      expect(tool.description.en.trim(), tool.title).not.toBe("");
      expect(tool.description.sv.trim(), tool.title).not.toBe("");
    }
  });
});
