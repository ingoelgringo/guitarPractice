import { describe, expect, it } from "vitest";
import { fretboardView, type Dot, type FretboardSelection, type NoteNameMode, type RootRole } from "./fretboard";
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
    expect(dots.find((dot) => dot.fret === 5)).toEqual({ string: 6, fret: 5, label: "1", rootRole: "scale", layer: "scale" });
    expect(dots.find((dot) => dot.fret === 8)).toEqual({ string: 6, fret: 8, label: "♭3", rootRole: "none", layer: "scale" });
  });

  it("C-dur på ljusa e-strängen: bara skaltoner, lösa e är tersen", () => {
    const dots = dotsOn({ root: C, scale: "major", tuning: STANDARD_TUNING }, 1);

    expect(dots.map((dot) => dot.fret)).toEqual([0, 1, 3, 5, 7, 8, 10, 12, 13, 15]);
    expect(dots[0].label).toBe("3");
    expect(dots.filter((dot) => dot.rootRole === "scale").map((dot) => dot.fret)).toEqual([8]);
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

      expect(new Set(dots.map((dot) => dot.layer))).toEqual(new Set(["scale"]));
    });

    it("skalbyte behåller Ackordets steg: V i C-dur blir v i C mollpentatonik", () => {
      const view = fretboardView({ root: C, scale: "minorPentatonic", chord: 5, tuning: STANDARD_TUNING, noteNames: "english" });

      expect(view.selection.chord).toBe(5);
      expect(view.options.chords[4].name).toBe("Gm");
    });

    it("utan val ligger alla Prickar i skalans lager", () => {
      const { dots } = fretboardView({ root: C, scale: "major", tuning: STANDARD_TUNING });

      expect(new Set(dots.map((dot) => dot.layer))).toEqual(new Set(["scale"]));
    });

    it("bara Ackord: Ackordets toner ligger i Ackordets lager över hela halsen och resten tonas ner", () => {
      // Ljusa e-strängen i C-dur med ii – Dm (D, F, A)
      const dots = dotsOn({ root: C, scale: "major", chord: 2, tuning: STANDARD_TUNING }, 1);
      const chordFrets = dots.filter((dot) => dot.layer === "chord").map((dot) => dot.fret);
      const muted = dots.filter((dot) => dot.layer === "muted").map((dot) => dot.fret);

      expect(chordFrets).toEqual([1, 5, 10, 13]);
      expect(muted).toEqual([0, 3, 7, 8, 12, 15]);
    });

    it("ett Ackords toner utanför pentatoniken visas också: ii° i A mollpentatonik har H", () => {
      // Ljusa e-strängen: H på band 7 är inte med i pentatoniken men i Ackordet H°
      const dots = dotsOn({ root: A, scale: "minorPentatonic", chord: 2, tuning: STANDARD_TUNING }, 1);

      expect(dots.find((dot) => dot.fret === 7)).toEqual({ string: 1, fret: 7, label: "2", rootRole: "chord", layer: "chord" });
      expect(dots.find((dot) => dot.fret === 5)?.layer).toBe("muted");
    });
  });

  describe("Boxar", () => {
    /** Banden i Boxens lager per sträng, sträng 1 först. */
    function boxFrets(selection: FretboardSelection): number[][] {
      return [1, 2, 3, 4, 5, 6].map((string) =>
        dotsOn(selection, string)
          .filter((dot) => dot.layer === "box")
          .map((dot) => dot.fret),
      );
    }

    it("bara Box: Box 1 i A mollpentatonik ligger vid band 5–8 på alla strängar och resten tonas ner", () => {
      const selection: FretboardSelection = { root: A, scale: "minorPentatonic", box: 1, tuning: STANDARD_TUNING };

      expect(boxFrets(selection)).toEqual([[5, 8], [5, 8], [5, 7], [5, 7], [5, 7], [5, 8]]);
      expect(dotsOn(selection, 6).find((dot) => dot.fret === 3)?.layer).toBe("muted");
    });

    it("dur är durpentatonikens läge med två extra toner: Box 1 i C-dur från band 8 på sträng 6", () => {
      const frets = boxFrets({ root: C, scale: "major", box: 1, tuning: STANDARD_TUNING });

      expect(frets).toEqual([[7, 8, 10], [8, 10], [7, 9, 10], [7, 9, 10], [7, 8, 10], [8, 10]]);
    });

    it("naturlig moll är mollpentatonikens läge med två extra toner: Box 1 i A naturlig moll", () => {
      const frets = boxFrets({ root: A, scale: "naturalMinor", box: 1, tuning: STANDARD_TUNING });

      expect(frets).toEqual([[5, 7, 8], [5, 6, 8], [4, 5, 7], [5, 7], [5, 7, 8], [5, 7, 8]]);
    });

    it("blues är mollpentatonikens läge med den blå tonen: Box 1 i A-blues", () => {
      const frets = boxFrets({ root: A, scale: "blues", box: 1, tuning: STANDARD_TUNING });

      expect(frets).toEqual([[5, 8], [5, 8], [5, 7, 8], [5, 7], [5, 6, 7], [5, 8]]);
    });

    it("Box och Ackord utan form: Ackordets toner i Boxen ligger i Ackordets lager, Boxens övriga i Boxens, resten tonas ner", () => {
      // A mollpentatonik, i – Am (A, C, E) och Box 1 (band 5–8)
      const selection: FretboardSelection = { root: A, scale: "minorPentatonic", chord: 1, box: 1, tuning: STANDARD_TUNING };
      const layerAt = (fret: number, string = 6) => dotsOn(selection, string).find((dot) => dot.fret === fret)?.layer;

      expect(layerAt(5)).toBe("chord"); // A, i Boxen
      expect(layerAt(8)).toBe("chord"); // C, i Boxen
      expect(layerAt(12)).toBe("muted"); // E, ackordton utanför Boxen
      expect(layerAt(5, 5)).toBe("box"); // D, i Boxen men inte i Ackordet
      expect(layerAt(10)).toBe("muted"); // D, varken eller
    });

    it("urvalet normaliseras: en Box utanför 1–5 släpps och visar bara skalan", () => {
      const view = (box: number) => fretboardView({ root: A, scale: "minorPentatonic", box, tuning: STANDARD_TUNING });

      expect(view(0).selection.box).toBeUndefined();
      expect(view(6).selection.box).toBeUndefined();
      expect(view(1.5).selection.box).toBeUndefined();
      expect(view(5).selection.box).toBe(5);
      expect(new Set(view(6).dots.map((dot) => dot.layer))).toEqual(new Set(["scale"]));
    });

    it("alla Skalor har fem Boxar", () => {
      for (const scale of ["major", "naturalMinor", "majorPentatonic", "minorPentatonic", "blues"] as const) {
        expect(fretboardView({ root: E, scale, tuning: STANDARD_TUNING }).options.boxes).toEqual([1, 2, 3, 4, 5]);
      }
    });

    it("en Box ligger på alla ställen inom band 0–15: Box 4 i A mollpentatonik vid band 0–3 och 12–15", () => {
      expect(boxFrets({ root: A, scale: "minorPentatonic", box: 4, tuning: STANDARD_TUNING })).toEqual([
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
      expect(boxFrets({ root: F, scale: "minorPentatonic", box: 1, tuning: STANDARD_TUNING })).toEqual([
        [1, 4],
        [1, 4],
        [1, 3],
        [1, 3],
        [1, 3],
        [1, 4],
      ]);
    });

    it("cell med förminskat Ackord: ii° i A mollpentatonik med Box 1 visar Ackordets toner i Boxen, även de utanför skalan", () => {
      // H° = H, D, F. Box 1 ligger vid band 5–8.
      const selection: FretboardSelection = { root: A, scale: "minorPentatonic", chord: 2, box: 1, tuning: STANDARD_TUNING };
      const layerAt = (string: number, fret: number) => dotsOn(selection, string).find((dot) => dot.fret === fret)?.layer;

      expect(layerAt(1, 7)).toBe("chord"); // H
      expect(layerAt(2, 6)).toBe("chord"); // F
      expect(layerAt(5, 5)).toBe("chord"); // D
      expect(layerAt(2, 5)).toBe("box"); // E, i Boxen men inte i Ackordet
      expect(layerAt(1, 1)).toBe("muted"); // F utanför Boxen
      expect(layerAt(6, 3)).toBe("muted"); // G, varken eller
    });
  });

  describe("CAGED-former", () => {
    /** Greppet som [sträng, band] för Prickarna i Ackordets lager, sträng 1 först. */
    function grip(selection: FretboardSelection): [number, number][] {
      return fretboardView(selection)
        .dots.filter((dot) => dot.layer === "chord")
        .map((dot): [number, number] => [dot.string, dot.fret])
        .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    }

    it("E-formen för A-dur har sin grundton på band 5 på sträng 6, en Prick per sträng", () => {
      const selection: FretboardSelection = { root: A, scale: "major", chord: 1, caged: "E", tuning: STANDARD_TUNING };

      expect(grip(selection)).toEqual([
        [1, 5],
        [2, 5],
        [3, 6],
        [4, 7],
        [5, 7],
        [6, 5],
      ]);
      expect(fretboardView(selection).mutedStrings).toEqual([]);
    });

    it("C-formen för C-dur i öppet läge dämpar sträng 6", () => {
      const selection: FretboardSelection = { root: C, scale: "major", chord: 1, caged: "C", tuning: STANDARD_TUNING };

      expect(grip(selection)).toEqual([
        [1, 0],
        [2, 1],
        [3, 0],
        [4, 2],
        [5, 3],
      ]);
      expect(fretboardView(selection).mutedStrings).toEqual([6]);
    });

    it("mollackord har egna former: A-formen för Am", () => {
      const selection: FretboardSelection = { root: A, scale: "minorPentatonic", chord: 1, caged: "A", tuning: STANDARD_TUNING };

      expect(grip(selection)).toEqual([
        [1, 0],
        [2, 1],
        [3, 2],
        [4, 2],
        [5, 0],
      ]);
    });

    it("formen flyttas med Ackordet: D-formen för G (V i C-dur) med grundton på D-strängen band 5", () => {
      const selection: FretboardSelection = { root: C, scale: "major", chord: 5, caged: "D", tuning: STANDARD_TUNING };

      expect(grip(selection)).toEqual([
        [1, 7],
        [2, 8],
        [3, 7],
        [4, 5],
      ]);
      expect(fretboardView(selection).mutedStrings).toEqual([5, 6]);
    });

    it("dur- och mollackord erbjuder alla fem former, i ordningen C, A, G, E, D", () => {
      const { options } = fretboardView({ root: C, scale: "major", chord: 2, tuning: STANDARD_TUNING });

      expect(options.cagedShapes).toEqual(
        ["C", "A", "G", "E", "D"].map((shape) => ({ shape, disabled: false })),
      );
    });

    it("valet är gråat för B° i C-dur och utan Ackord, och formen släpps då", () => {
      const diminished: FretboardSelection = { root: C, scale: "major", chord: 7, tuning: STANDARD_TUNING };
      const noChord: FretboardSelection = { root: C, scale: "major", tuning: STANDARD_TUNING };

      for (const selection of [diminished, noChord]) {
        const view = fretboardView({ ...selection, caged: "E" });
        expect(view.options.cagedShapes.every((option) => option.disabled)).toBe(true);
        expect(view.selection.caged).toBeUndefined();
        expect(view.dots).toEqual(fretboardView(selection).dots);
        expect(view.mutedStrings).toEqual([]);
      }
    });

    it("skalbyte släpper formen när Ackordet blir förminskat: ii i C-dur blir ii° i C naturlig moll", () => {
      const view = fretboardView({ root: C, scale: "naturalMinor", chord: 2, caged: "A", tuning: STANDARD_TUNING });

      expect(view.selection.chord).toBe(2);
      expect(view.selection.caged).toBeUndefined();
    });

    it("en okänd form släpps", () => {
      const view = fretboardView({ root: C, scale: "major", chord: 1, caged: "X" as never, tuning: STANDARD_TUNING });

      expect(view.selection.caged).toBeUndefined();
    });

    it("cell: E-formen för Am i Box 1 av A mollpentatonik, med greppet i Ackordets lager och Boxen i Boxens", () => {
      const selection: FretboardSelection = { root: A, scale: "minorPentatonic", chord: 1, box: 1, caged: "E", tuning: STANDARD_TUNING };
      const dots = fretboardView(selection).dots;
      const layerAt = (string: number, fret: number) => dots.find((dot) => dot.string === string && dot.fret === fret)?.layer;

      expect(grip(selection)).toEqual([
        [1, 5],
        [2, 5],
        [3, 5],
        [4, 7],
        [5, 7],
        [6, 5],
      ]);
      expect(layerAt(2, 8)).toBe("box"); // G i Boxen men inte i Ackordet
      expect(layerAt(1, 8)).toBe("box"); // C, ackordton i Boxen men utanför greppet
      expect(layerAt(6, 12)).toBe("muted"); // E, ackordton utanför Boxen
    });

    it("greppet ritas i varje kopia av Boxen: A-formen för Am i Box 4 av A mollpentatonik vid band 0–2 och 12–14", () => {
      const selection: FretboardSelection = { root: A, scale: "minorPentatonic", chord: 1, box: 4, caged: "A", tuning: STANDARD_TUNING };

      expect(grip(selection)).toEqual([
        [1, 0], [1, 12],
        [2, 1], [2, 13],
        [3, 2], [3, 14],
        [4, 2], [4, 14],
        [5, 0], [5, 12],
      ]);
    });

    it("greppet ritas inne i Boxen och inte i lägsta läget: E-formen för C (I i C-dur) i Box 1 vid band 8", () => {
      const selection: FretboardSelection = { root: C, scale: "major", chord: 1, box: 1, caged: "E", tuning: STANDARD_TUNING };

      expect(grip(selection)).toEqual([
        [1, 8],
        [2, 8],
        [3, 9],
        [4, 10],
        [5, 10],
        [6, 8],
      ]);
    });
  });

  describe("grundtoner", () => {
    /** Banden per grundtonsroll på en sträng. */
    function rootFrets(selection: FretboardSelection, string: number) {
      const dots = dotsOn(selection, string);
      const fretsOf = (role: RootRole) => dots.filter((dot) => dot.rootRole === role).map((dot) => dot.fret);
      return { scale: fretsOf("scale"), chord: fretsOf("chord") };
    }

    it("Skalans Grundton och Ackordets grundton får var sin roll: ii – Dm i C-dur", () => {
      // A-strängen: C på band 3 och 15, D på band 5
      expect(rootFrets({ root: C, scale: "major", chord: 2, tuning: STANDARD_TUNING }, 5)).toEqual({ scale: [3, 15], chord: [5] });
    });

    it("vid Ackord I vinner Ackordets grundton", () => {
      expect(rootFrets({ root: C, scale: "major", chord: 1, tuning: STANDARD_TUNING }, 5)).toEqual({ scale: [], chord: [3, 15] });
    });

    it("utan Ackord är bara Skalans Grundton en grundton", () => {
      expect(rootFrets({ root: C, scale: "major", tuning: STANDARD_TUNING }, 5)).toEqual({ scale: [3, 15], chord: [] });
    });
  });

  it("varje sträng har Prickar inom band 0–15 och halsen följer Stämningen", () => {
    const dropD = TUNING_PRESETS.find((preset) => preset.name === "Drop D")!.tuning;
    const { dots } = fretboardView({ root: D, scale: "majorPentatonic", tuning: dropD });

    expect(new Set(dots.map((dot) => dot.string))).toEqual(new Set([1, 2, 3, 4, 5, 6]));
    expect(dots.every((dot) => dot.fret >= 0 && dot.fret <= 15)).toBe(true);
    // Lösa D på sträng 6 i Drop D är Grundton i D-durpentatonik
    expect(dots.find((dot) => dot.string === 6 && dot.fret === 0)?.rootRole).toBe("scale");
  });
});
