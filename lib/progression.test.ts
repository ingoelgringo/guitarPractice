import { describe, expect, it } from "vitest";
import {
  addSection,
  CHORD_TYPES,
  type ChordType,
  chordTones,
  type Extension,
  type Key,
  type ProgressionChord,
  toggleExtension,
  addToForm,
  moveInForm,
  removeFromForm,
  removeSection,
  renameSection,
  sectionNameError,
  setSectionBars,
  chordAt,
  positionExists,
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
  SILENCE,
  shownChordAt,
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

/** En ny Ackordföljd med det givna på de givna platserna (Takt, Taktslag) i första Delen. */
function placed(...items: [bar: number, pulse: number, placement: Parameters<typeof placeChord>[2]][]): Progression {
  return items.reduce((p, [bar, pulse, placement]) => placeChord(p, at(p, bar, pulse), placement), newProgression());
}

describe("Tystnad", () => {
  it("placeras på ett Taktslag som ett Ackord och ersätter det som stod där", () => {
    const progression = placed([0, 0, triad(C, "major")], [0, 0, SILENCE]);
    expect(chordAt(progression, at(progression, 0, 0))).toBe(SILENCE);
    expect(progression.sections[0].chords).toHaveLength(1);
  });
});

describe("Ackordet som visas vid ett Taktslag", () => {
  it("är Ackordet som står där", () => {
    const progression = placed([1, 2, triad(E, "minor")]);
    expect(shownChordAt(progression, at(progression, 1, 2))).toEqual(triad(E, "minor"));
  });

  it("är Ackordet som klingar från ett tidigare Taktslag när Taktslaget är tomt", () => {
    const progression = placed([0, 0, triad(C, "major")], [1, 1, triad(A, "minor")]);
    expect(shownChordAt(progression, at(progression, 1, 0))).toEqual(triad(C, "major"));
    expect(shownChordAt(progression, at(progression, 3, 3))).toEqual(triad(A, "minor"));
  });

  it("är Tystnad efter en Tystnad, och inget före det första Ackordet", () => {
    const progression = placed([1, 0, triad(C, "major")], [2, 0, SILENCE]);
    expect(shownChordAt(progression, at(progression, 0, 3))).toBeNull();
    expect(shownChordAt(progression, at(progression, 2, 2))).toBe(SILENCE);
  });

  it("kan komma från en tidigare Del", () => {
    let progression = addSection(newProgression(), "Chorus");
    progression = placeChord(progression, at(progression, 3, 2), triad(G, "major"));
    const chorus = { section: progression.sections[1].id, bar: 0, pulse: 0 };
    expect(shownChordAt(progression, chorus)).toEqual(triad(G, "major"));
  });
});

describe("Taktslag som finns", () => {
  it("finns inte längre när Delen krymper, taktarten byts eller Delen tas bort", () => {
    const progression = newProgression();
    expect(positionExists(progression, at(progression, 3, 3))).toBe(true);
    expect(positionExists(setSectionBars(progression, progression.sections[0].id, 3), at(progression, 3, 0))).toBe(false);
    expect(positionExists(setTimeSignature(progression, "3/4"), at(progression, 0, 3))).toBe(false);
    expect(positionExists(progression, { section: "saknas", bar: 0, pulse: 0 })).toBe(false);
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

describe("Delar och Formen", () => {
  const verseAndChorus = (): Progression => addSection(newProgression(), "Chorus");
  const ids = (progression: Progression) => progression.sections.map((s) => s.id);
  const formNames = (progression: Progression) =>
    progression.form.map((id) => progression.sections.find((s) => s.id === id)?.name);

  it("får en ny Del på 4 Takter, sist bland Delarna och sist i Formen", () => {
    const progression = verseAndChorus();
    expect(progression.sections.map((s) => [s.name, s.bars])).toEqual([["Verse", 4], ["Chorus", 4]]);
    expect(formNames(progression)).toEqual(["Verse", "Chorus"]);
    expect(new Set(ids(progression)).size).toBe(2);
  });

  it("ger en ny Del ett unikt namn när namnet redan finns", () => {
    const progression = addSection(addSection(newProgression(), "Verse"), "Verse");
    expect(progression.sections.map((s) => s.name)).toEqual(["Verse", "Verse 2", "Verse 3"]);
  });

  it("byter namn på en Del bara till ett namn som inte är tomt och inte används av en annan Del", () => {
    const progression = verseAndChorus();
    const [verse, chorus] = ids(progression);
    expect(sectionNameError(progression, verse, "Chorus")).toBe("taken");
    expect(sectionNameError(progression, verse, " chorus ")).toBe("taken");
    expect(sectionNameError(progression, verse, "  ")).toBe("empty");
    expect(sectionNameError(progression, verse, "Verse")).toBeNull();
    expect(renameSection(progression, verse, "Chorus")).toBe(progression);
    expect(renameSection(progression, chorus, " Pre-chorus ").sections[1].name).toBe("Pre-chorus");
  });

  it("ändrar antalet Takter och tar bort Ackorden i de Takter som försvinner", () => {
    let progression = newProgression();
    progression = placeChord(progression, at(progression, 1, 0), triad(F, "major"));
    progression = placeChord(progression, at(progression, 2, 0), triad(G, "major"));
    progression = placeChord(progression, at(progression, 3, 2), triad(A, "minor"));
    const id = progression.sections[0].id;
    const shorter = setSectionBars(progression, id, 2);
    expect(shorter.sections[0].bars).toBe(2);
    expect(shorter.sections[0].chords.map((c) => c.chord)).toEqual([triad(F, "major")]);
    expect(setSectionBars(progression, id, 8).sections[0].chords).toHaveLength(3);
  });

  it("har mellan 1 och 64 Takter i en Del", () => {
    const progression = newProgression();
    const id = progression.sections[0].id;
    expect(setSectionBars(progression, id, 0).sections[0].bars).toBe(1);
    expect(setSectionBars(progression, id, 100).sections[0].bars).toBe(64);
    expect(setSectionBars(progression, id, 2.6).sections[0].bars).toBe(3);
    expect(setSectionBars(progression, id, Number.NaN)).toBe(progression);
  });

  it("tar bort en Del ur Formen när Delen tas bort, men den sista Delen finns kvar", () => {
    let progression = verseAndChorus();
    const [verse, chorus] = ids(progression);
    progression = addToForm(addToForm(progression, verse), chorus);
    expect(formNames(progression)).toEqual(["Verse", "Chorus", "Verse", "Chorus"]);
    const withoutVerse = removeSection(progression, verse);
    expect(withoutVerse.sections.map((s) => s.name)).toEqual(["Chorus"]);
    expect(formNames(withoutVerse)).toEqual(["Chorus", "Chorus"]);
    expect(removeSection(withoutVerse, chorus)).toBe(withoutVerse);
  });

  it("lägger till en Del i slutet av Formen och tar bort en plats i Formen", () => {
    let progression = verseAndChorus();
    const [verse] = ids(progression);
    progression = addToForm(progression, verse);
    expect(formNames(progression)).toEqual(["Verse", "Chorus", "Verse"]);
    expect(formNames(removeFromForm(progression, 0))).toEqual(["Chorus", "Verse"]);
    expect(addToForm(progression, "finns-inte")).toBe(progression);
  });

  it("flyttar en plats i Formen till en annan plats", () => {
    let progression = addSection(verseAndChorus(), "Bridge");
    const [verse] = ids(progression);
    progression = addToForm(progression, verse);
    expect(formNames(progression)).toEqual(["Verse", "Chorus", "Bridge", "Verse"]);
    expect(formNames(moveInForm(progression, 0, 2))).toEqual(["Chorus", "Bridge", "Verse", "Verse"]);
    expect(formNames(moveInForm(progression, 3, 1))).toEqual(["Verse", "Verse", "Chorus", "Bridge"]);
    expect(moveInForm(progression, 1, 1)).toBe(progression);
    expect(moveInForm(progression, 1, 9)).toBe(progression);
  });
});

describe("Ackord med ackordtyp och tillägg", () => {
  const chord = (root: number, type: ChordType, extensions: Extension[] = [], bass = root): ProgressionChord => ({
    root,
    type,
    extensions,
    bass,
  });
  const english = (c: ProgressionChord, key: Key = cMajor) => progressionChordName(c, key, "english");

  it("har namn för varje ackordtyp", () => {
    expect([...CHORD_TYPES].map((type) => english(chord(C, type)))).toEqual(["C", "Cm", "C°", "C+", "Csus2", "Csus4"]);
  });

  it("har namn med septimor, nonor och högre tillägg", () => {
    expect(english(chord(G, "major", ["7"]))).toBe("G7");
    expect(english(chord(C, "major", ["maj7"]))).toBe("Cmaj7");
    expect(english(chord(A, "minor", ["7"]))).toBe("Am7");
    expect(english(chord(A, "minor", ["maj7"]))).toBe("Ammaj7");
    expect(english(chord(D, "major", ["9"]))).toBe("D9");
    expect(english(chord(D, "major", ["7", "9"]))).toBe("D9");
    expect(english(chord(F, "major", ["maj7", "9"]))).toBe("Fmaj9");
    expect(english(chord(D, "minor", ["11"]))).toBe("Dm11");
    expect(english(chord(G, "major", ["13"]))).toBe("G13");
    expect(english(chord(C, "major", ["6"]))).toBe("C6");
    expect(english(chord(C, "major", ["6", "9"]))).toBe("C6/9");
    expect(english(chord(C, "major", ["add9"]))).toBe("Cadd9");
    expect(english(chord(B, "diminished", ["7"]))).toBe("B°7");
  });

  it("har namn med förändrade toner efter septimen", () => {
    expect(english(chord(B, "minor", ["7", "♭5"]))).toBe("Bm7♭5");
    expect(english(chord(E, "major", ["7", "♯9"]))).toBe("E7♯9");
    expect(english(chord(G, "major", ["7", "♭9", "♭13"]))).toBe("G7♭9♭13");
    expect(english(chord(F, "major", ["maj7", "♯11"]))).toBe("Fmaj7♯11");
  });

  it("skriver förändrade toner direkt efter grundtonen inom parentes, så att de inte läses som förtecken", () => {
    expect(english(chord(C, "major", ["♭9"]))).toBe("C(♭9)");
    expect(english(chord(C, "major", ["♭5"]))).toBe("C(♭5)");
    expect(english(chord(C, "minor", ["♭5"]))).toBe("Cm♭5");
  });

  it("skriver tilläggen i en fast ordning oavsett i vilken ordning de lades till", () => {
    expect(english(chord(G, "major", ["♭9", "7"]))).toBe("G7♭9");
  });

  it("har sus efter septimen", () => {
    expect(english(chord(G, "sus4", ["7"]))).toBe("G7sus4");
    expect(english(chord(D, "sus2", ["add9"]))).toBe("Dsus2add9");
  });

  it("stavas efter Tonarten och Notnamnsläget, även Basen", () => {
    const fSharpM7overC = chord(6, "minor", ["7"], C);
    expect(english(fSharpM7overC)).toBe("F♯m7/C");
    expect(progressionChordName(chord(10, "major", ["maj7"]), { tonic: F, mode: "major" }, "swedish")).toBe("Bmaj7");
    expect(progressionChordName(chord(B, "minor", ["7"], A), { tonic: D, mode: "major" }, "swedish")).toBe("Hm7/A");
    expect(progressionChordName(chord(G, "major", ["7"], B), cMajor, "swedish")).toBe("G7/H");
  });

  it("slås av och på ett i taget och behåller ackordtyp och Bas", () => {
    const g = chord(G, "major", [], B);
    const g7 = toggleExtension(g, "7");
    expect(g7).toEqual(chord(G, "major", ["7"], B));
    expect(toggleExtension(toggleExtension(g7, "♭9"), "7")).toEqual(chord(G, "major", ["♭9"], B));
    expect(toggleExtension(g7, "7")).toEqual(g);
  });

  it("byter ut ett tillägg som inte går ihop med det som slås på", () => {
    const c = chord(C, "major");
    expect(toggleExtension(toggleExtension(c, "7"), "maj7").extensions).toEqual(["maj7"]);
    expect(toggleExtension(toggleExtension(c, "6"), "7").extensions).toEqual(["7"]);
    expect(toggleExtension(toggleExtension(c, "9"), "add9").extensions).toEqual(["add9"]);
    expect(toggleExtension(toggleExtension(c, "13"), "6").extensions).toEqual(["6"]);
    expect(toggleExtension(toggleExtension(c, "6"), "9").extensions).toEqual(["6", "9"]);
    expect(toggleExtension(toggleExtension(c, "♭9"), "♯9").extensions).toEqual(["♭9", "♯9"]);
  });

  it("+ och − behåller tilläggen och Basen", () => {
    const am7b5overG = chord(A, "minor", ["7", "♭5"], G);
    expect(withQuality(am7b5overG, "major")).toEqual(chord(A, "major", ["7", "♭5"], G));
    expect(withQuality(chord(G, "sus4", ["7"], D), "minor")).toEqual(chord(G, "minor", ["7"], D));
  });

  it("har toner för ackordtypen och tilläggen", () => {
    const tones = (c: ProgressionChord) => [...chordTones(c)].sort((a, b) => a - b);
    expect(tones(chord(C, "major"))).toEqual([0, 4, 7]);
    expect(tones(chord(G, "major", ["7"]))).toEqual([2, 5, 7, 11]);
    expect(tones(chord(C, "major", ["maj7"]))).toEqual([0, 4, 7, 11]);
    expect(tones(chord(C, "major", ["9"]))).toEqual([0, 2, 4, 7, 10]);
    expect(tones(chord(C, "major", ["maj7", "9"]))).toEqual([0, 2, 4, 7, 11]);
    expect(tones(chord(C, "major", ["add9"]))).toEqual([0, 2, 4, 7]);
    expect(tones(chord(C, "major", ["6"]))).toEqual([0, 4, 7, 9]);
    expect(tones(chord(C, "diminished", ["7"]))).toEqual([0, 3, 6, 9]);
    expect(tones(chord(B, "minor", ["7", "♭5"]))).toEqual([2, 5, 9, 11]);
    expect(tones(chord(C, "major", ["7", "♭9", "♯9"]))).toEqual([0, 1, 3, 4, 7, 10]);
    expect(tones(chord(C, "major", ["13"]))).toEqual([0, 4, 7, 9, 10]);
    expect(tones(chord(C, "major", ["11"]))).toEqual([0, 4, 5, 7, 10]);
    expect(tones(chord(C, "major", ["7", "♯11", "♭13"]))).toEqual([0, 4, 6, 7, 8, 10]);
  });
});
