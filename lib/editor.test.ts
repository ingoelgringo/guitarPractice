import { describe, expect, it } from "vitest";
import { apply, createEditor, TWO_DIGIT_WINDOW_MS, type Command, type EditorState } from "./editor";

describe("Editor", () => {
  it("startar med ett tomt Partitur: ett Spår för 6-strängad gitarr i standardstämning med en Takt", () => {
    const { score, cursor } = createEditor();

    expect(score.tracks).toHaveLength(1);
    // MIDI-tonhöjd per lös sträng, sträng 1 (ljusa e) först
    expect(score.tracks[0].tuning).toEqual([64, 59, 55, 50, 45, 40]);
    expect(score.tracks[0].bars).toHaveLength(1);
    expect(score.timeSignature).toEqual({ beats: 4, beatValue: 4 });
    expect(cursor).toEqual({ track: 0, bar: 0, beat: 0, string: 1 });
  });

  it("att skriva ett band lägger in en fjärdedel på markörens sträng", () => {
    const state = apply(createEditor(), { type: "enterFret", fret: 5 });

    expect(state.score.tracks[0].bars[0].beats).toEqual([
      { duration: 4, notes: [{ string: 1, fret: 5 }] },
    ]);
  });

  it("markören flyttas nedåt mot grövre strängar och uppåt mot ljusare", () => {
    const state = run(createEditor(), [
      { type: "moveCursor", direction: "down" },
      { type: "moveCursor", direction: "down" },
      { type: "moveCursor", direction: "up" },
    ]);

    expect(state.cursor.string).toBe(2);
  });

  it("markören stannar på sträng 1 och sträng 6", () => {
    const up = apply(createEditor(), { type: "moveCursor", direction: "up" });
    const down = run(
      createEditor(),
      Array.from({ length: 8 }, () => ({ type: "moveCursor", direction: "down" }) as const),
    );

    expect(up.cursor.string).toBe(1);
    expect(down.cursor.string).toBe(6);
  });

  it("höger efter sista slaget skapar ett nytt slag, så att man kan skriva en melodi", () => {
    const state = run(createEditor(), [
      { type: "enterFret", fret: 5 },
      { type: "moveCursor", direction: "right" },
      { type: "moveCursor", direction: "down" },
      { type: "enterFret", fret: 7 },
    ]);

    expect(state.score.tracks[0].bars[0].beats).toEqual([
      { duration: 4, notes: [{ string: 1, fret: 5 }] },
      { duration: 4, notes: [{ string: 2, fret: 7 }] },
    ]);
    expect(state.cursor.beat).toBe(1);
  });

  it("höger på ett tomt sista slag skapar inga fler tomma slag", () => {
    const state = run(createEditor(), [
      { type: "moveCursor", direction: "right" },
      { type: "moveCursor", direction: "right" },
    ]);

    expect(state.score.tracks[0].bars[0].beats).toHaveLength(1);
    expect(state.cursor.beat).toBe(0);
  });

  it("vänster och höger flyttar markören mellan befintliga slag och stannar vid början", () => {
    const state = run(createEditor(), [
      { type: "enterFret", fret: 1 },
      { type: "moveCursor", direction: "right" },
      { type: "enterFret", fret: 2 },
      { type: "moveCursor", direction: "left" },
      { type: "moveCursor", direction: "left" },
      { type: "enterFret", fret: 9 },
    ]);

    expect(state.score.tracks[0].bars[0].beats.map((b) => b.notes[0].fret)).toEqual([9, 2]);
    expect(state.cursor.beat).toBe(0);
  });

  describe("Notvärde, punktering och triol", () => {
    it("att sätta Notvärde ändrar slaget under markören", () => {
      const state = run(createEditor(), [
        { type: "enterFret", fret: 3 },
        { type: "setDuration", duration: 8 },
      ]);

      expect(beatsOf(state)).toEqual([{ duration: 8, notes: [{ string: 1, fret: 3 }] }]);
    });

    it("nya slag får samma Notvärde som slaget före", () => {
      const state = run(createEditor(), [
        { type: "setDuration", duration: 16 },
        { type: "enterFret", fret: 3 },
        { type: "moveCursor", direction: "right" },
        { type: "enterFret", fret: 5 },
      ]);

      expect(beatsOf(state).map((b) => b.duration)).toEqual([16, 16]);
    });

    it("punktering växlas av och på", () => {
      const on = run(createEditor(), [{ type: "toggleDot" }]);
      const off = run(on, [{ type: "toggleDot" }]);

      expect(beatsOf(on)[0].dotted).toBe(true);
      expect(beatsOf(off)[0].dotted).toBeFalsy();
    });

    it("triol växlas av och på", () => {
      const on = run(createEditor(), [{ type: "toggleTriplet" }]);
      const off = run(on, [{ type: "toggleTriplet" }]);

      expect(beatsOf(on)[0].triplet).toBe(true);
      expect(beatsOf(off)[0].triplet).toBeFalsy();
    });

    it("punktering och triol behålls när Notvärdet byts och följer med till nya slag", () => {
      const state = run(createEditor(), [
        { type: "toggleDot" },
        { type: "toggleTriplet" },
        { type: "setDuration", duration: 8 },
        { type: "enterFret", fret: 0 },
        { type: "moveCursor", direction: "right" },
      ]);

      expect(beatsOf(state)[1]).toEqual({ duration: 8, dotted: true, triplet: true, notes: [] });
    });
  });

  describe("Takter fylls", () => {
    it("när Takten är full skapar höger en ny Takt i stället för ett nytt slag", () => {
      const state = run(createEditor(), [...quarters(4), { type: "moveCursor", direction: "right" }]);

      expect(state.score.tracks[0].bars).toHaveLength(2);
      expect(beatsOf(state, 0)).toHaveLength(4);
      expect(beatsOf(state, 1)).toEqual([{ duration: 4, notes: [] }]);
      expect(state.cursor).toMatchObject({ bar: 1, beat: 0 });
    });

    it("en Takt räknas som full utifrån Notvärdena, även punkterade och trioler", () => {
      // punkterad halvnot + åttondelstriol × 3 = 3 + 1 fjärdedelar = full 4/4-Takt
      const state = run(createEditor(), [
        { type: "setDuration", duration: 2 },
        { type: "toggleDot" },
        { type: "enterFret", fret: 0 },
        { type: "moveCursor", direction: "right" },
        { type: "setDuration", duration: 8 },
        { type: "toggleTriplet" },
        ...Array.from({ length: 3 }, () => [
          { type: "enterFret", fret: 2 } as const,
          { type: "moveCursor", direction: "right" } as const,
        ]).flat(),
      ]);

      expect(beatsOf(state, 0)).toHaveLength(4);
      expect(state.cursor).toMatchObject({ bar: 1, beat: 0 });
    });

    it("höger och vänster går mellan Takter utan att skapa nya när nästa Takt redan finns", () => {
      const filled = run(createEditor(), [...quarters(4), { type: "moveCursor", direction: "right" }]);
      const back = run(filled, [{ type: "moveCursor", direction: "left" }]);
      const forward = run(back, [{ type: "moveCursor", direction: "right" }]);

      expect(back.cursor).toMatchObject({ bar: 0, beat: 3 });
      expect(forward.cursor).toMatchObject({ bar: 1, beat: 0 });
      expect(forward.score.tracks[0].bars).toHaveLength(2);
    });

    it("när Notvärdet inte får plats får det nya slaget det längsta Notvärde som ryms, så att Takten inte blir för lång", () => {
      // punkterad halvnot + ännu en punkterad halvnot skulle ge 6/4; det ryms en fjärdedel
      const state = run(createEditor(), [
        { type: "setDuration", duration: 2 },
        { type: "toggleDot" },
        { type: "enterFret", fret: 0 },
        { type: "moveCursor", direction: "right" },
      ]);

      expect(beatsOf(state, 0)[1]).toEqual({ duration: 4, notes: [] });
      expect(state.cursor).toMatchObject({ bar: 0, beat: 1 });
    });

    it("i 3/4 följs en halvnot av en fjärdedel", () => {
      const start = createEditor();
      start.score.timeSignature = { beats: 3, beatValue: 4 };
      const state = run(start, [
        { type: "setDuration", duration: 2 },
        { type: "enterFret", fret: 0 },
        { type: "moveCursor", direction: "right" },
      ]);

      expect(beatsOf(state, 0).map((b) => b.duration)).toEqual([2, 4]);
    });

    it("vänster stannar vid Partiturets första slag", () => {
      const state = run(createEditor(), [{ type: "moveCursor", direction: "left" }]);

      expect(state.cursor).toMatchObject({ bar: 0, beat: 0 });
    });

    it("höger på ett tomt slag sist i en full Takt skapar ingen ny Takt", () => {
      const state = run(createEditor(), [
        { type: "setDuration", duration: 1 },
        { type: "moveCursor", direction: "right" },
      ]);

      expect(state.score.tracks[0].bars).toHaveLength(1);
    });

    it("att byta Notvärde så att Takten blir för lång rättas inte tyst", () => {
      const state = run(createEditor(), [
        ...quarters(4),
        { type: "moveCursor", direction: "left" },
        { type: "setDuration", duration: 2 },
      ]);

      expect(beatsOf(state, 0).map((b) => b.duration)).toEqual([4, 4, 2, 4]);
      expect(state.score.tracks[0].bars).toHaveLength(1);
    });
  });

  describe("pauser", () => {
    it("att lägga in en paus gör slaget tyst och flyttar markören vidare", () => {
      const state = run(createEditor(), [
        { type: "setDuration", duration: 8 },
        { type: "insertRest" },
        { type: "insertRest" },
      ]);

      expect(beatsOf(state)).toEqual([
        { duration: 8, notes: [] },
        { duration: 8, notes: [] },
        { duration: 8, notes: [] },
      ]);
      expect(state.cursor.beat).toBe(2);
    });

    it("en paus ersätter tonerna på slaget under markören", () => {
      const state = run(createEditor(), [
        { type: "enterFret", fret: 5 },
        { type: "insertRest" },
      ]);

      expect(beatsOf(state)[0]).toEqual({ duration: 4, notes: [] });
    });

    it("pauser fyller Takten så att nästa paus hamnar i en ny Takt", () => {
      const state = run(
        createEditor(),
        Array.from({ length: 4 }, () => ({ type: "insertRest" }) as const),
      );

      expect(beatsOf(state, 0)).toHaveLength(4);
      expect(state.cursor).toMatchObject({ bar: 1, beat: 0 });
    });
  });
});

describe("tvåsiffriga band", () => {
  const fretAfter = (commands: Command[]) => {
    const state = run(createEditor(), commands);
    return state.score.tracks[0].bars[0].beats[0].notes[0]?.fret;
  };
  const digit = (value: number, time: number) => ({ type: "typeDigit", digit: value, time }) as const;

  it("en siffra ensam blir ett band", () => {
    expect(fretAfter([digit(7, 0)])).toBe(7);
  });

  it("två siffror inom kort tid blir ett tvåsiffrigt band", () => {
    expect(fretAfter([digit(1, 0), digit(2, 300)])).toBe(12);
  });

  it("precis på tidsgränsen slås siffrorna ihop, men inte efter", () => {
    expect(fretAfter([digit(1, 0), digit(5, TWO_DIGIT_WINDOW_MS)])).toBe(15);
    expect(fretAfter([digit(1, 0), digit(5, TWO_DIGIT_WINDOW_MS + 1)])).toBe(5);
  });

  it("siffror som skulle bli ett för högt band ersätter i stället det förra", () => {
    expect(fretAfter([digit(2, 0), digit(4, 100)])).toBe(24);
    expect(fretAfter([digit(2, 0), digit(5, 100)])).toBe(5);
    expect(fretAfter([digit(3, 0), digit(0, 100)])).toBe(0);
  });

  it("en inledande nolla slås ihop till ett ensiffrigt band", () => {
    expect(fretAfter([digit(0, 0), digit(5, 100)])).toBe(5);
  });

  it("en tredje siffra börjar om i stället för att bli ett tresiffrigt band", () => {
    expect(fretAfter([digit(1, 0), digit(2, 100), digit(3, 200)])).toBe(3);
  });

  it("ett annat kommando emellan bryter sammanslagningen", () => {
    const state = run(createEditor(), [
      digit(1, 0),
      { type: "moveCursor", direction: "down" },
      { type: "moveCursor", direction: "up" },
      digit(2, 100),
    ]);

    expect(state.score.tracks[0].bars[0].beats[0].notes).toEqual([{ string: 1, fret: 2 }]);
  });

  it("siffror på olika slag slås inte ihop", () => {
    const state = run(createEditor(), [
      digit(1, 0),
      { type: "moveCursor", direction: "right" },
      digit(2, 100),
    ]);

    expect(state.score.tracks[0].bars[0].beats.map((b) => b.notes[0].fret)).toEqual([1, 2]);
  });
});

/** Skriver `count` fjärdedelar på rad och står kvar på den sista. */
function quarters(count: number): Command[] {
  return Array.from({ length: count }, (_, i) => [
    ...(i > 0 ? [{ type: "moveCursor", direction: "right" } as const] : []),
    { type: "enterFret", fret: i } as const,
  ]).flat();
}

function beatsOf(state: EditorState, bar = 0) {
  return state.score.tracks[0].bars[bar].beats;
}

function run(state: EditorState, commands: Command[]): EditorState {
  return commands.reduce(apply, state);
}
