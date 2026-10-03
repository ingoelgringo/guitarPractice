import { describe, expect, it } from "vitest";
import { fretboardView, type Dot, type FretboardSelection, type NoteNameMode } from "./fretboard";
import { STANDARD_TUNING } from "./score";
import { TUNING_PRESETS } from "./tuning";

// Tonklasser
const C = 0;
const C_SHARP = 1;
const D = 2;
const E_FLAT = 3;
const E = 4;
const F = 5;
const G_SHARP = 8;
const A = 9;

function dotsOn(selection: FretboardSelection, string: number): Dot[] {
  return fretboardView(selection).dots.filter((dot) => dot.string === string);
}

describe("Greppbräda", () => {
  it("A mollpentatonik ger Prickar på sträng 6 vid skalans band, med Grundtonen på band 5", () => {
    const dots = dotsOn({ root: A, scale: "minorPentatonic", tuning: STANDARD_TUNING }, 6);

    expect(dots.map((dot) => dot.fret)).toEqual([0, 3, 5, 8, 10, 12, 15]);
    expect(dots.find((dot) => dot.fret === 5)).toEqual({ string: 6, fret: 5, label: "1", isRoot: true, emphasis: "scale" });
    expect(dots.find((dot) => dot.fret === 8)).toEqual({ string: 6, fret: 8, label: "♭3", isRoot: false, emphasis: "scale" });
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

  describe("tonnamn", () => {
    it("F-dur stavas med B♭, som heter B i svenskt Notnamnsläge", () => {
      const selection: FretboardSelection = { root: F, scale: "major", tuning: STANDARD_TUNING, labels: "noteName" };
      const bFlat = (noteNames: NoteNameMode) =>
        dotsOn({ ...selection, noteNames }, 1).find((dot) => dot.fret === 6)?.label;

      expect(bFlat("swedish")).toBe("B");
      expect(bFlat("english")).toBe("B♭");
    });

    /** Tonnamnen på en sträng för ett urval, i bandordning. */
    function namesOn(root: number, scale: FretboardSelection["scale"], string: number, noteNames: NoteNameMode) {
      return dotsOn({ root, scale, tuning: STANDARD_TUNING, labels: "noteName", noteNames }, string).map((dot) => dot.label);
    }

    it("E-dur stavas med korsförtecken, och svenskt läge skriver H", () => {
      // A-strängen: A H C♯ D♯ E F♯ G♯ A …
      expect(namesOn(E, "major", 5, "swedish").slice(0, 7)).toEqual(["A", "H", "C♯", "D♯", "E", "F♯", "G♯"]);
      expect(namesOn(E, "major", 5, "english")[1]).toBe("B");
    });

    it("den blå tonen i A-blues stavas som sänkt kvint: E♭, inte D♯", () => {
      expect(namesOn(A, "blues", 5, "english")).toContain("E♭");
      expect(namesOn(A, "blues", 5, "english")).not.toContain("D♯");
    });

    it("den blå tonen får aldrig dubbelförtecken: E♭-blues har A, inte B𝄫", () => {
      const names = namesOn(E_FLAT, "blues", 6, "english");

      expect(names).toEqual(expect.arrayContaining(["E♭", "G♭", "A", "B♭"]));
      expect(names.some((name) => name.includes("𝄫"))).toBe(false);
    });

    it("lika många förtecken avgörs av grundtonsmenyns stavning: E♭-moll, inte D♯-moll", () => {
      expect(namesOn(E_FLAT, "naturalMinor", 6, "english")).toContain("E♭");
      expect(namesOn(E_FLAT, "naturalMinor", 6, "english")).not.toContain("D♯");
    });

    it("tonarten väljs med minst förtecken: G♯-moll (inte A♭-moll), D♭-dur (inte C♯-dur)", () => {
      expect(namesOn(G_SHARP, "naturalMinor", 6, "english")).toContain("G♯");
      expect(namesOn(C_SHARP, "major", 6, "english")).toContain("D♭");
      expect(namesOn(C_SHARP, "major", 6, "english")).not.toContain("C♯");
    });

    it("grundtonsmenyn namnger alla tolv tonklasser efter Notnamnsläget", () => {
      const roots = (noteNames: NoteNameMode) =>
        fretboardView({ root: C, scale: "major", tuning: STANDARD_TUNING, noteNames }).options.roots;

      expect(roots("english")).toEqual(["C", "C♯/D♭", "D", "E♭", "E", "F", "F♯/G♭", "G", "A♭", "A", "B♭", "B"]);
      expect(roots("swedish").slice(10)).toEqual(["B", "H"]);
    });

    it("pentatonik stavas efter sin Föräldraskala: E♭-durpentatonik har B♭ och inte A♯", () => {
      expect(namesOn(E_FLAT, "majorPentatonic", 6, "english")).toContain("B♭");
    });
  });

  describe("Ackord", () => {
    it("C-dur erbjuder de diatoniska treklangerna I–vii°", () => {
      const { chords } = fretboardView({ root: C, scale: "major", tuning: STANDARD_TUNING, noteNames: "english" }).options;

      expect(chords.map((chord) => `${chord.numeral} – ${chord.name}`)).toEqual([
        "I – C",
        "ii – Dm",
        "iii – Em",
        "IV – F",
        "V – G",
        "vi – Am",
        "vii° – B°",
      ]);
    });

    it("A mollpentatonik erbjuder ackorden i A naturlig moll, med svenska namn", () => {
      const { chords } = fretboardView({ root: A, scale: "minorPentatonic", tuning: STANDARD_TUNING }).options;

      expect(chords.map((chord) => `${chord.numeral} – ${chord.name}`)).toEqual([
        "i – Am",
        "ii° – H°",
        "III – C",
        "iv – Dm",
        "v – Em",
        "VI – F",
        "VII – G",
      ]);
    });

    it("urvalet normaliseras: ett Ackord utanför stegen släpps, ett giltigt behålls", () => {
      const chordOf = (chord: number) =>
        fretboardView({ root: C, scale: "major", chord, tuning: STANDARD_TUNING }).selection.chord;

      expect(chordOf(0)).toBeUndefined();
      expect(chordOf(8)).toBeUndefined();
      expect(chordOf(2.5)).toBeUndefined();
      expect(chordOf(7)).toBe(7);
    });

    it("ett släppt Ackord visar bara skalan", () => {
      const { dots } = fretboardView({ root: C, scale: "major", chord: 9, tuning: STANDARD_TUNING });

      expect(new Set(dots.map((dot) => dot.emphasis))).toEqual(new Set(["scale"]));
    });

    it("skalbyte behåller Ackordets steg: V i C-dur blir v i C mollpentatonik", () => {
      const view = fretboardView({ root: C, scale: "minorPentatonic", chord: 5, tuning: STANDARD_TUNING, noteNames: "english" });

      expect(view.selection.chord).toBe(5);
      expect(view.options.chords[4].name).toBe("Gm");
    });

    it("utan Ackord har alla Prickar skalans betoning", () => {
      const { dots } = fretboardView({ root: C, scale: "major", tuning: STANDARD_TUNING });

      expect(new Set(dots.map((dot) => dot.emphasis))).toEqual(new Set(["scale"]));
    });

    it("ett valt Ackord framhävs över hela halsen och skalans övriga toner tonas ner", () => {
      // Ljusa e-strängen i C-dur med ii – Dm (D, F, A)
      const dots = dotsOn({ root: C, scale: "major", chord: 2, tuning: STANDARD_TUNING }, 1);
      const highlighted = dots.filter((dot) => dot.emphasis === "highlighted").map((dot) => dot.fret);
      const muted = dots.filter((dot) => dot.emphasis === "muted").map((dot) => dot.fret);

      expect(highlighted).toEqual([1, 5, 10, 13]);
      expect(muted).toEqual([0, 3, 7, 8, 12, 15]);
    });

    it("ett Ackords toner utanför pentatoniken visas också: ii° i A mollpentatonik har H", () => {
      // Ljusa e-strängen: H på band 7 är inte med i pentatoniken men i Ackordet H°
      const dots = dotsOn({ root: A, scale: "minorPentatonic", chord: 2, tuning: STANDARD_TUNING }, 1);

      expect(dots.find((dot) => dot.fret === 7)).toEqual({ string: 1, fret: 7, label: "2", isRoot: false, emphasis: "highlighted" });
      expect(dots.find((dot) => dot.fret === 5)?.emphasis).toBe("muted");
    });
  });

  describe("Boxar", () => {
    /** De framhävda banden per sträng, sträng 1 först. */
    function highlightedFrets(selection: FretboardSelection): number[][] {
      return [1, 2, 3, 4, 5, 6].map((string) =>
        dotsOn(selection, string)
          .filter((dot) => dot.emphasis === "highlighted")
          .map((dot) => dot.fret),
      );
    }

    it("Box 1 i A mollpentatonik framhäver band 5–8 på alla strängar och tonar ner resten", () => {
      const selection: FretboardSelection = { root: A, scale: "minorPentatonic", box: 1, tuning: STANDARD_TUNING };

      expect(highlightedFrets(selection)).toEqual([[5, 8], [5, 8], [5, 7], [5, 7], [5, 7], [5, 8]]);
      expect(dotsOn(selection, 6).find((dot) => dot.fret === 3)?.emphasis).toBe("muted");
    });

    it("dur är durpentatonikens läge med två extra toner: Box 1 i C-dur från band 8 på sträng 6", () => {
      const frets = highlightedFrets({ root: C, scale: "major", box: 1, tuning: STANDARD_TUNING });

      expect(frets).toEqual([[7, 8, 10], [8, 10], [7, 9, 10], [7, 9, 10], [7, 8, 10], [8, 10]]);
    });

    it("naturlig moll är mollpentatonikens läge med två extra toner: Box 1 i A naturlig moll", () => {
      const frets = highlightedFrets({ root: A, scale: "naturalMinor", box: 1, tuning: STANDARD_TUNING });

      expect(frets).toEqual([[5, 7, 8], [5, 6, 8], [4, 5, 7], [5, 7], [5, 7, 8], [5, 7, 8]]);
    });

    it("blues är mollpentatonikens läge med den blå tonen: Box 1 i A-blues", () => {
      const frets = highlightedFrets({ root: A, scale: "blues", box: 1, tuning: STANDARD_TUNING });

      expect(frets).toEqual([[5, 8], [5, 8], [5, 7, 8], [5, 7], [5, 6, 7], [5, 8]]);
    });

    it("Box och Ackord tillsammans: ackordtoner i Boxen framhävs, Boxens och Ackordets övriga toner blir skaltoner", () => {
      // A mollpentatonik, i – Am (A, C, E) och Box 1 (band 5–8)
      const selection: FretboardSelection = { root: A, scale: "minorPentatonic", chord: 1, box: 1, tuning: STANDARD_TUNING };
      const emphasisAt = (fret: number, string = 6) => dotsOn(selection, string).find((dot) => dot.fret === fret)?.emphasis;

      expect(emphasisAt(5)).toBe("highlighted"); // A, i Boxen
      expect(emphasisAt(8)).toBe("highlighted"); // C, i Boxen
      expect(emphasisAt(12)).toBe("scale"); // E, ackordton utanför Boxen
      expect(emphasisAt(5, 5)).toBe("scale"); // D, i Boxen men inte i Ackordet
      expect(emphasisAt(10)).toBe("muted"); // D, varken eller
    });

    it("urvalet normaliseras: en Box utanför 1–5 släpps och visar bara skalan", () => {
      const view = (box: number) => fretboardView({ root: A, scale: "minorPentatonic", box, tuning: STANDARD_TUNING });

      expect(view(0).selection.box).toBeUndefined();
      expect(view(6).selection.box).toBeUndefined();
      expect(view(1.5).selection.box).toBeUndefined();
      expect(view(5).selection.box).toBe(5);
      expect(new Set(view(6).dots.map((dot) => dot.emphasis))).toEqual(new Set(["scale"]));
    });

    it("alla Skalor har fem Boxar", () => {
      for (const scale of ["major", "naturalMinor", "majorPentatonic", "minorPentatonic", "blues"] as const) {
        expect(fretboardView({ root: E, scale, tuning: STANDARD_TUNING }).options.boxes).toEqual([1, 2, 3, 4, 5]);
      }
    });

    it("en Box framhävs på alla ställen inom band 0–15: Box 4 i A mollpentatonik vid band 0–3 och 12–15", () => {
      expect(highlightedFrets({ root: A, scale: "minorPentatonic", box: 4, tuning: STANDARD_TUNING })).toEqual([
        [0, 3, 12, 15],
        [1, 3, 13, 15],
        [0, 2, 12, 14],
        [0, 2, 12, 14],
        [0, 3, 12, 15],
        [0, 3, 12, 15],
      ]);
    });

    it("en Box som inte får plats inom band 15 visas bara en oktav ner", () => {
      // Box 1 i F mollpentatonik ligger vid band 1–4. En oktav upp skulle den nå band 16.
      expect(highlightedFrets({ root: F, scale: "minorPentatonic", box: 1, tuning: STANDARD_TUNING })).toEqual([
        [1, 4],
        [1, 4],
        [1, 3],
        [1, 3],
        [1, 3],
        [1, 4],
      ]);
    });

    it("Ackordets toner utanför skalan framhävs inne i Boxen: ii° i A mollpentatonik med Box 1", () => {
      // H° = H, D, F. Box 1 ligger vid band 5–8.
      const selection: FretboardSelection = { root: A, scale: "minorPentatonic", chord: 2, box: 1, tuning: STANDARD_TUNING };
      const emphasisAt = (string: number, fret: number) => dotsOn(selection, string).find((dot) => dot.fret === fret)?.emphasis;

      expect(emphasisAt(1, 7)).toBe("highlighted"); // H
      expect(emphasisAt(2, 6)).toBe("highlighted"); // F
      expect(emphasisAt(1, 1)).toBe("scale"); // F utanför Boxen
    });
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
