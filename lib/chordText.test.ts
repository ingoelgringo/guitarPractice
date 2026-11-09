import { describe, expect, it } from "vitest";
import { chordSuggestions, opensChordText, parseChordText } from "./chordText";
import { type Extension, type Key, progressionChordName, type ProgressionChord, type ChordType } from "./progression";

const C = 0, D = 2, E = 4, F = 5, G = 7, A = 9, B = 11;
const cMajor: Key = { tonic: C, mode: "major" };

const chord = (root: number, type: ChordType, extensions: Extension[] = [], bass = root): ProgressionChord => ({
  root,
  type,
  extensions,
  bass,
});

describe("tolkningen av ackordtext", () => {
  const english = (text: string) => parseChordText(text, "english");
  const swedish = (text: string) => parseChordText(text, "swedish");

  it("läser grundton, ackordtyp, tillägg och Bas", () => {
    expect(english("F#m7/C")).toEqual(chord(6, "minor", ["7"], C));
    expect(english("Bbmaj7")).toEqual(chord(10, "major", ["maj7"]));
    expect(english("C")).toEqual(chord(C, "major"));
    expect(english("G/B")).toEqual(chord(G, "major", [], B));
  });

  it("följer Notnamnsläget: H är B och B är B♭ i svenskt läge", () => {
    expect(swedish("Hm")).toEqual(chord(B, "minor"));
    expect(swedish("B")).toEqual(chord(10, "major"));
    expect(swedish("G/H")).toEqual(chord(G, "major", [], B));
    expect(english("Hm")).toBeNull();
    expect(english("B")).toEqual(chord(B, "major"));
  });

  it("tar emot ♯ och ♭ lika väl som # och b, och små bokstäver", () => {
    expect(english("F♯m")).toEqual(chord(6, "minor"));
    expect(english("E♭")).toEqual(chord(3, "major"));
    expect(english("am")).toEqual(chord(A, "minor"));
    expect(english("bb")).toEqual(chord(10, "major"));
    expect(english(" Dm ")).toEqual(chord(D, "minor"));
  });

  it("läser ackordtyperna i flera skrivsätt", () => {
    expect(english("Cmin")).toEqual(chord(C, "minor"));
    expect(english("C-")).toEqual(chord(C, "minor"));
    expect(english("Bdim")).toEqual(chord(B, "diminished"));
    expect(english("B°")).toEqual(chord(B, "diminished"));
    expect(english("Caug")).toEqual(chord(C, "augmented"));
    expect(english("C+")).toEqual(chord(C, "augmented"));
    expect(english("Dsus2")).toEqual(chord(D, "sus2"));
    expect(english("Dsus4")).toEqual(chord(D, "sus4"));
    expect(english("Dsus")).toEqual(chord(D, "sus4"));
    expect(english("G7sus4")).toEqual(chord(G, "sus4", ["7"]));
  });

  it("läser tilläggen", () => {
    expect(english("G7")).toEqual(chord(G, "major", ["7"]));
    expect(english("D9")).toEqual(chord(D, "major", ["9"]));
    expect(english("Fmaj9")).toEqual(chord(F, "major", ["maj7", "9"]));
    expect(english("Dm11")).toEqual(chord(D, "minor", ["11"]));
    expect(english("C6/9")).toEqual(chord(C, "major", ["6", "9"]));
    expect(english("C69")).toEqual(chord(C, "major", ["6", "9"]));
    expect(english("Cadd9")).toEqual(chord(C, "major", ["add9"]));
    expect(english("Bm7b5")).toEqual(chord(B, "minor", ["7", "♭5"]));
    expect(english("E7#9")).toEqual(chord(E, "major", ["7", "♯9"]));
    expect(english("G7(b9,b13)")).toEqual(chord(G, "major", ["7", "♭9", "♭13"]));
    expect(english("Fmaj7#11")).toEqual(chord(F, "major", ["maj7", "♯11"]));
    expect(english("Ammaj7")).toEqual(chord(A, "minor", ["maj7"]));
    expect(english("C13")).toEqual(chord(C, "major", ["13"]));
  });

  it("läser tillbaka varje namn som ackordnamnet ger", () => {
    const chords = [
      chord(6, "minor", ["7"], C),
      chord(B, "diminished", ["7"]),
      chord(G, "sus4", ["7"], D),
      chord(D, "sus2", ["add9"]),
      chord(E, "major", ["7", "♯9"]),
      chord(C, "augmented", ["maj7"]),
      chord(C, "major", ["6", "9"]),
      chord(3, "minor", ["11"], 10),
      chord(C, "major", ["♭9"]),
      chord(C, "major", ["♯9"]),
      chord(C, "major", ["♭5"]),
      chord(G, "major", ["7", "♭9"]),
    ];
    for (const mode of ["english", "swedish"] as const) {
      for (const c of chords) expect(parseChordText(progressionChordName(c, cMajor, mode), mode), mode).toEqual(c);
    }
  });

  it("läser halvförminskat med och utan 7", () => {
    expect(english("Bø")).toEqual(chord(B, "minor", ["7", "♭5"]));
    expect(english("Bø7")).toEqual(chord(B, "minor", ["7", "♭5"]));
  });

  it("tar emot Bb som B i svenskt läge", () => {
    expect(swedish("Bbmaj7")).toEqual(chord(10, "major", ["maj7"]));
    expect(swedish("Hb")).toEqual(chord(10, "major"));
  });

  it("ger null för tillägg som inte går ihop", () => {
    for (const text of ["C7maj7", "C9add9", "C67"]) expect(english(text), text).toBeNull();
  });

  it("ger null för text som inte är ett ackord", () => {
    for (const text of ["", "X", "C7x", "Cmaj7/", "C/X", "Hm/", "7", "C77"]) expect(english(text), text).toBeNull();
  });
});

describe("förslagen", () => {
  const names = (text: string, key = cMajor, mode: "english" | "swedish" = "english") =>
    chordSuggestions(text, key, mode).map((c) => progressionChordName(c, key, mode));

  it("har tonartens ackord först", () => {
    expect(names("D").slice(0, 2)).toEqual(["Dm", "D"]);
    expect(names("B").slice(0, 3)).toEqual(["B°", "B", "B♭"]);
  });

  it("har bara ackord som börjar med texten", () => {
    for (const name of names("Am")) expect(name.startsWith("Am")).toBe(true);
    expect(names("Am")[0]).toBe("Am");
  });

  it("har det tolkade ackordet med när det inte redan finns bland förslagen", () => {
    expect(names("F#m7/C")).toEqual(["F♯m7/C"]);
  });

  it("följer Notnamnsläget", () => {
    expect(names("H", cMajor, "swedish")[0]).toBe("H°");
    expect(names("B", cMajor, "swedish")[0]).toBe("B");
  });

  it("är tomma för tom text", () => {
    expect(chordSuggestions("", cMajor, "english")).toEqual([]);
  });
});

describe("bokstäverna som öppnar ackordfältet", () => {
  it("följer Notnamnsläget", () => {
    expect([..."ABCDEFGH"].filter((letter) => opensChordText(letter, "english"))).toEqual([..."ABCDEFG"]);
    expect([..."ABCDEFGH"].filter((letter) => opensChordText(letter, "swedish"))).toEqual([..."ABCDEFGH"]);
    expect(opensChordText("h", "swedish")).toBe(true);
    expect(opensChordText("h", "english")).toBe(false);
    expect(opensChordText("x", "english")).toBe(false);
    expect(opensChordText("Enter", "english")).toBe(false);
  });
});
