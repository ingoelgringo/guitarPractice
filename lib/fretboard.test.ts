import { describe, expect, it } from "vitest";
import { fretboardView, type Dot, type FretboardSelection } from "./fretboard";
import { STANDARD_TUNING } from "./score";
import { TUNING_PRESETS } from "./tuning";

const A = 9;
const C = 0;
const D = 2;

function dotsOn(selection: FretboardSelection, string: number): Dot[] {
  return fretboardView(selection).dots.filter((dot) => dot.string === string);
}

describe("Greppbräda", () => {
  it("A mollpentatonik ger Prickar på sträng 6 vid skalans band, med Grundtonen på band 5", () => {
    const dots = dotsOn({ root: A, scale: "minorPentatonic", tuning: STANDARD_TUNING }, 6);

    expect(dots.map((dot) => dot.fret)).toEqual([0, 3, 5, 8, 10, 12, 15]);
    expect(dots.find((dot) => dot.fret === 5)).toEqual({ string: 6, fret: 5, label: "1", isRoot: true });
    expect(dots.find((dot) => dot.fret === 8)).toEqual({ string: 6, fret: 8, label: "♭3", isRoot: false });
  });

  it("C-dur på ljusa e-strängen: bara skaltoner, lösa e är tersen", () => {
    const dots = dotsOn({ root: C, scale: "major", tuning: STANDARD_TUNING }, 1);

    expect(dots.map((dot) => dot.fret)).toEqual([0, 1, 3, 5, 7, 8, 10, 12, 13, 15]);
    expect(dots[0].label).toBe("3");
    expect(dots.filter((dot) => dot.isRoot).map((dot) => dot.fret)).toEqual([8]);
  });

  it("C-dur har inga Prickar utanför skalan på någon sträng", () => {
    const { dots } = fretboardView({ root: C, scale: "major", tuning: STANDARD_TUNING });

    expect(new Set(dots.map((dot) => dot.label))).toEqual(new Set(["1", "2", "3", "4", "5", "6", "7"]));
  });

  it("A-blues har den blå tonen ♭5 (D♯ på A-strängen band 6)", () => {
    const dots = dotsOn({ root: A, scale: "blues", tuning: STANDARD_TUNING }, 5);

    expect(dots.find((dot) => dot.fret === 6)?.label).toBe("♭5");
  });

  it("varje sträng har Prickar inom band 0–15 och halsen följer Stämningen", () => {
    const dropD = TUNING_PRESETS.find((preset) => preset.name === "Drop D")!.tuning;
    const { dots } = fretboardView({ root: D, scale: "majorPentatonic", tuning: dropD });

    expect(new Set(dots.map((dot) => dot.string))).toEqual(new Set([1, 2, 3, 4, 5, 6]));
    expect(dots.every((dot) => dot.fret >= 0 && dot.fret <= 15)).toBe(true);
    // Lösa D på sträng 6 i Drop D är Grundton i D-durpentatonik
    expect(dots.find((dot) => dot.string === 6 && dot.fret === 0)?.isRoot).toBe(true);
  });
});
