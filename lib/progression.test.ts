import { describe, expect, it } from "vitest";
import {
  chordAt,
  degreeChord,
  keyChords,
  move,
  newProgression,
  placeChord,
  type Position,
  type Progression,
  progressionChordName,
  pulsesPerBar,
  recentTaps,
  removeChord,
  setTempo,
  setTimeSignature,
  tapTempo,
  TIME_SIGNATURES,
  triad,
  withQuality,
} from "./progression";

const C = 0, D = 2, E = 4, F = 5, G = 7, A = 9, B = 11;
const cMajor = { tonic: C, mode: "major" } as const;
const aMinor = { tonic: A, mode: "minor" } as const;

const at = (progression: Progression, bar: number, pulse: number): Position => ({
  section: progression.sections[0].id,
  bar,
  pulse,
});

describe("en ny Ackordföljd", () => {
  it("är i C-dur och 4/4 med tempo 100 och en Del Verse på 4 Takter som är hela Formen", () => {
    const progression = newProgression();
    expect(progression.key).toEqual(cMajor);
    expect(progression.timeSignature).toBe("4/4");
    expect(progression.tempo).toBe(100);
    expect(progression.sections).toHaveLength(1);
    expect(progression.sections[0]).toMatchObject({ name: "Verse", bars: 4, chords: [] });
    expect(progression.form).toEqual([progression.sections[0].id]);
  });
});

describe("Taktslag", () => {
  it("finns det fyra av i 4/4, tre i 3/4, två i 2/4, sex i 6/8 och tolv i 12/8", () => {
    expect(TIME_SIGNATURES.map(pulsesPerBar)).toEqual([4, 3, 2, 6, 12]);
    expect(TIME_SIGNATURES).toEqual(["4/4", "3/4", "2/4", "6/8", "12/8"]);
  });
});

describe("tonartens ackord", () => {
  it("är de sju treklangerna med steg i dur", () => {
    expect(keyChords(cMajor).map(({ degree, chord }) => `${degree} ${progressionChordName(chord, cMajor, "english")}`)).toEqual([
      "I C", "ii Dm", "iii Em", "IV F", "V G", "vi Am", "vii° B°",
    ]);
  });

  it("är de sju treklangerna i naturlig moll, med dur-V efter v", () => {
    expect(keyChords(aMinor).map(({ degree, chord }) => `${degree} ${progressionChordName(chord, aMinor, "english")}`)).toEqual([
      "i Am", "ii° B°", "III C", "iv Dm", "v Em", "V E", "VI F", "VII G",
    ]);
  });

  it("stavas efter Tonarten", () => {
    const fMajor = { tonic: F, mode: "major" } as const;
    expect(keyChords(fMajor).map(({ chord }) => progressionChordName(chord, fMajor, "english"))).toEqual([
      "F", "Gm", "Am", "B♭", "C", "Dm", "E°",
    ]);
    const eMajor = { tonic: E, mode: "major" } as const;
    expect(keyChords(eMajor).map(({ chord }) => progressionChordName(chord, eMajor, "english"))).toEqual([
      "E", "F♯m", "G♯m", "A", "B", "C♯m", "D♯°",
    ]);
  });

  it("stavas med H och B i svenskt Notnamnsläge", () => {
    const fMajor = { tonic: F, mode: "major" } as const;
    expect(progressionChordName(triad(10, "major"), fMajor, "swedish")).toBe("B");
    expect(progressionChordName(triad(B, "diminished"), cMajor, "swedish")).toBe("H°");
    expect(progressionChordName(triad(B, "minor"), { tonic: D, mode: "major" }, "swedish")).toBe("Hm");
  });

  it("utanför Tonarten stavas som sänkta steg, utom den överstigande kvarten", () => {
    expect(progressionChordName(triad(10, "major"), cMajor, "english")).toBe("B♭");
    expect(progressionChordName(triad(3, "major"), cMajor, "english")).toBe("E♭");
    expect(progressionChordName(triad(8, "major"), cMajor, "english")).toBe("A♭");
    expect(progressionChordName(triad(6, "minor"), cMajor, "english")).toBe("F♯m");
    expect(progressionChordName(triad(10, "major"), { tonic: G, mode: "major" }, "english")).toBe("B♭");
  });

  it("i moll stavas den höjda sexten och sjunden med ♯", () => {
    expect(progressionChordName(triad(6, "minor"), aMinor, "english")).toBe("F♯m");
    expect(progressionChordName(triad(8, "diminished"), aMinor, "english")).toBe("G♯°");
  });

  it("har ett namn med Bas när Basen inte är grundtonen", () => {
    expect(progressionChordName({ ...triad(G, "major"), bass: B }, cMajor, "english")).toBe("G/B");
    expect(progressionChordName({ ...triad(G, "major"), bass: B }, cMajor, "swedish")).toBe("G/H");
  });

  it("väljs med siffrorna 1–7 som stegen i skalan", () => {
    expect(degreeChord(cMajor, 1)).toEqual(triad(C, "major"));
    expect(degreeChord(cMajor, 2)).toEqual(triad(D, "minor"));
    expect(degreeChord(cMajor, 7)).toEqual(triad(B, "diminished"));
    expect(degreeChord(aMinor, 5)).toEqual(triad(E, "minor"));
    expect(degreeChord(aMinor, 3)).toEqual(triad(C, "major"));
  });
});

describe("Ackord på Taktslag", () => {
  it("placeras, ersätts och tas bort", () => {
    let progression = newProgression();
    progression = placeChord(progression, at(progression, 1, 2), triad(G, "major"));
    expect(chordAt(progression, at(progression, 1, 2))).toEqual(triad(G, "major"));
    progression = placeChord(progression, at(progression, 1, 2), triad(A, "minor"));
    expect(chordAt(progression, at(progression, 1, 2))).toEqual(triad(A, "minor"));
    expect(progression.sections[0].chords).toHaveLength(1);
    progression = removeChord(progression, at(progression, 1, 2));
    expect(chordAt(progression, at(progression, 1, 2))).toBeNull();
  });

  it("ändrar inte den Ackordföljd de placeras i", () => {
    const progression = newProgression();
    placeChord(progression, at(progression, 0, 0), triad(C, "major"));
    expect(progression.sections[0].chords).toEqual([]);
  });

  it("blir dur med + och moll med −, med tillägg och Bas kvar", () => {
    const am7overG = { root: A, type: "minor", extensions: ["7"], bass: G } as const;
    expect(withQuality(am7overG, "major")).toEqual({ root: A, type: "major", extensions: ["7"], bass: G });
    expect(withQuality(triad(B, "diminished"), "minor")).toEqual(triad(B, "minor"));
    expect(withQuality(triad(C, "major"), "major")).toEqual(triad(C, "major"));
  });
});

describe("taktarten", () => {
  it("tar bort Ackord på Taktslag som inte längre finns", () => {
    let progression = newProgression();
    progression = placeChord(progression, at(progression, 0, 0), triad(C, "major"));
    progression = placeChord(progression, at(progression, 0, 3), triad(G, "major"));
    progression = setTimeSignature(progression, "3/4");
    expect(progression.timeSignature).toBe("3/4");
    expect(progression.sections[0].chords.map(({ pulse }) => pulse)).toEqual([0]);
  });
});

describe("tempot", () => {
  it("hålls mellan 40 och 240 bpm och avrundas", () => {
    const progression = newProgression();
    expect(setTempo(progression, 20).tempo).toBe(40);
    expect(setTempo(progression, 300).tempo).toBe(240);
    expect(setTempo(progression, 120.4).tempo).toBe(120);
    expect(setTempo(progression, Number.NaN).tempo).toBe(100);
  });

  it("trycks in med medelvärdet av de senaste slagen", () => {
    expect(tapTempo([0])).toBeNull();
    expect(tapTempo([0, 500, 1000, 1500])).toBe(120);
    expect(tapTempo([0, 600, 1200])).toBe(100);
  });

  it("räknas från början om det var mer än två sekunder sedan förra slaget", () => {
    expect(tapTempo([0, 500, 4000])).toBeNull();
    expect(tapTempo([0, 500, 4000, 4750])).toBe(80);
  });

  it("sparar bara de senaste trycken efter det senaste uppehållet", () => {
    expect(recentTaps([], 1000)).toEqual([1000]);
    expect(recentTaps([0, 500], 1000)).toEqual([0, 500, 1000]);
    expect(recentTaps([0, 500], 5000)).toEqual([5000]);
    expect(recentTaps([0, 1, 2, 3, 4, 5], 6)).toEqual([2, 3, 4, 5, 6]);
  });

  it("hålls inom gränserna även när man trycker in det", () => {
    expect(tapTempo([0, 100, 200])).toBe(240);
    expect(tapTempo([0, 1900, 3800])).toBe(40);
  });
});

describe("förflyttningen", () => {
  const two = (): Progression => {
    const progression = newProgression();
    return {
      ...progression,
      sections: [...progression.sections, { id: "chorus", name: "Chorus", bars: 2, chords: [] }],
      form: [...progression.form, "chorus"],
    };
  };

  it("går en Takt med ←/→ till Taktens första Taktslag", () => {
    const progression = newProgression();
    expect(move(progression, at(progression, 1, 2), { key: "ArrowRight", altKey: false })).toEqual(at(progression, 2, 0));
    expect(move(progression, at(progression, 1, 2), { key: "ArrowLeft", altKey: false })).toEqual(at(progression, 0, 0));
  });

  it("går ett Taktslag med Alt+←/→, över taktstrecken", () => {
    const progression = newProgression();
    expect(move(progression, at(progression, 0, 3), { key: "ArrowRight", altKey: true })).toEqual(at(progression, 1, 0));
    expect(move(progression, at(progression, 1, 0), { key: "ArrowLeft", altKey: true })).toEqual(at(progression, 0, 3));
    expect(move(progression, at(progression, 1, 1), { key: "ArrowLeft", altKey: true })).toEqual(at(progression, 1, 0));
  });

  it("stannar vid början och slutet", () => {
    const progression = newProgression();
    expect(move(progression, at(progression, 0, 0), { key: "ArrowLeft", altKey: true })).toEqual(at(progression, 0, 0));
    expect(move(progression, at(progression, 3, 3), { key: "ArrowRight", altKey: true })).toEqual(at(progression, 3, 3));
    expect(move(progression, at(progression, 3, 1), { key: "ArrowRight", altKey: false })).toEqual(at(progression, 3, 1));
  });

  it("går över gränsen mellan Delar", () => {
    const progression = two();
    expect(move(progression, at(progression, 3, 3), { key: "ArrowRight", altKey: true })).toEqual({ section: "chorus", bar: 0, pulse: 0 });
    expect(move(progression, at(progression, 3, 1), { key: "ArrowRight", altKey: false })).toEqual({ section: "chorus", bar: 0, pulse: 0 });
    expect(move(progression, { section: "chorus", bar: 0, pulse: 0 }, { key: "ArrowLeft", altKey: true })).toEqual(at(progression, 3, 3));
    expect(move(progression, { section: "chorus", bar: 0, pulse: 2 }, { key: "ArrowLeft", altKey: false })).toEqual(at(progression, 3, 0));
  });

  it("byter Del med ↑/↓ och behåller Takt och Taktslag när de finns", () => {
    const progression = two();
    expect(move(progression, at(progression, 1, 2), { key: "ArrowDown", altKey: false })).toEqual({ section: "chorus", bar: 1, pulse: 2 });
    expect(move(progression, at(progression, 3, 2), { key: "ArrowDown", altKey: false })).toEqual({ section: "chorus", bar: 1, pulse: 2 });
    expect(move(progression, { section: "chorus", bar: 0, pulse: 1 }, { key: "ArrowUp", altKey: false })).toEqual(at(progression, 0, 1));
    expect(move(progression, at(progression, 0, 1), { key: "ArrowUp", altKey: false })).toEqual(at(progression, 0, 1));
  });

  it("ger null för andra tangenter", () => {
    const progression = newProgression();
    expect(move(progression, at(progression, 0, 0), { key: "a", altKey: false })).toBeNull();
  });
});
