import { describe, expect, it } from "vitest";
import {
  type Chord,
  CIRCLE_OF_FIFTHS,
  chordName,
  circleLabel,
  clickedChord,
  sameChord,
  shownChord,
  stepInCircle,
} from "./chordProgressions";

const C = 0;
const major = (root: number): Chord => ({ root, quality: "major" });
const minor = (root: number): Chord => ({ root, quality: "minor" });

describe("Kvintcirkeln", () => {
  it("har tolv platser med två Ackord var, 24 sammanlagt", () => {
    expect(CIRCLE_OF_FIFTHS).toHaveLength(12);
    const all = CIRCLE_OF_FIFTHS.flatMap((place) => [place.major, place.minor]);
    expect(new Set(all.map((chord) => `${chord.root}${chord.quality}`)).size).toBe(24);
  });

  it("har C överst och durackorden i kvintordning medurs", () => {
    expect(CIRCLE_OF_FIFTHS.map((place) => chordName(place.major, "english"))).toEqual([
      "C", "G", "D", "A", "E", "B", "F♯", "D♭", "A♭", "E♭", "B♭", "F",
    ]);
  });

  it("har det parallella mollackordet innanför varje durackord", () => {
    expect(CIRCLE_OF_FIFTHS.map((place) => chordName(place.minor, "english"))).toEqual([
      "Am", "Em", "Bm", "F♯m", "C♯m", "G♯m", "E♭m", "B♭m", "Fm", "Cm", "Gm", "Dm",
    ]);
    for (const place of CIRCLE_OF_FIFTHS) {
      expect(place.minor.root).toBe((place.major.root + 9) % 12);
    }
  });

  it("skriver F♯/G♭ på F♯-platsen och annars Ackordets namn", () => {
    expect(circleLabel(CIRCLE_OF_FIFTHS[6].major, "english")).toBe("F♯/G♭");
    expect(circleLabel(CIRCLE_OF_FIFTHS[6].minor, "english")).toBe("E♭m");
    expect(circleLabel(CIRCLE_OF_FIFTHS[5].major, "swedish")).toBe("H");
  });
});

describe("ackordnamnen", () => {
  it("stavas fast per tonklass i engelskt Notnamnsläge", () => {
    const names = (quality: Chord["quality"]) =>
      Array.from({ length: 12 }, (_, root) => chordName({ root, quality }, "english"));
    expect(names("major")).toEqual(["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"]);
    expect(names("minor")).toEqual(["Cm", "C♯m", "Dm", "E♭m", "Em", "Fm", "F♯m", "Gm", "G♯m", "Am", "B♭m", "Bm"]);
  });

  it("heter H och B i svenskt Notnamnsläge där det engelska är B och B♭", () => {
    expect(chordName(major(10), "swedish")).toBe("B");
    expect(chordName(major(11), "swedish")).toBe("H");
    expect(chordName(minor(10), "swedish")).toBe("Bm");
    expect(chordName(minor(11), "swedish")).toBe("Hm");
    expect(chordName(major(C), "swedish")).toBe("C");
    expect(chordName(minor(8), "swedish")).toBe("G♯m");
  });
});

describe("markeringen", () => {
  it("visar det hovrade Ackordet om något hovras, annars det låsta", () => {
    expect(shownChord(major(C), minor(9))).toEqual(minor(9));
    expect(shownChord(major(C), null)).toEqual(major(C));
    expect(shownChord(null, null)).toBeNull();
  });

  it("ett klick låser Ackordet", () => {
    expect(clickedChord(null, major(7))).toEqual(major(7));
    expect(clickedChord(major(C), major(7))).toEqual(major(7));
  });

  it("ett klick på det låsta Ackordet eller utanför släpper låsningen", () => {
    expect(clickedChord(major(7), major(7))).toBeNull();
    expect(clickedChord(major(7), null)).toBeNull();
  });

  it("C-dur och C-moll är olika Ackord", () => {
    expect(sameChord(major(C), minor(C))).toBe(false);
    expect(sameChord(major(C), { root: 0, quality: "major" })).toBe(true);
    expect(sameChord(null, major(C))).toBe(false);
  });
});

describe("tangentbordet i Kvintcirkeln", () => {
  it("höger går medurs och vänster moturs i kvintordning, runt cirkeln", () => {
    expect(stepInCircle(major(C), "ArrowRight")).toEqual(major(7));
    expect(stepInCircle(major(C), "ArrowLeft")).toEqual(major(5));
    expect(stepInCircle(major(5), "ArrowRight")).toEqual(major(C));
    expect(stepInCircle(minor(9), "ArrowRight")).toEqual(minor(4));
  });

  it("upp går till durackordet och ner till mollackordet på samma plats", () => {
    expect(stepInCircle(major(7), "ArrowDown")).toEqual(minor(4));
    expect(stepInCircle(minor(4), "ArrowUp")).toEqual(major(7));
    expect(stepInCircle(major(7), "ArrowUp")).toEqual(major(7));
    expect(stepInCircle(minor(4), "ArrowDown")).toEqual(minor(4));
  });

  it("utan Ackord börjar det på C-dur", () => {
    expect(stepInCircle(null, "ArrowRight")).toEqual(major(C));
  });

  it("andra tangenter flyttar inte", () => {
    expect(stepInCircle(major(C), "a")).toBeNull();
  });
});
