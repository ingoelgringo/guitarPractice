import { describe, expect, it } from "vitest";
import { apply, createEditor, TWO_DIGIT_WINDOW_MS, type Command, type EditorState } from "./editor";
import type { TimeSignature } from "./score";
import { invalidBars } from "./validation";

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

describe("ackord", () => {
  it("ett band på en annan sträng i samma slag bygger ett ackord", () => {
    const state = run(createEditor(), [
      { type: "enterFret", fret: 0 },
      { type: "moveCursor", direction: "down" },
      { type: "enterFret", fret: 1 },
      { type: "moveCursor", direction: "down" },
      { type: "enterFret", fret: 0 },
    ]);

    expect(beatsOf(state)).toEqual([
      {
        duration: 4,
        notes: [
          { string: 1, fret: 0 },
          { string: 2, fret: 1 },
          { string: 3, fret: 0 },
        ],
      },
    ]);
  });

  it("ett band på en sträng som redan har en ton i slaget ersätter tonen", () => {
    const state = run(createEditor(), [
      { type: "enterFret", fret: 3 },
      { type: "moveCursor", direction: "down" },
      { type: "enterFret", fret: 2 },
      { type: "enterFret", fret: 5 },
    ]);

    expect(beatsOf(state)[0].notes).toEqual([
      { string: 1, fret: 3 },
      { string: 2, fret: 5 },
    ]);
  });

  it("tonerna i ett ackord ligger i strängordning oavsett i vilken ordning de skrevs", () => {
    const state = run(createEditor(), [
      { type: "moveCursor", direction: "down" },
      { type: "moveCursor", direction: "down" },
      { type: "enterFret", fret: 2 },
      { type: "moveCursor", direction: "up" },
      { type: "moveCursor", direction: "up" },
      { type: "enterFret", fret: 0 },
    ]);

    expect(beatsOf(state)[0].notes.map((n) => n.string)).toEqual([1, 3]);
  });

  it("ett tvåsiffrigt band i ett ackord rör inte de andra strängarna", () => {
    const state = run(createEditor(), [
      { type: "enterFret", fret: 0 },
      { type: "moveCursor", direction: "down" },
      digit(1, 0),
      digit(2, 100),
    ]);

    expect(beatsOf(state)[0].notes).toEqual([
      { string: 1, fret: 0 },
      { string: 2, fret: 12 },
    ]);
  });
});

describe("ta bort", () => {
  it("att ta bort en ton tar bara bort tonen på markörens sträng", () => {
    const state = run(createEditor(), [
      { type: "enterFret", fret: 0 },
      { type: "moveCursor", direction: "down" },
      { type: "enterFret", fret: 1 },
      { type: "deleteNote" },
    ]);

    expect(beatsOf(state)).toEqual([{ duration: 4, notes: [{ string: 1, fret: 0 }] }]);
    expect(state.cursor).toEqual({ track: 0, bar: 0, beat: 0, string: 2 });
  });

  it("när sista tonen tas bort blir slaget en paus med samma Notvärde", () => {
    const state = run(createEditor(), [
      { type: "setDuration", duration: 8 },
      { type: "toggleDot" },
      { type: "enterFret", fret: 5 },
      { type: "deleteNote" },
    ]);

    expect(beatsOf(state)).toEqual([{ duration: 8, dotted: true, notes: [] }]);
  });

  it("att ta bort ett slag flyttar de följande slagen bakåt, och markören hamnar på nästa slag", () => {
    const state = run(createEditor(), [
      ...quarters(3),
      { type: "moveCursor", direction: "left" },
      { type: "deleteBeat" },
    ]);

    expect(beatsOf(state).map((b) => b.notes[0].fret)).toEqual([0, 2]);
    expect(state.cursor.beat).toBe(1);
  });

  it("att ta bort det sista slaget i en Takt flyttar markören till slaget före", () => {
    const state = run(createEditor(), [...quarters(3), { type: "deleteBeat" }]);

    expect(beatsOf(state).map((b) => b.notes[0].fret)).toEqual([0, 1]);
    expect(state.cursor.beat).toBe(1);
  });

  it("en Takt behåller alltid ett slag: tas det enda bort blir det en paus med samma Notvärde", () => {
    const state = run(createEditor(), [
      { type: "setDuration", duration: 2 },
      { type: "enterFret", fret: 5 },
      { type: "deleteBeat" },
    ]);

    expect(beatsOf(state)).toEqual([{ duration: 2, notes: [] }]);
    expect(state.cursor.beat).toBe(0);
  });

  it("att ta bort ett slag rör inte andra Takter", () => {
    const state = run(createEditor(), [
      ...quarters(5),
      { type: "deleteBeat" },
    ]);

    expect(beatsOf(state, 0).map((b) => b.notes[0].fret)).toEqual([0, 1, 2, 3]);
    expect(beatsOf(state, 1)).toEqual([{ duration: 4, notes: [] }]);
    expect(state.cursor).toMatchObject({ bar: 1, beat: 0 });
  });
});

describe("ångra och gör om", () => {
  it("ångra återställer Partituret och markören från före ändringen, och gör om återställer ändringen", () => {
    const written = run(createEditor(), [
      { type: "enterFret", fret: 5 },
      { type: "moveCursor", direction: "right" },
      { type: "moveCursor", direction: "down" },
      { type: "enterFret", fret: 7 },
    ]);

    const undone = apply(written, { type: "undo" });
    expect(beatsOf(undone)).toEqual([
      { duration: 4, notes: [{ string: 1, fret: 5 }] },
      { duration: 4, notes: [] },
    ]);
    expect(undone.cursor).toEqual({ track: 0, bar: 0, beat: 1, string: 2 });

    const redone = apply(undone, { type: "redo" });
    expect(redone.score).toEqual(written.score);
    expect(redone.cursor).toEqual(written.cursor);
  });

  it("ångra går att upprepa ända tillbaka till det tomma Partituret", () => {
    const state = run(createEditor(), [
      ...quarters(3),
      ...Array.from({ length: 10 }, () => ({ type: "undo" }) as const),
    ]);

    expect(state.score).toEqual(createEditor().score);
    expect(state.cursor).toEqual(createEditor().cursor);
  });

  it("gör om utan något ångrat gör ingenting", () => {
    const written = apply(createEditor(), { type: "enterFret", fret: 5 });

    expect(apply(written, { type: "redo" }).score).toEqual(written.score);
  });

  it("en ny ändring efter ångra rensar det som gick att göra om", () => {
    const state = run(createEditor(), [
      { type: "enterFret", fret: 5 },
      { type: "undo" },
      { type: "enterFret", fret: 7 },
      { type: "redo" },
    ]);

    expect(beatsOf(state)[0].notes).toEqual([{ string: 1, fret: 7 }]);
  });

  it("att bara flytta markören efter ångra rensar inte det som går att göra om", () => {
    const state = run(createEditor(), [
      { type: "enterFret", fret: 5 },
      { type: "undo" },
      { type: "moveCursor", direction: "down" },
      { type: "redo" },
    ]);

    expect(beatsOf(state)[0].notes).toEqual([{ string: 1, fret: 5 }]);
  });

  it("markörflyttningar som inte ändrar Partituret hamnar inte i historiken", () => {
    const state = run(createEditor(), [
      { type: "enterFret", fret: 5 },
      { type: "moveCursor", direction: "down" },
      { type: "moveCursor", direction: "down" },
      { type: "undo" },
    ]);

    expect(beatsOf(state)[0].notes).toEqual([]);
  });

  it("ett tvåsiffrigt band ångras som en enhet", () => {
    const state = run(createEditor(), [
      { type: "enterFret", fret: 3 },
      { type: "moveCursor", direction: "down" },
      digit(1, 0),
      digit(2, 100),
      { type: "undo" },
    ]);

    expect(beatsOf(state)[0].notes).toEqual([{ string: 1, fret: 3 }]);
  });

  it("en paus som också skapar nästa slag ångras som en enhet", () => {
    const state = run(createEditor(), [
      { type: "enterFret", fret: 3 },
      { type: "insertRest" },
      { type: "undo" },
    ]);

    expect(beatsOf(state)).toEqual([{ duration: 4, notes: [{ string: 1, fret: 3 }] }]);
    expect(state.cursor.beat).toBe(0);
  });

  it("alla ändrande kommandon går att ångra", () => {
    const start = run(createEditor(), [
      { type: "moveCursor", direction: "down" },
      { type: "enterFret", fret: 3 },
      { type: "moveCursor", direction: "up" },
      { type: "enterFret", fret: 1 },
    ]);
    const commands: Command[] = [
      { type: "enterFret", fret: 9 },
      digit(4, 0),
      { type: "setDuration", duration: 8 },
      { type: "toggleDot" },
      { type: "toggleTriplet" },
      { type: "insertRest" },
      { type: "deleteNote" },
      { type: "deleteBeat" },
      { type: "moveCursor", direction: "right" },
    ];

    for (const command of commands) {
      const changed = apply(start, command);
      expect(changed.score, command.type).not.toEqual(start.score);
      expect(apply(changed, { type: "undo" }).score, command.type).toEqual(start.score);
    }
  });

  it("kommandon som inte ändrar Partituret blir inga ångra-steg och rensar inte det som går att göra om", () => {
    const state = run(createEditor(), [
      { type: "enterFret", fret: 5 },
      { type: "setDuration", duration: 4 },
      { type: "moveCursor", direction: "down" },
      { type: "deleteNote" },
      { type: "undo" },
    ]);
    expect(beatsOf(state)[0].notes).toEqual([]);

    const redone = run(state, [{ type: "deleteNote" }, { type: "redo" }]);
    expect(beatsOf(redone)[0].notes).toEqual([{ string: 1, fret: 5 }]);
  });

  it("gör om ställer markören där den stod efter ändringen", () => {
    const state = run(createEditor(), [
      { type: "enterFret", fret: 5 },
      { type: "moveCursor", direction: "down" },
      { type: "moveCursor", direction: "down" },
      { type: "undo" },
      { type: "redo" },
    ]);

    expect(state.cursor).toEqual({ track: 0, bar: 0, beat: 0, string: 1 });
  });

  it("ett tvåsiffrigt band går att ångra även när den första siffran inte ändrade något", () => {
    const state = run(createEditor(), [
      { type: "enterFret", fret: 1 },
      { type: "moveCursor", direction: "down" },
      { type: "moveCursor", direction: "up" },
      digit(1, 0),
      digit(2, 100),
      { type: "undo" },
    ]);

    expect(beatsOf(state)[0].notes).toEqual([{ string: 1, fret: 1 }]);
  });

  it("ångra mellan två siffror bryter det tvåsiffriga bandet", () => {
    const state = run(createEditor(), [digit(1, 0), { type: "undo" }, digit(2, 100)]);

    expect(beatsOf(state)[0].notes).toEqual([{ string: 1, fret: 2 }]);
  });

  it("ett tvåsiffrigt band som blir samma band som förut lämnar inget tomt ångra-steg", () => {
    const state = run(createEditor(), [
      { type: "enterFret", fret: 3 },
      { type: "moveCursor", direction: "down" },
      { type: "enterFret", fret: 12 },
      { type: "moveCursor", direction: "up" },
      { type: "moveCursor", direction: "down" },
      digit(1, 0),
      digit(2, 100),
      { type: "undo" },
    ]);

    expect(beatsOf(state)[0].notes).toEqual([{ string: 1, fret: 3 }]);
  });
});

describe("partiturinställningar", () => {
  it("ett nytt Partitur har tom metadata, 120 BPM och ingen Capo", () => {
    const { score } = createEditor();

    expect(score.metadata).toEqual({ title: "", subtitle: "", artist: "", tabbedBy: "" });
    expect(score.tempo).toBe(120);
    expect(score.tracks[0].capo).toBe(0);
  });

  it("metadata sätts fält för fält och kan ångras", () => {
    const state = run(createEditor(), [
      { type: "setMetadata", metadata: { title: "Blackbird" } },
      { type: "setMetadata", metadata: { artist: "The Beatles", tabbedBy: "Ingo" } },
    ]);

    expect(state.score.metadata).toEqual({
      title: "Blackbird",
      subtitle: "",
      artist: "The Beatles",
      tabbedBy: "Ingo",
    });
    expect(apply(state, { type: "undo" }).score.metadata.artist).toBe("");
    expect(apply(state, { type: "undo" }).score.metadata.title).toBe("Blackbird");
  });

  it("metadata trimmas, så att ett fält med bara mellanslag blir tomt och utelämnas", () => {
    const state = apply(createEditor(), { type: "setMetadata", metadata: { title: "  Blackbird ", artist: "   " } });

    expect(state.score.metadata.title).toBe("Blackbird");
    expect(state.score.metadata.artist).toBe("");
  });

  it("Stämningen byts för markörens Spår och kan ångras", () => {
    const dropD = [64, 59, 55, 50, 45, 38];
    const state = apply(createEditor(), { type: "setTuning", tuning: dropD });

    expect(state.score.tracks[0].tuning).toEqual(dropD);
    expect(apply(state, { type: "undo" }).score.tracks[0].tuning).toEqual([64, 59, 55, 50, 45, 40]);
  });

  it("en Stämning med fel antal strängar eller orimliga tonhöjder avvisas", () => {
    const start = createEditor();

    for (const tuning of [[64, 59, 55, 50, 45], [64, 59, 55, 50, 45, 40, 35], [64, 59, 55, 50, 45, 40.5], [200, 59, 55, 50, 45, 40]]) {
      const state = apply(start, { type: "setTuning", tuning });
      expect(state.score, String(tuning)).toBe(start.score);
    }
  });

  it("Capo sätts för markörens Spår och kan ångras, men inte under band 0 eller över band 24", () => {
    const state = apply(createEditor(), { type: "setCapo", capo: 3 });

    expect(state.score.tracks[0].capo).toBe(3);
    expect(apply(state, { type: "undo" }).score.tracks[0].capo).toBe(0);
    for (const capo of [-1, 25, 2.5]) {
      expect(apply(state, { type: "setCapo", capo }).score.tracks[0].capo, String(capo)).toBe(3);
    }
  });

  it("Capo ändrar inte bandnumren i tabben, eftersom de är relativa till Capo", () => {
    const state = run(createEditor(), [
      { type: "enterFret", fret: 2 },
      { type: "setCapo", capo: 5 },
    ]);

    expect(beatsOf(state)[0].notes).toEqual([{ string: 1, fret: 2 }]);
  });

  it("starttempot sätts i BPM och kan ångras, men bara som heltal från 20 till 400", () => {
    const state = apply(createEditor(), { type: "setTempo", tempo: 90 });

    expect(state.score.tempo).toBe(90);
    expect(apply(state, { type: "undo" }).score.tempo).toBe(120);
    for (const tempo of [19, 401, 90.5]) {
      expect(apply(state, { type: "setTempo", tempo }).score.tempo, String(tempo)).toBe(90);
    }
  });

  it("starttaktarten sätts och kan ångras, men bara med 1–32 slag och halvnot till sextondel som slagets Notvärde", () => {
    const state = apply(createEditor(), { type: "setTimeSignature", timeSignature: { beats: 6, beatValue: 8 } });

    expect(state.score.timeSignature).toEqual({ beats: 6, beatValue: 8 });
    expect(apply(state, { type: "undo" }).score.timeSignature).toEqual({ beats: 4, beatValue: 4 });
    for (const timeSignature of [
      { beats: 0, beatValue: 4 },
      { beats: 33, beatValue: 4 },
      { beats: 3, beatValue: 3 },
      { beats: 3, beatValue: 1 },
      { beats: 3, beatValue: 32 },
    ] as TimeSignature[]) {
      expect(apply(state, { type: "setTimeSignature", timeSignature }).score.timeSignature).toEqual({
        beats: 6,
        beatValue: 8,
      });
    }
  });

  it("en ändrad starttaktart flaggar Takter som inte längre stämmer, utan att rätta dem", () => {
    const state = run(createEditor(), [
      ...quarters(5),
      { type: "setTimeSignature", timeSignature: { beats: 3, beatValue: 4 } },
    ]);

    expect(beatsOf(state, 0)).toHaveLength(4);
    expect(invalidBars(state.score)).toEqual([{ track: 0, bar: 0, problem: "tooLong" }]);
  });

  it("efter en ändrad starttaktart fylls Takterna efter den nya taktarten", () => {
    const state = run(createEditor(), [
      { type: "setTimeSignature", timeSignature: { beats: 3, beatValue: 4 } },
      ...quarters(4),
    ]);

    expect(beatsOf(state, 0)).toHaveLength(3);
    expect(state.cursor).toMatchObject({ bar: 1, beat: 0 });
  });
});

/** Skriver `count` fjärdedelar på rad och står kvar på den sista. */
function quarters(count: number): Command[] {
  return Array.from({ length: count }, (_, i) => [
    ...(i > 0 ? [{ type: "moveCursor", direction: "right" } as const] : []),
    { type: "enterFret", fret: i } as const,
  ]).flat();
}

function digit(value: number, time: number) {
  return { type: "typeDigit", digit: value, time } as const;
}

function beatsOf(state: EditorState, bar = 0) {
  return state.score.tracks[0].bars[bar].beats;
}

function run(state: EditorState, commands: Command[]): EditorState {
  return commands.reduce(apply, state);
}
