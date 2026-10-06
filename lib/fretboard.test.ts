import { describe, expect, it } from "vitest";
import { fretboardView, STRING_SETS, type Dot, type FretboardSelection, type NoteNameMode, type RootRole } from "./fretboard";
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
    it("C-dur erbjuder de diatoniska treklangerna I–vii° som CAGED-tabellens rader", () => {
      const { cagedTable } = fretboardView({ root: C, scale: "major", tuning: STANDARD_TUNING, noteNames: "english" }).options;

      expect(cagedTable.map((chord) => `${chord.numeral} – ${chord.name}`)).toEqual([
        "I – C",
        "ii – Dm",
        "iii – Em",
        "IV – F",
        "V – G",
        "vi – Am",
        "vii° – B°",
      ]);
    });

    it("tabellen följer Skalan: A mollpentatonik har raderna i–VII från A naturlig moll, med svenska namn", () => {
      const { cagedTable } = fretboardView({ root: A, scale: "minorPentatonic", tuning: STANDARD_TUNING }).options;

      expect(cagedTable.map((chord) => `${chord.numeral} – ${chord.name}`)).toEqual([
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
      expect(view.options.cagedTable[4].name).toBe("Gm");
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

    it("formen släpps för B° i C-dur och utan Ackord", () => {
      const diminished: FretboardSelection = { root: C, scale: "major", chord: 7, tuning: STANDARD_TUNING };
      const noChord: FretboardSelection = { root: C, scale: "major", tuning: STANDARD_TUNING };

      for (const selection of [diminished, noChord]) {
        const view = fretboardView({ ...selection, caged: "E" });
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

  describe("CAGED-tabellen", () => {
    /** Formerna i radens celler för Box 1–5, "–" där ingen form finns. */
    function row(selection: FretboardSelection, degree: number): string[] {
      const found = fretboardView(selection).options.cagedTable.find((candidate) => candidate.degree === degree)!;
      return found.cells.map(({ shape }) => shape ?? "–");
    }

    it("raden för I i C-dur är E, D, C, A, G för Box 1–5", () => {
      expect(row({ root: C, scale: "major", tuning: STANDARD_TUNING }, 1)).toEqual(["E", "D", "C", "A", "G"]);
    });

    it("raderna följer CAGED-ordningen uppåt längs halsen: ii i C-dur är G, E, D, C, A", () => {
      expect(row({ root: C, scale: "major", tuning: STANDARD_TUNING }, 2)).toEqual(["G", "E", "D", "C", "A"]);
    });

    it("varje rad för dur- och mollackord har varje form exakt en gång, i alla Skalor och tonarter", () => {
      for (const scale of ["major", "naturalMinor", "majorPentatonic", "minorPentatonic", "blues"] as const) {
        for (let root = 0; root < 12; root++) {
          for (const { numeral, cells } of fretboardView({ root, scale, tuning: STANDARD_TUNING }).options.cagedTable) {
            if (numeral.endsWith("°")) continue;
            expect(cells.map(({ shape }) => shape).sort()).toEqual(["A", "C", "D", "E", "G"]);
          }
        }
      }
    });

    it("raden för vii° i C-dur har inga former", () => {
      expect(row({ root: C, scale: "major", tuning: STANDARD_TUNING }, 7)).toEqual(["–", "–", "–", "–", "–"]);
    });
  });

  describe("Penta-tabellen", () => {
    /** Penta-boxarna i radens celler för Box 1–5, "–" där ingen finns. */
    function row(selection: FretboardSelection, degree: number): string[] {
      const found = fretboardView(selection).options.pentaTable.find((candidate) => candidate.degree === degree)!;
      return found.cells.map(({ pentaBox }) => (pentaBox === null ? "–" : String(pentaBox)));
    }

    it("raden för I i C-dur är 1, 2, 3, 4, 5: C-durpentatonikens Penta-boxar är Skalans Boxar", () => {
      expect(row({ root: C, scale: "major", tuning: STANDARD_TUNING }, 1)).toEqual(["1", "2", "3", "4", "5"]);
    });

    it("raden för ii – Dm i C-dur är 5, 1, 2, 3, 4: D mollpentatonikens Box 1 ligger i Box 2", () => {
      expect(row({ root: C, scale: "major", tuning: STANDARD_TUNING }, 2)).toEqual(["5", "1", "2", "3", "4"]);
    });

    it("varje rad för dur- och mollackord har varje Penta-box exakt en gång, i alla Skalor och tonarter", () => {
      for (const scale of ["major", "naturalMinor", "majorPentatonic", "minorPentatonic", "blues"] as const) {
        for (let root = 0; root < 12; root++) {
          for (const { numeral, cells } of fretboardView({ root, scale, tuning: STANDARD_TUNING }).options.pentaTable) {
            if (numeral.endsWith("°")) continue;
            expect(cells.map(({ pentaBox }) => pentaBox).sort()).toEqual([1, 2, 3, 4, 5]);
          }
        }
      }
    });

    it("raden för vii° i C-dur har inga Penta-boxar", () => {
      expect(row({ root: C, scale: "major", tuning: STANDARD_TUNING }, 7)).toEqual(["–", "–", "–", "–", "–"]);
    });

    it("raden för vi – Am i C-dur är 2, 3, 4, 5, 1: A mollpentatonikens Box 1 börjar på A, som Box 5", () => {
      expect(row({ root: C, scale: "major", tuning: STANDARD_TUNING }, 6)).toEqual(["2", "3", "4", "5", "1"]);
    });
  });

  describe("Penta-fliken", () => {
    /** Banden per sträng (sträng 1 först) för Prickarna i ett lager. */
    function layerFrets(selection: FretboardSelection, layer: Dot["layer"]): number[][] {
      return [1, 2, 3, 4, 5, 6].map((string) =>
        dotsOn(selection, string)
          .filter((dot) => dot.layer === layer)
          .map((dot) => dot.fret),
      );
    }

    it("cell: ii – Dm i Box 2 av C-dur visar D mollpentatonikens Box 1 i Ackordets lager och Boxens övriga toner i Boxens", () => {
      const selection: FretboardSelection = { root: C, scale: "major", tab: "penta", chord: 2, box: 2, tuning: STANDARD_TUNING };

      expect(layerFrets(selection, "chord")).toEqual([[10, 13], [10, 13], [10, 12], [10, 12], [10, 12], [10, 13]]);
      expect(layerFrets(selection, "box")).toEqual([[12], [12], [9], [9], [], [12]]);
    });

    it("cell: Penta-boxen ritas i varje kopia av Boxen: i – Am i Box 4 av A mollpentatonik vid band 0–3 och 12–15", () => {
      const selection: FretboardSelection = { root: A, scale: "minorPentatonic", tab: "penta", chord: 1, box: 4, tuning: STANDARD_TUNING };

      expect(layerFrets(selection, "chord")[5]).toEqual([0, 3, 12, 15]);
      expect(layerFrets(selection, "box")).toEqual([[], [], [], [], [], []]);
    });

    it("radrubrik: iv – Dm i A mollpentatonik visar D mollpentatonik över hela halsen, också F utanför Skalan", () => {
      const selection: FretboardSelection = { root: A, scale: "minorPentatonic", tab: "penta", chord: 4, tuning: STANDARD_TUNING };
      const dots = dotsOn(selection, 6);

      // E-strängen: F 1, G 3, A 5, C 8, D 10, F 13, G 15
      expect(layerFrets(selection, "chord")[5]).toEqual([1, 3, 5, 8, 10, 13, 15]);
      expect(layerFrets(selection, "muted")[5]).toEqual([0, 12]);
      expect(dots.find((dot) => dot.fret === 1)?.label).toBe("♭6");
    });

    it("radrubrik med förminskat Ackord: ii° i A mollpentatonik visar Ackordets toner, som i CAGED-fliken", () => {
      const penta = fretboardView({ root: A, scale: "minorPentatonic", tab: "penta", chord: 2, tuning: STANDARD_TUNING });
      const caged = fretboardView({ root: A, scale: "minorPentatonic", chord: 2, tuning: STANDARD_TUNING });

      expect(penta.dots).toEqual(caged.dots);
    });

    it("cell med förminskat Ackord: ii° i Box 1 av A mollpentatonik visar Ackordets toner i Boxen, som i CAGED-fliken", () => {
      const penta = fretboardView({ root: A, scale: "minorPentatonic", tab: "penta", chord: 2, box: 1, tuning: STANDARD_TUNING });
      const caged = fretboardView({ root: A, scale: "minorPentatonic", chord: 2, box: 1, tuning: STANDARD_TUNING });

      expect(penta.dots).toEqual(caged.dots);
    });

    it("CAGED-formen släpps i Penta-fliken, och Fliken är CAGED om den saknas", () => {
      const penta = fretboardView({ root: C, scale: "major", tab: "penta", chord: 1, box: 1, caged: "E", tuning: STANDARD_TUNING });
      const missing = fretboardView({ root: C, scale: "major", chord: 1, box: 1, caged: "E", tuning: STANDARD_TUNING });

      expect(penta.selection.caged).toBeUndefined();
      expect(penta.selection.tab).toBe("penta");
      expect(penta.mutedStrings).toEqual([]);
      expect(missing.selection.caged).toBe("E");
      expect(missing.selection.tab).toBe("caged");
    });
  });

  describe("Treklangstabellen", () => {
    /** Omvändningarna i radens celler för Box 1–5. */
    function row(selection: FretboardSelection, degree: number): string[] {
      return fretboardView(selection).options.triadTable.find((candidate) => candidate.degree === degree)!.cells.map(({ inversion }) => inversion);
    }

    it("raden för I i C-dur på 3-2-1 är 3, 5, 5, R, R: närmaste Omvändning i varje Box", () => {
      // C på G-, H- och e-strängen: R vid band 5-5-3, 3 vid 9-8-8 och 5 vid 0-1-0 och 12-13-12.
      // Box 5 (band 4–8) har två toner av både R och 3, och då vinner det lägre bandet.
      expect(row({ root: C, scale: "major", tuning: STANDARD_TUNING }, 1)).toEqual(["3", "5", "5", "R", "R"]);
    });

    it("varje cell har en Omvändning, för alla Skalor, tonarter och Strängset, även förminskade Ackord", () => {
      for (const scale of ["major", "naturalMinor", "majorPentatonic", "minorPentatonic", "blues"] as const) {
        for (let root = 0; root < 12; root++) {
          for (const strings of STRING_SETS) {
            const { triadTable } = fretboardView({ root, scale, strings, tuning: STANDARD_TUNING }).options;
            expect(triadTable).toHaveLength(7);
            for (const { cells } of triadTable) {
              expect(cells.every(({ inversion }) => ["R", "3", "5"].includes(inversion))).toBe(true);
            }
          }
        }
      }
    });

    it("raden för vii° – H° i C-dur har Omvändningar", () => {
      expect(row({ root: C, scale: "major", tuning: STANDARD_TUNING }, 7)).toHaveLength(5);
    });
  });

  describe("Treklangsfliken", () => {
    /** Banden per sträng (sträng 1 först) för Prickarna i ett lager. */
    function layerFrets(selection: FretboardSelection, layer: Dot["layer"]): number[][] {
      return [1, 2, 3, 4, 5, 6].map((string) =>
        dotsOn(selection, string)
          .filter((dot) => dot.layer === layer)
          .map((dot) => dot.fret),
      );
    }

    const cMajor: FretboardSelection = { root: C, scale: "major", tab: "triads", chord: 1, tuning: STANDARD_TUNING };

    it("cell: I i Box 1 av C-dur på 3-2-1 visar första omvändningen (E-G-C vid band 9-8-8) i Ackordets lager", () => {
      expect(layerFrets({ ...cMajor, box: 1 }, "chord")).toEqual([[8], [8], [9], [], [], []]);
    });

    it("cell: Boxens övriga toner ligger i Boxens lager", () => {
      const box = layerFrets({ ...cMajor, box: 1 }, "box");
      const onlyBox = layerFrets({ root: C, scale: "major", tab: "triads", box: 1, tuning: STANDARD_TUNING }, "box");

      // Greppet ligger på band 8, 8 och 9 på sträng 1–3, och resten av Boxen är oförändrad
      expect(box).toEqual([
        onlyBox[0].filter((fret) => fret !== 8),
        onlyBox[1].filter((fret) => fret !== 8),
        onlyBox[2].filter((fret) => fret !== 9),
        ...onlyBox.slice(3),
      ]);
    });

    it("cell: Treklangsgreppet ritas i varje kopia av Boxen: andra omvändningen i Box 3 vid band 0-1-0 och 12-13-12", () => {
      expect(layerFrets({ ...cMajor, box: 3 }, "chord")).toEqual([[0, 12], [1, 13], [0, 12], [], [], []]);
    });

    it("cell: greppet sticker ut när inget ryms helt: grundläget i Box 5 (band 4–8) med G vid band 3", () => {
      expect(layerFrets({ ...cMajor, box: 5 }, "chord")).toEqual([[3], [5], [5], [], [], []]);
    });

    it("cell på 6-4-3: grundläget med mellantonen en oktav upp (C-G-E vid band 8-5-9), inget på A-strängen", () => {
      expect(layerFrets({ ...cMajor, box: 1, strings: "643" }, "chord")).toEqual([[], [], [9], [5], [], [8]]);
      expect(fretboardView({ ...cMajor, strings: "643" }).options.triadTable[0].cells[0].inversion).toBe("R");
    });

    it("cell med förminskat Ackord: vii° i C-dur har ett Treklangsgrepp med en ton per sträng", () => {
      const chordFrets = layerFrets({ ...cMajor, chord: 7, box: 1 }, "chord");

      expect(chordFrets.slice(0, 3).every((frets) => frets.length > 0)).toBe(true);
      expect(chordFrets.slice(3).every((frets) => frets.length === 0)).toBe(true);
    });

    it("radrubrik: I i C-dur visar alla Treklangsgrepp på 3-2-1 över hela halsen, och inget orange på andra strängar", () => {
      // R vid band 5-5-3, 3 vid 9-8-8 och 5 vid 0-1-0 och 12-13-12 (sträng 3-2-1)
      expect(layerFrets(cMajor, "chord")).toEqual([[0, 3, 8, 12], [1, 5, 8, 13], [0, 5, 9, 12], [], [], []]);
    });

    it("radrubrik: toner utanför Skalan syns, som H i ii° för A mollpentatonik på 3-2-1", () => {
      const selection: FretboardSelection = { root: A, scale: "minorPentatonic", tab: "triads", chord: 2, tuning: STANDARD_TUNING };
      const chordDots = fretboardView(selection).dots.filter((dot) => dot.layer === "chord" && dot.label === "2");

      expect(chordDots.map(({ string, fret }) => [string, fret])).toEqual(expect.arrayContaining([[1, 7], [2, 12], [3, 4]]));
    });

    it("radrubrik med förminskat Ackord: vii° i C-dur på 6-4-3 visar Treklangsgrepp bara på sträng 6, 4 och 3", () => {
      const chordFrets = layerFrets({ ...cMajor, chord: 7, strings: "643" }, "chord");

      expect([chordFrets[2], chordFrets[3], chordFrets[5]].every((frets) => frets.length > 0)).toBe(true);
      expect([chordFrets[0], chordFrets[1], chordFrets[4]]).toEqual([[], [], []]);
    });

    it("CAGED-formen släpps i Treklangsfliken, inga strängar dämpas, och Strängsetet är 3-2-1 om det saknas", () => {
      const view = fretboardView({ ...cMajor, box: 1, caged: "E" });

      expect(view.selection.caged).toBeUndefined();
      expect(view.selection.tab).toBe("triads");
      expect(view.selection.strings).toBe("321");
      expect(view.mutedStrings).toEqual([]);
      expect(fretboardView({ ...cMajor, strings: "642" as never }).selection.strings).toBe("321");
    });
  });

  describe("Intervallfliken", () => {
    /** Prickarna i Ackordets lager som [sträng, band]. */
    function pairPlaces(selection: FretboardSelection): number[][] {
      return fretboardView(selection)
        .dots.filter((dot) => dot.layer === "chord")
        .map(({ string, fret }) => [string, fret]);
    }

    const cMajorSixth: FretboardSelection = { root: C, scale: "major", tab: "intervals", interval: 6, box: 1, tuning: STANDARD_TUNING };

    it("cell: sext i Box 1 av C-dur börjar på lägsta Grundtonen, C (band 8) och A (band 7 på sträng 4)", () => {
      const view = fretboardView(cMajorSixth);

      expect(pairPlaces(cMajorSixth)).toEqual(expect.arrayContaining([[6, 8], [4, 7]]));
      expect(pairPlaces(cMajorSixth)).toHaveLength(2);
      expect(view.intervalPair).toEqual({ bass: "C", upper: "A", quality: "M6" });
      expect(view.selection.intervalStep).toBe(0);
    });

    it("cell: Boxens övriga toner ligger i Boxens lager", () => {
      const boxDots = fretboardView(cMajorSixth).dots.filter((dot) => dot.layer === "box");
      const onlyBox = fretboardView({ ...cMajorSixth, interval: undefined }).dots.filter((dot) => dot.layer === "box");

      expect(boxDots).toHaveLength(onlyBox.length - 2);
    });

    it("höger går ett skalsteg upp: D och H", () => {
      const selection = { ...cMajorSixth, intervalStep: 1 };

      expect(pairPlaces(selection)).toEqual(expect.arrayContaining([[6, 10], [4, 9]]));
      expect(fretboardView(selection).intervalPair).toEqual({ bass: "D", upper: "H", quality: "M6" });
    });

    it("Tonparet fortsätter in i nästa oktav, och det sista har Boxens högsta ton överst", () => {
      // Box 1 har 16 toner från C på sträng 6 till D på sträng 1, alltså 11 sexter
      expect(fretboardView({ ...cMajorSixth, intervalStep: 7 }).intervalPair).toEqual({ bass: "C", upper: "A", quality: "M6" });
      expect(pairPlaces({ ...cMajorSixth, intervalStep: 10 })).toEqual(expect.arrayContaining([[3, 10], [1, 10]]));
      expect(fretboardView({ ...cMajorSixth, intervalStep: 10 }).intervalPair).toEqual({ bass: "F", upper: "D", quality: "M6" });
    });

    it("stegen går runt: efter det sista kommer det första, och före det första det sista", () => {
      expect(fretboardView({ ...cMajorSixth, intervalStep: 11 }).selection.intervalStep).toBe(0);
      expect(fretboardView({ ...cMajorSixth, intervalStep: -1 }).selection.intervalStep).toBe(10);
    });

    it("vänster går under den lägsta Grundtonen, ner till Boxens lägsta baston: Box 2 i C-dur börjar på D", () => {
      // Box 2 har D E F G A H under C och 16 toner, alltså 11 sexter, varav 6 under Grundtonen
      const box2 = { ...cMajorSixth, box: 2 };

      expect(fretboardView(box2).intervalPair).toEqual({ bass: "C", upper: "A", quality: "M6" });
      expect(fretboardView({ ...box2, intervalStep: -1 }).intervalPair).toEqual({ bass: "H", upper: "G", quality: "m6" });
      expect(fretboardView({ ...box2, intervalStep: -6 }).intervalPair).toEqual({ bass: "D", upper: "H", quality: "M6" });
      expect(pairPlaces({ ...box2, intervalStep: -6 })).toEqual(expect.arrayContaining([[6, 10], [4, 9]]));
    });

    it("i Box 2 går stegen runt mellan Boxens lägsta och högsta Tonpar", () => {
      const box2 = { ...cMajorSixth, box: 2 };

      expect(fretboardView({ ...box2, intervalStep: -7 }).selection.intervalStep).toBe(4);
      expect(fretboardView({ ...box2, intervalStep: 5 }).selection.intervalStep).toBe(-6);
    });

    it("intervallets namn följer skalan: ters från E i C-dur är liten, kvarten från F är överstigande", () => {
      const third = { ...cMajorSixth, interval: 3 };

      expect(fretboardView({ ...third, intervalStep: 2 }).intervalPair).toEqual({ bass: "E", upper: "G", quality: "m3" });
      expect(fretboardView({ ...cMajorSixth, interval: 4, intervalStep: 3 }).intervalPair).toEqual({ bass: "F", upper: "H", quality: "A4" });
      expect(fretboardView({ ...cMajorSixth, interval: 8 }).intervalPair).toEqual({ bass: "C", upper: "C", quality: "P8" });
    });

    it("pentatonik räknas i Föräldraskalan: sekund i Box 1 av A mollpentatonik är A och H, och H syns bara i Tonparet", () => {
      const selection: FretboardSelection = { root: A, scale: "minorPentatonic", tab: "intervals", interval: 2, box: 1, tuning: STANDARD_TUNING };
      const view = fretboardView(selection);

      expect(pairPlaces(selection)).toEqual(expect.arrayContaining([[6, 5], [6, 7]]));
      expect(view.dots.filter((dot) => dot.label === "2").map(({ string, fret }) => [string, fret])).toEqual([[6, 7]]);
      expect(view.intervalPair).toEqual({ bass: "A", upper: "H", quality: "M2" });
    });

    it("Intervalltabellen har sekund till oktav som rader och intervallet från Grundtonen i varje cell", () => {
      const { intervalTable } = fretboardView({ root: A, scale: "naturalMinor", tuning: STANDARD_TUNING }).options;

      expect(intervalTable.map((row) => row.interval)).toEqual([2, 3, 4, 5, 6, 7, 8]);
      expect(intervalTable.map((row) => row.cells[0].quality)).toEqual(["M2", "m3", "P4", "P5", "m6", "m7", "P8"]);
      expect(intervalTable[0].cells.map((cell) => cell.box)).toEqual([1, 2, 3, 4, 5]);
    });

    it("utan Box visas inget Tonpar", () => {
      const view = fretboardView({ ...cMajorSixth, box: undefined });

      expect(view.intervalPair).toBeNull();
      expect(view.dots.every((dot) => dot.layer === "scale")).toBe(true);
    });

    it("Ackordet släpps i Intervallfliken, och Intervallet i de andra Flikarna", () => {
      expect(fretboardView({ ...cMajorSixth, chord: 2 }).selection.chord).toBeUndefined();
      const caged = fretboardView({ ...cMajorSixth, tab: "caged" });
      expect(caged.selection.interval).toBeUndefined();
      expect(caged.intervalPair).toBeNull();
      expect(fretboardView({ ...cMajorSixth, interval: 9 }).selection.interval).toBeUndefined();
    });
  });

  describe("Ackordets namn över Boxen", () => {
    const cMajor: FretboardSelection = { root: C, scale: "major", tuning: STANDARD_TUNING };

    it("ii – Dm i Box 2 av C-dur står över Boxens band 9–13", () => {
      expect(fretboardView({ ...cMajor, chord: 2, box: 2 }).chordLabels).toEqual([{ name: "Dm", low: 9, high: 13 }]);
    });

    it("står över varje kopia av Boxen: I i Box 3 vid band 0–3 och 12–15", () => {
      expect(fretboardView({ ...cMajor, chord: 1, box: 3 }).chordLabels).toEqual([
        { name: "C", low: 0, high: 3 },
        { name: "C", low: 12, high: 15 },
      ]);
    });

    it("förminskade Ackord har namn, i alla Flikar: vii° i C-dur heter H° i svenskt Notnamnsläge", () => {
      expect(fretboardView({ ...cMajor, chord: 7, box: 1, tab: "penta" }).chordLabels.map(({ name }) => name)).toEqual(["H°"]);
    });

    it("utan Box eller utan Ackord står inget namn", () => {
      expect(fretboardView({ ...cMajor, chord: 2 }).chordLabels).toEqual([]);
      expect(fretboardView({ ...cMajor, box: 2 }).chordLabels).toEqual([]);
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
