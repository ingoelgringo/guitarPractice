import { describe, expect, it } from "vitest";
import { STANDARD_TUNING } from "./score";
import {
  coursePitches,
  displayCourses,
  findTuningPreset,
  noteName,
  STANDARD_TUNING_NAME,
  STRING_INSTRUMENTS,
  stringInstrument,
  TUNING_PRESETS,
  type StringInstrumentId,
} from "./tuning";

/** Den färdiga stämningen `tuningName` för Stränginstrumentet `id`. */
function preset(id: StringInstrumentId, tuningName: string): readonly number[] {
  const found = stringInstrument(id).tunings.find((t) => t.name === tuningName);
  if (!found) throw new Error(`Ingen stämning ${tuningName} för ${id}`);
  return found.tuning;
}

/** Stämningens tonnamn, sträng (eller Strängpar) 1 först. */
function names(id: StringInstrumentId, tuningName: string): string[] {
  return preset(id, tuningName).map(noteName);
}

describe("Stränginstrumenten", () => {
  it("är de sju i specen, i ordning", () => {
    expect(STRING_INSTRUMENTS.map((i) => i.id)).toEqual([
      "guitar6",
      "guitar7",
      "guitar12",
      "bass4",
      "bass5",
      "ukulele",
      "mandolin",
    ]);
  });

  it("har lika många strängar eller Strängpar i varje stämning som instrumentet har", () => {
    for (const instrument of STRING_INSTRUMENTS) {
      expect(instrument.tunings.length).toBeGreaterThan(0);
      for (const preset of instrument.tunings) {
        expect(preset.tuning, `${instrument.id} ${preset.name}`).toHaveLength(instrument.courses.length);
      }
    }
  });

  it("har unika namn på stämningarna inom ett instrument", () => {
    for (const instrument of STRING_INSTRUMENTS) {
      const tuningNames = instrument.tunings.map((t) => t.name);
      expect(new Set(tuningNames).size).toBe(tuningNames.length);
    }
  });

  it("har enkla strängar utom på 12-strängad gitarr och mandolin", () => {
    for (const id of ["guitar6", "guitar7", "bass4", "bass5", "ukulele"] as const) {
      expect(stringInstrument(id).courses.every((kind) => kind === "single")).toBe(true);
    }
    expect(stringInstrument("guitar12").courses).toEqual(["unison", "unison", "octave", "octave", "octave", "octave"]);
    expect(stringInstrument("mandolin").courses).toEqual(["unison", "unison", "unison", "unison"]);
  });
});

describe("Strängpar", () => {
  it("stäms som en sträng när paret har samma ton", () => {
    expect(coursePitches("single", 40)).toEqual([40]);
    expect(coursePitches("unison", 55)).toEqual([55]);
  });

  it("stäms som två strängar när paret har en oktavsträng", () => {
    expect(coursePitches("octave", 40)).toEqual([40, 52]);
  });
});

describe("De färdiga stämningarna", () => {
  it("för gitarr 6", () => {
    expect(stringInstrument("guitar6").tunings.map((t) => t.name)).toEqual([
      STANDARD_TUNING_NAME,
      "Eb standard",
      "D standard",
      "Drop D",
      "Drop C#",
      "Drop C",
      "DADGAD",
      "Open D",
      "Open E",
      "Open G",
      "Open C",
    ]);
    expect(names("guitar6", STANDARD_TUNING_NAME)).toEqual(["E4", "B3", "G3", "D3", "A2", "E2"]);
    expect(names("guitar6", "Eb standard")).toEqual(["D#4", "A#3", "F#3", "C#3", "G#2", "D#2"]);
    expect(names("guitar6", "D standard")).toEqual(["D4", "A3", "F3", "C3", "G2", "D2"]);
    expect(names("guitar6", "Drop D")).toEqual(["E4", "B3", "G3", "D3", "A2", "D2"]);
    expect(names("guitar6", "Drop C#")).toEqual(["D#4", "A#3", "F#3", "C#3", "G#2", "C#2"]);
    expect(names("guitar6", "Drop C")).toEqual(["D4", "A3", "F3", "C3", "G2", "C2"]);
    expect(names("guitar6", "DADGAD")).toEqual(["D4", "A3", "G3", "D3", "A2", "D2"]);
    expect(names("guitar6", "Open D")).toEqual(["D4", "A3", "F#3", "D3", "A2", "D2"]);
    expect(names("guitar6", "Open E")).toEqual(["E4", "B3", "G#3", "E3", "B2", "E2"]);
    expect(names("guitar6", "Open G")).toEqual(["D4", "B3", "G3", "D3", "G2", "D2"]);
    expect(names("guitar6", "Open C")).toEqual(["E4", "C4", "G3", "C3", "G2", "C2"]);
  });

  it("för gitarr 7", () => {
    expect(stringInstrument("guitar7").tunings.map((t) => t.name)).toEqual(["Standard", "Drop A"]);
    expect(names("guitar7", "Standard")).toEqual(["E4", "B3", "G3", "D3", "A2", "E2", "B1"]);
    expect(names("guitar7", "Drop A")).toEqual(["E4", "B3", "G3", "D3", "A2", "E2", "A1"]);
  });

  it("för gitarr 12, med grundtonen i varje Strängpar", () => {
    expect(stringInstrument("guitar12").tunings.map((t) => t.name)).toEqual(["Standard"]);
    expect(names("guitar12", "Standard")).toEqual(["E4", "B3", "G3", "D3", "A2", "E2"]);
  });

  it("för bas 4 och bas 5", () => {
    expect(stringInstrument("bass4").tunings.map((t) => t.name)).toEqual(["Standard", "Drop D", "Eb standard"]);
    expect(names("bass4", "Standard")).toEqual(["G2", "D2", "A1", "E1"]);
    expect(names("bass4", "Drop D")).toEqual(["G2", "D2", "A1", "D1"]);
    expect(names("bass4", "Eb standard")).toEqual(["F#2", "C#2", "G#1", "D#1"]);
    expect(stringInstrument("bass5").tunings.map((t) => t.name)).toEqual(["Standard"]);
    expect(names("bass5", "Standard")).toEqual(["G2", "D2", "A1", "E1", "B0"]);
  });

  it("för ukulele, med hög G i standardstämningen", () => {
    expect(stringInstrument("ukulele").tunings.map((t) => t.name)).toEqual(["Standard", "Low G", "Baritone"]);
    expect(names("ukulele", "Standard")).toEqual(["A4", "E4", "C4", "G4"]);
    expect(names("ukulele", "Low G")).toEqual(["A4", "E4", "C4", "G3"]);
    expect(names("ukulele", "Baritone")).toEqual(["E4", "B3", "G3", "D3"]);
  });

  it("för mandolin", () => {
    expect(stringInstrument("mandolin").tunings.map((t) => t.name)).toEqual(["Standard"]);
    expect(names("mandolin", "Standard")).toEqual(["E5", "A4", "D4", "G3"]);
  });
});

describe("Visningen av strängarna", () => {
  function shown(id: StringInstrumentId, tuningName: string) {
    return displayCourses(stringInstrument(id), preset(id, tuningName)).map((c) => ({
      course: c.course,
      noteNames: c.pitches.map(noteName),
    }));
  }

  it("går från den grövsta strängen till den ljusaste, som i EADGBE", () => {
    expect(shown("guitar6", STANDARD_TUNING_NAME)).toEqual([
      { course: 6, noteNames: ["E2"] },
      { course: 5, noteNames: ["A2"] },
      { course: 4, noteNames: ["D3"] },
      { course: 3, noteNames: ["G3"] },
      { course: 2, noteNames: ["B3"] },
      { course: 1, noteNames: ["E4"] },
    ]);
  });

  it("följer strängarna och inte tonhöjden för ukulele med hög G: GCEA", () => {
    expect(shown("ukulele", "Standard").map((c) => c.noteNames[0])).toEqual(["G4", "C4", "E4", "A4"]);
    expect(shown("ukulele", "Standard").map((c) => c.course)).toEqual([4, 3, 2, 1]);
  });

  it("visar ett par med oktavsträng som två tonnamn i en grupp och ett par med samma ton som en", () => {
    expect(shown("guitar12", "Standard")).toEqual([
      { course: 6, noteNames: ["E2", "E3"] },
      { course: 5, noteNames: ["A2", "A3"] },
      { course: 4, noteNames: ["D3", "D4"] },
      { course: 3, noteNames: ["G3", "G4"] },
      { course: 2, noteNames: ["B3"] },
      { course: 1, noteNames: ["E4"] },
    ]);
    expect(shown("mandolin", "Standard").map((c) => c.noteNames)).toEqual([["G3"], ["D4"], ["A4"], ["E5"]]);
  });
});

describe("Tabbeditorns stämningar", () => {
  it("är den utbyggda listan för gitarr 6", () => {
    expect(TUNING_PRESETS).toEqual(stringInstrument("guitar6").tunings);
    expect(TUNING_PRESETS[0]).toEqual({ name: STANDARD_TUNING_NAME, tuning: STANDARD_TUNING });
  });

  it("hittar förvalet för befintliga partitur och inget för en egen Stämning", () => {
    expect(findTuningPreset(STANDARD_TUNING)?.name).toBe(STANDARD_TUNING_NAME);
    expect(findTuningPreset([64, 59, 55, 50, 45, 38])?.name).toBe("Drop D");
    expect(findTuningPreset([62, 57, 55, 50, 45, 38])?.name).toBe("DADGAD");
    expect(findTuningPreset([62, 57, 55, 50, 45, 40])).toBeUndefined();
    expect(findTuningPreset([64, 59, 55, 50, 45])).toBeUndefined();
  });
});
