import { describe, expect, it } from "vitest";
import { apply, createEditor, neighbourBeat, TWO_DIGIT_WINDOW_MS, type Command, type EditorState, type SelectionUnit, type Side } from "./editor";
import { MAX_BEAT_TEXT_LENGTH, type BeatText, type TimeSignature, type ViewMode } from "./score";
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

describe("Vy-läge", () => {
  it("ett nytt Partitur visas som noter + tabulatur", () => {
    expect(createEditor().score.viewMode).toBe("scoreAndTab");
  });

  it("Vy-läget byts med ett kommando som kan ångras och göras om", () => {
    const state = apply(createEditor(), { type: "setViewMode", viewMode: "rhythmTab" });

    expect(state.score.viewMode).toBe("rhythmTab");
    const undone = apply(state, { type: "undo" });
    expect(undone.score.viewMode).toBe("scoreAndTab");
    expect(apply(undone, { type: "redo" }).score.viewMode).toBe("rhythmTab");
  });

  it("ett okänt Vy-läge avvisas", () => {
    const start = createEditor();

    const state = apply(start, { type: "setViewMode", viewMode: "lyrics" as ViewMode });

    expect(state.score).toBe(start.score);
  });

  it.each<ViewMode>(["scoreAndTab", "scoreOnly", "rhythmTab"])(
    "i Vy-läget %s skriver man fortfarande band på markörens sträng",
    (viewMode) => {
      const state = run(createEditor(), [
        { type: "setViewMode", viewMode },
        { type: "moveCursor", direction: "down" },
        { type: "enterFret", fret: 7 },
        { type: "moveCursor", direction: "right" },
      ]);

      expect(beatsOf(state)[0].notes).toEqual([{ string: 2, fret: 7 }]);
      expect(state.cursor).toEqual({ track: 0, bar: 0, beat: 1, string: 2 });
    },
  );
});

describe("speltekniker", () => {
  /** Band 5 och 7 på sträng 1 i två slag, med markören tillbaka på det första. */
  function twoNotes(): EditorState {
    return run(createEditor(), [
      { type: "enterFret", fret: 5 },
      { type: "moveCursor", direction: "right" },
      { type: "enterFret", fret: 7 },
      { type: "moveCursor", direction: "left" },
    ]);
  }

  it.each([
    ["toggleHammerPull", "hammerPull"],
    ["toggleSlide", "slide"],
  ] as const)("%s förbinder tonen med nästa ton på samma sträng och tar bort förbindelsen igen", (type, field) => {
    const on = apply(twoNotes(), { type });
    const off = apply(on, { type });

    expect(beatsOf(on)[0].notes).toEqual([{ string: 1, fret: 5, [field]: true }]);
    expect(beatsOf(on)[1].notes).toEqual([{ string: 1, fret: 7 }]);
    expect(beatsOf(off)[0].notes).toEqual([{ string: 1, fret: 5 }]);
  });

  it("hammer-on och pull-off är samma teknik: tonernas band avgör vilken det blir", () => {
    const state = run(createEditor(), [
      { type: "enterFret", fret: 7 },
      { type: "moveCursor", direction: "right" },
      { type: "enterFret", fret: 5 },
      { type: "moveCursor", direction: "left" },
      { type: "toggleHammerPull" },
    ]);

    expect(beatsOf(state)[0].notes).toEqual([{ string: 1, fret: 7, hammerPull: true }]);
  });

  it("en ton förbinds med nästa slag även när det ligger i nästa Takt", () => {
    const state = run(createEditor(), [
      ...quarters(4),
      { type: "moveCursor", direction: "right" },
      { type: "enterFret", fret: 9 },
      { type: "moveCursor", direction: "left" },
      { type: "toggleSlide" },
    ]);

    expect(beatsOf(state)[3].notes).toEqual([{ string: 1, fret: 3, slide: true }]);
  });

  it("hammer-on/pull-off och slide utesluter varandra", () => {
    const state = run(twoNotes(), [{ type: "toggleHammerPull" }, { type: "toggleSlide" }]);

    expect(beatsOf(state)[0].notes).toEqual([{ string: 1, fret: 5, slide: true }]);
  });

  it.each(["toggleHammerPull", "toggleSlide"] as const)(
    "%s gör ingenting utan en efterföljande ton på samma sträng",
    (type) => {
      const last = apply(apply(createEditor(), { type: "enterFret", fret: 5 }), { type });
      const otherString = run(createEditor(), [
        { type: "enterFret", fret: 5 },
        { type: "moveCursor", direction: "right" },
        { type: "moveCursor", direction: "down" },
        { type: "enterFret", fret: 7 },
        { type: "moveCursor", direction: "left" },
        { type: "moveCursor", direction: "up" },
        { type },
      ]);
      const sameFret = run(createEditor(), [
        { type: "enterFret", fret: 0 },
        { type: "moveCursor", direction: "right" },
        { type: "enterFret", fret: 0 },
        { type: "moveCursor", direction: "left" },
        { type },
      ]);

      expect(beatsOf(last)[0].notes).toEqual([{ string: 1, fret: 5 }]);
      expect(beatsOf(otherString)[0].notes).toEqual([{ string: 1, fret: 5 }]);
      expect(beatsOf(sameFret)[0].notes).toEqual([{ string: 1, fret: 0 }]);
      // Bara inmatningen av bandet blev en ändring
      expect(apply(last, { type: "undo" }).score).toEqual(createEditor().score);
    },
  );

  it("förbindelsen försvinner när tonen den leder till tas bort", () => {
    const linked = apply(twoNotes(), { type: "toggleHammerPull" });

    const deletedNote = run(linked, [{ type: "moveCursor", direction: "right" }, { type: "deleteNote" }]);
    const deletedBeat = run(linked, [{ type: "moveCursor", direction: "right" }, { type: "deleteBeat" }]);
    const rest = run(linked, [{ type: "moveCursor", direction: "right" }, { type: "insertRest" }]);

    for (const state of [deletedNote, deletedBeat, rest]) {
      expect(beatsOf(state)[0].notes).toEqual([{ string: 1, fret: 5 }]);
    }
  });

  it("förbindelsen försvinner när målet får samma band som tonen", () => {
    const state = run(twoNotes(), [
      { type: "toggleSlide" },
      { type: "moveCursor", direction: "right" },
      { type: "enterFret", fret: 5 },
    ]);

    expect(beatsOf(state)[0].notes).toEqual([{ string: 1, fret: 5 }]);
  });

  it("teknikerna ligger kvar när tonen får ett nytt band", () => {
    const state = run(twoNotes(), [{ type: "toggleSlide" }, { type: "togglePalmMute" }, { type: "enterFret", fret: 3 }]);

    expect(beatsOf(state)[0].notes).toEqual([{ string: 1, fret: 3, slide: true, palmMute: true }]);
  });

  it("bend växlar mellan ½ ton, hel ton, 1½ ton och ingen bend (målet i halvtoner)", () => {
    const states = [1, 2, 3, 4].map((count) =>
      run(createEditor(), [{ type: "enterFret", fret: 7 }, ...Array.from({ length: count }, () => ({ type: "cycleBend" }) as const)]),
    );

    expect(states.map((s) => beatsOf(s)[0].notes[0].bend)).toEqual([1, 2, 3, undefined]);
    expect(beatsOf(states[3])[0].notes).toEqual([{ string: 1, fret: 7 }]);
  });

  it("palm mute slås på och av för tonen på markörens sträng", () => {
    const chord = run(createEditor(), [
      { type: "enterFret", fret: 0 },
      { type: "moveCursor", direction: "down" },
      { type: "enterFret", fret: 1 },
    ]);

    const on = apply(chord, { type: "togglePalmMute" });
    const off = apply(on, { type: "togglePalmMute" });

    expect(beatsOf(on)[0].notes).toEqual([{ string: 1, fret: 0 }, { string: 2, fret: 1, palmMute: true }]);
    expect(beatsOf(off)[0].notes).toEqual([{ string: 1, fret: 0 }, { string: 2, fret: 1 }]);
  });

  it.each(["togglePalmMute", "cycleBend", "toggleHammerPull", "toggleSlide"] as const)(
    "%s gör ingenting när markörens sträng saknar ton",
    (type) => {
      const before = apply(createEditor(), { type: "enterFret", fret: 5 });
      const state = run(before, [{ type: "moveCursor", direction: "down" }, { type }]);

      expect(state.score).toBe(before.score);
      expect(apply(state, { type: "undo" }).score).toEqual(createEditor().score);
    },
  );

  it("en teknik ångras och görs om", () => {
    const before = twoNotes();
    const marked = apply(before, { type: "cycleBend" });

    const undone = apply(marked, { type: "undo" });
    const redone = apply(undone, { type: "redo" });

    expect(undone.score).toEqual(before.score);
    expect(redone.score).toEqual(marked.score);
  });
});

describe("taktartsbyten", () => {
  /** Två fulla Takter i 4/4 med markören i den andra. */
  const twoBars = () => run(createEditor(), [...quarters(8)]);

  it("ett taktartsbyte sätts på markörens Takt och gäller därifrån, och det kan ångras", () => {
    const state = apply(twoBars(), { type: "setBarTimeSignature", timeSignature: { beats: 3, beatValue: 4 } });

    expect(state.score.tracks[0].bars[1].timeSignature).toEqual({ beats: 3, beatValue: 4 });
    expect(state.score.tracks[0].bars[0].timeSignature).toBeUndefined();
    expect(state.score.timeSignature).toEqual({ beats: 4, beatValue: 4 });
    expect(apply(state, { type: "undo" }).score).toEqual(twoBars().score);
  });

  it("på första Takten ändrar det starttaktarten", () => {
    const state = apply(createEditor(), { type: "setBarTimeSignature", timeSignature: { beats: 6, beatValue: 8 } });

    expect(state.score.timeSignature).toEqual({ beats: 6, beatValue: 8 });
    expect(state.score.tracks[0].bars[0].timeSignature).toBeUndefined();
  });

  it("ett byte till den taktart som redan gäller blir inget byte", () => {
    const start = twoBars();
    const changed = apply(start, { type: "setBarTimeSignature", timeSignature: { beats: 3, beatValue: 4 } });
    const back = apply(changed, { type: "setBarTimeSignature", timeSignature: { beats: 4, beatValue: 4 } });

    expect(apply(start, { type: "setBarTimeSignature", timeSignature: { beats: 4, beatValue: 4 } }).score).toBe(start.score);
    expect(back.score.tracks[0].bars[1].timeSignature).toBeUndefined();
  });

  it("ogiltiga taktarter avvisas", () => {
    const state = twoBars();
    for (const timeSignature of [
      { beats: 0, beatValue: 4 },
      { beats: 33, beatValue: 4 },
      { beats: 3, beatValue: 3 },
      { beats: 2.5, beatValue: 4 },
    ] as TimeSignature[]) {
      expect(apply(state, { type: "setBarTimeSignature", timeSignature }).score, JSON.stringify(timeSignature)).toBe(
        state.score,
      );
    }
  });

  it("att ta bort bytet låter Takten följa taktarten före den igen", () => {
    const changed = apply(twoBars(), { type: "setBarTimeSignature", timeSignature: { beats: 3, beatValue: 4 } });
    const state = apply(changed, { type: "clearBarTimeSignature" });

    expect(state.score).toEqual(twoBars().score);
    expect(apply(state, { type: "undo" }).score).toEqual(changed.score);
  });

  it("Takterna fylls efter den taktart som gäller, även i nya Takter efter bytet", () => {
    const state = run(createEditor(), [
      ...quarters(4),
      { type: "moveCursor", direction: "right" },
      { type: "setBarTimeSignature", timeSignature: { beats: 3, beatValue: 4 } },
      ...quarters(4),
    ]);

    expect(state.score.tracks[0].bars.map((bar) => bar.beats.length)).toEqual([4, 3, 1]);
    expect(state.score.tracks[0].bars[2].timeSignature).toBeUndefined();
    expect(state.cursor).toMatchObject({ bar: 2, beat: 0 });
  });

  it("ett byte flaggar Takter som inte längre stämmer, utan att rätta dem", () => {
    const state = run(createEditor(), [
      ...quarters(9),
      { type: "moveCursor", direction: "left" },
      { type: "setBarTimeSignature", timeSignature: { beats: 3, beatValue: 4 } },
    ]);

    expect(state.cursor.bar).toBe(1);
    expect(invalidBars(state.score)).toEqual([{ track: 0, bar: 1, problem: "tooLong" }]);
  });
});

describe("tempobyten", () => {
  const twoBars = () => run(createEditor(), [...quarters(5)]);

  it("ett tempobyte sätts på markörens Takt, kan tas bort och kan ångras", () => {
    const state = apply(twoBars(), { type: "setBarTempo", tempo: 90 });

    expect(state.score.tracks[0].bars[1].tempo).toBe(90);
    expect(state.score.tempo).toBe(120);
    expect(apply(state, { type: "undo" }).score).toEqual(twoBars().score);
    expect(apply(state, { type: "clearBarTempo" }).score).toEqual(twoBars().score);
  });

  it("på första Takten ändrar det starttempot", () => {
    const state = apply(createEditor(), { type: "setBarTempo", tempo: 80 });

    expect(state.score.tempo).toBe(80);
    expect(state.score.tracks[0].bars[0].tempo).toBeUndefined();
  });

  it("ett byte till det tempo som redan gäller blir inget byte", () => {
    const changed = apply(twoBars(), { type: "setBarTempo", tempo: 90 });

    expect(apply(changed, { type: "setBarTempo", tempo: 120 }).score.tracks[0].bars[1].tempo).toBeUndefined();
  });

  it("tempon utanför 20–400 BPM och decimaltal avvisas", () => {
    const state = twoBars();
    for (const tempo of [19, 401, 90.5]) {
      expect(apply(state, { type: "setBarTempo", tempo }).score, String(tempo)).toBe(state.score);
    }
  });
});

describe("repriser", () => {
  const twoBars = () => run(createEditor(), [...quarters(5)]);

  it("reprisstart växlas på markörens Takt", () => {
    const on = apply(twoBars(), { type: "toggleRepeatStart" });
    const off = apply(on, { type: "toggleRepeatStart" });

    expect(on.score.tracks[0].bars[1].repeatStart).toBe(true);
    expect(on.score.tracks[0].bars[0].repeatStart).toBeUndefined();
    expect(off.score).toEqual(twoBars().score);
  });

  it("reprisslut växlas på markörens Takt och spelas två varv från början", () => {
    const on = apply(twoBars(), { type: "toggleRepeatEnd" });
    const off = apply(on, { type: "toggleRepeatEnd" });

    expect(on.score.tracks[0].bars[1].repeatEnd).toBe(2);
    expect(off.score).toEqual(twoBars().score);
    expect(apply(on, { type: "undo" }).score).toEqual(twoBars().score);
  });

  it("en Takt kan både börja och sluta en repris", () => {
    const state = run(twoBars(), [{ type: "toggleRepeatStart" }, { type: "toggleRepeatEnd" }]);

    expect(state.score.tracks[0].bars[1]).toMatchObject({ repeatStart: true, repeatEnd: 2 });
  });

  it("antalet varv sätts på reprisslutet, och att ta bort slutet tar bort antalet", () => {
    const state = run(twoBars(), [{ type: "toggleRepeatEnd" }, { type: "setRepeatCount", count: 4 }]);

    expect(state.score.tracks[0].bars[1].repeatEnd).toBe(4);
    expect(apply(state, { type: "toggleRepeatEnd" }).score).toEqual(twoBars().score);
  });

  it("antal varv utan reprisslut avvisas", () => {
    const state = twoBars();

    expect(apply(state, { type: "setRepeatCount", count: 3 }).score).toBe(state.score);
  });

  it("antal varv under 2, över 99 eller med decimaler avvisas", () => {
    const state = apply(twoBars(), { type: "toggleRepeatEnd" });
    for (const count of [0, 1, 100, 2.5]) {
      expect(apply(state, { type: "setRepeatCount", count }).score, String(count)).toBe(state.score);
    }
  });
});

describe("öppna ett Partitur", () => {
  it("ersätter Partituret, ställer markören först och börjar om historiken", () => {
    const opened = apply(createEditor(), { type: "setMetadata", metadata: { title: "Opened" } }).score;
    const before = run(createEditor(), [...quarters(3), { type: "moveCursor", direction: "down" }]);

    const state = apply(before, { type: "openScore", score: opened });

    expect(state.score).toBe(opened);
    expect(state.cursor).toEqual({ track: 0, bar: 0, beat: 0, string: 1 });
    expect(apply(state, { type: "undo" }).score).toBe(opened);
  });
});

describe("markering", () => {

  it("ett nytt Partitur har ingen markering", () => {
    expect(createEditor().selection).toBeNull();
  });

  it("markeringen utökas slag för slag, även över taktstreck, och markören följer med", () => {
    const state = run(filled(2), [at(0, 2), extend("right"), extend("right")]);

    expect(state.selection).toEqual({ anchor: { bar: 0, beat: 2 }, head: { bar: 1, beat: 0 } });
    expect(state.cursor).toMatchObject({ bar: 1, beat: 0 });
  });

  it("markeringen kan utökas bakåt och krympa igen", () => {
    const state = run(filled(2), [at(1, 0), extend("left"), extend("left"), extend("right")]);

    expect(state.selection).toEqual({ anchor: { bar: 1, beat: 0 }, head: { bar: 0, beat: 3 } });
  });

  it("vid Partiturets kanter markeras slaget under markören utan att något nytt skapas", () => {
    const first = run(filled(2), [at(0, 0), extend("left")]);
    const last = apply(filled(2), extend("right"));

    expect(first.selection).toEqual({ anchor: { bar: 0, beat: 0 }, head: { bar: 0, beat: 0 } });
    expect(last.selection).toEqual({ anchor: { bar: 1, beat: 3 }, head: { bar: 1, beat: 3 } });
    expect(last.score).toEqual(filled(2).score);
  });

  it("hela Takter markeras Takt för Takt", () => {
    const right = run(filled(2), [at(0, 2), extend("right", "bar")]);
    const further = apply(right, extend("right", "bar"));
    const left = run(filled(2), [at(1, 2), extend("left", "bar"), extend("left", "bar")]);

    expect(right.selection).toEqual({ anchor: { bar: 0, beat: 0 }, head: { bar: 0, beat: 3 } });
    expect(further.selection).toEqual({ anchor: { bar: 0, beat: 0 }, head: { bar: 1, beat: 3 } });
    expect(left.selection).toEqual({ anchor: { bar: 1, beat: 3 }, head: { bar: 0, beat: 0 } });
  });

  it("en markering av hela Takter krymper Takt för Takt och omfattar alltid hela Takter", () => {
    const state = run(filled(3), [at(0, 2), extend("right", "bar"), extend("right", "bar"), extend("right", "bar"), extend("left", "bar")]);

    expect(state.selection).toEqual({ anchor: { bar: 0, beat: 0 }, head: { bar: 1, beat: 3 } });
  });

  it("en markering av slag växer till hela Takter", () => {
    const state = run(filled(3), [at(0, 2), extend("right"), extend("right", "bar")]);

    expect(state.selection).toEqual({ anchor: { bar: 0, beat: 0 }, head: { bar: 0, beat: 3 } });
  });

  it("att flytta markören åt sidan tar bort markeringen, men inte att byta sträng", () => {
    const selected = run(filled(2), [at(0, 2), extend("right")]);

    expect(apply(selected, { type: "moveCursor", direction: "left" }).selection).toBeNull();
    expect(apply(selected, { type: "moveCursor", direction: "down" }).selection).not.toBeNull();
  });

  it("en ändring av Partituret tar bort markeringen, och markeringen hamnar inte i historiken", () => {
    const selected = run(filled(2), [at(0, 2), extend("right")]);
    const changed = apply(selected, { type: "enterFret", fret: 9 });

    expect(changed.selection).toBeNull();
    // Ångra hoppar över markeringen och ångrar det senast skrivna bandet
    expect(fretsOf(apply(selected, { type: "undo" }))[1]).toEqual([4, 5, 6, undefined]);
  });
});

describe("flytta markören till en position", () => {

  it("flyttar markören dit, t.ex. efter ett klick i notbilden", () => {
    const state = apply(filled(2), { type: "moveCursorTo", position: { track: 0, bar: 0, beat: 1, string: 4 } });

    expect(state.cursor).toEqual({ track: 0, bar: 0, beat: 1, string: 4 });
  });

  it("en position som inte finns ignoreras", () => {
    const state = filled(2);
    for (const position of [
      { track: 1, bar: 0, beat: 0, string: 1 },
      { track: 0, bar: 2, beat: 0, string: 1 },
      { track: 0, bar: 0, beat: 4, string: 1 },
      { track: 0, bar: 0, beat: 0, string: 7 },
      { track: 0, bar: 0, beat: 0, string: 0 },
    ]) {
      expect(apply(state, { type: "moveCursorTo", position }).cursor, JSON.stringify(position)).toEqual(state.cursor);
    }
  });
});

describe("kopiera och klistra in", () => {

  it("inklistring skriver över slagen från markören med de kopierade slagen", () => {
    const state = run(filled(2), [at(0, 0), extend("right"), { type: "copy" }, at(0, 2), { type: "paste" }]);

    expect(fretsOf(state)[0]).toEqual([0, 1, 0, 1]);
    expect(fretsOf(state)[1]).toEqual([4, 5, 6, 7]);
    expect(state.cursor).toMatchObject({ bar: 0, beat: 3 });
  });

  it("med en markering börjar inklistringen där markeringen börjar", () => {
    const state = run(filled(2), [at(0, 0), extend("right"), { type: "copy" }, at(1, 0), extend("right"), extend("right"), { type: "paste" }]);

    expect(fretsOf(state)[1]).toEqual([0, 1, 6, 7]);
    expect(state.cursor).toMatchObject({ bar: 1, beat: 1 });
  });

  it("att kopiera ändrar inte Partituret och hamnar inte i historiken", () => {
    const selected = run(filled(2), [at(0, 0), extend("right")]);
    const copied = apply(selected, { type: "copy" });

    expect(copied.score).toBe(selected.score);
    // Ångra ångrar det senast skrivna bandet
    expect(fretsOf(apply(copied, { type: "undo" }))[1]).toEqual([4, 5, 6, undefined]);
  });

  it("inklistringen spiller över till nästa Takt", () => {
    const state = run(filled(2), [at(0, 0), extend("right"), extend("right"), { type: "copy" }, at(0, 3), { type: "paste" }]);

    expect(fretsOf(state)[0]).toEqual([0, 1, 2, 0]);
    expect(fretsOf(state)[1]).toEqual([1, 2, 6, 7]);
  });

  it("inklistring i slutet av Partituret fyller den sista Takten och skapar nya Takter", () => {
    const state = run(filled(2), [
      at(0, 0),
      { type: "extendSelection", direction: "right", unit: "bar" },
      { type: "copy" },
      at(1, 2),
      { type: "paste" },
    ]);

    expect(fretsOf(state)[1]).toEqual([4, 5, 0, 1]);
    expect(fretsOf(state)[2]).toEqual([2, 3]);
    expect(state.cursor).toMatchObject({ bar: 2, beat: 1 });
  });

  it("i slutet av Partituret hamnar ett slag som inte ryms i den sista Takten i en ny Takt", () => {
    // Det kopierade är en fjärdedel och en halvnot
    const source = run(createEditor(), [
      { type: "enterFret", fret: 1 },
      { type: "moveCursor", direction: "right" },
      { type: "setDuration", duration: 2 },
      { type: "enterFret", fret: 2 },
      { type: "extendSelection", direction: "left", unit: "beat" },
      { type: "copy" },
    ]);
    // Efter tre fjärdedelar ryms bara en fjärdedel till i Takten
    const target = run(createEditor(), quarters(3)).score;

    const state = run(source, [{ type: "openScore", score: target }, at(0, 2), { type: "paste" }]);

    expect(state.score.tracks[0].bars.map((b) => b.beats.map((beat) => beat.duration))).toEqual([[4, 4, 4], [2]]);
    expect(fretsOf(state)[0]).toEqual([0, 1, 1]);
    expect(state.cursor).toMatchObject({ bar: 1, beat: 0 });
  });

  it("inklistring ångras som en enhet", () => {
    const before = run(filled(2), [at(0, 0), extend("right"), extend("right"), { type: "copy" }, at(1, 3)]);
    const pasted = apply(before, { type: "paste" });

    expect(pasted.score.tracks[0].bars).toHaveLength(3);
    expect(apply(pasted, { type: "undo" }).score).toEqual(before.score);
  });

  it("att klistra in utan något kopierat gör ingenting", () => {
    const state = filled(2);

    expect(apply(state, { type: "paste" }).score).toBe(state.score);
  });

  it("utan markering kopieras ingenting", () => {
    const state = run(filled(2), [{ type: "copy" }, { type: "paste" }]);

    expect(state.score).toEqual(filled(2).score);
  });

  it("det kopierade finns kvar efter ångra och i ett annat Partitur som öppnas", () => {
    const copied = run(filled(2), [at(0, 0), extend("right"), { type: "copy" }]);
    const opened = run(copied, [{ type: "openScore", score: createEditor().score }, { type: "paste" }]);

    expect(fretsOf(opened)[0]).toEqual([0, 1]);
  });
});

describe("ta bort markering", () => {

  it("tar bort de markerade slagen, och markören hamnar där markeringen började", () => {
    const state = run(filled(3), [at(0, 1), extend("right"), { type: "deleteSelection" }]);

    expect(fretsOf(state)).toEqual([[0, 3], [4, 5, 6, 7], [8, 9, 10, 11]]);
    expect(state.cursor).toMatchObject({ bar: 0, beat: 1 });
    expect(state.selection).toBeNull();
  });

  it("hela markerade Takter tas bort, och delvis markerade Takter behåller resten av sina slag", () => {
    const state = run(filled(3), [at(0, 2), extend("right"), extend("right"), extend("right"), extend("right"), extend("right"), extend("right"), { type: "deleteSelection" }]);

    expect(fretsOf(state)).toEqual([[0, 1], [9, 10, 11]]);
    expect(state.cursor).toMatchObject({ bar: 0, beat: 1 });
  });

  it("med en markering tar Delete och Shift+Delete bort markeringen i stället för en ton eller ett slag", () => {
    const selected = run(filled(3), [at(1, 0), extend("right", "bar")]);

    for (const type of ["deleteNote", "deleteBeat"] as const) {
      expect(fretsOf(apply(selected, { type })), type).toEqual([[0, 1, 2, 3], [8, 9, 10, 11]]);
    }
  });

  it("att ta bort allt lämnar en Takt med en paus", () => {
    const state = run(filled(3), [at(0, 0), extend("right", "bar"), extend("right", "bar"), extend("right", "bar"), { type: "deleteSelection" }]);

    expect(state.score.tracks[0].bars).toEqual([{ beats: [{ duration: 4, notes: [] }] }]);
    expect(state.cursor).toMatchObject({ bar: 0, beat: 0 });
  });

  it("ångras som en enhet", () => {
    const selected = run(filled(3), [at(0, 2), extend("right", "bar"), extend("right", "bar")]);
    const deleted = apply(selected, { type: "deleteSelection" });

    expect(apply(deleted, { type: "undo" }).score).toEqual(selected.score);
  });

  it("utan markering gör det ingenting", () => {
    const state = filled(3);

    expect(apply(state, { type: "deleteSelection" }).score).toBe(state.score);
  });
});

describe("infoga och ta bort Takter", () => {
  const threeFour: TimeSignature = { beats: 3, beatValue: 4 };

  it("en tom Takt infogas efter markörens Takt, fylld med pauser i taktarten, och markören går dit", () => {
    const state = run(filled(3), [at(0, 2), { type: "insertBarAfter" }]);

    expect(fretsOf(state)).toEqual([[0, 1, 2, 3], [undefined, undefined, undefined, undefined], [4, 5, 6, 7], [8, 9, 10, 11]]);
    expect(beatsOf(state, 1).every((b) => b.duration === 4)).toBe(true);
    expect(state.cursor).toMatchObject({ bar: 1, beat: 0 });
    expect(invalidBars(state.score)).toEqual([]);
  });

  it("en tom Takt infogas före markörens Takt, även före den första", () => {
    const state = run(filled(3), [at(0, 2), { type: "insertBarBefore" }]);

    expect(fretsOf(state)[0]).toEqual([undefined, undefined, undefined, undefined]);
    expect(fretsOf(state)[1]).toEqual([0, 1, 2, 3]);
    expect(state.cursor).toMatchObject({ bar: 0, beat: 0 });
  });

  it("den nya Takten följer taktarten som gäller där, och ett Byte ligger kvar i sin Takt", () => {
    const changed = run(filled(3), [at(1), { type: "setBarTimeSignature", timeSignature: threeFour }]);
    const before = run(changed, [{ type: "insertBarBefore" }]);
    const after = run(changed, [{ type: "insertBarAfter" }]);

    expect(beatsOf(before, 1)).toHaveLength(4);
    expect(before.score.tracks[0].bars[2].timeSignature).toEqual(threeFour);
    expect(beatsOf(after, 2)).toHaveLength(3);
    expect(after.score.tracks[0].bars[2].timeSignature).toBeUndefined();
  });

  it("en Takt med 6/8 fylls med sex åttondelspauser", () => {
    const start = apply(createEditor(), { type: "setTimeSignature", timeSignature: { beats: 6, beatValue: 8 } });
    const state = apply(start, { type: "insertBarAfter" });

    expect(beatsOf(state, 1)).toEqual(Array.from({ length: 6 }, () => ({ duration: 8, notes: [] })));
  });

  it("markörens Takt tas bort och markören hamnar i Takten som kommer efter", () => {
    const state = run(filled(3), [at(1, 2), { type: "deleteBar" }]);

    expect(fretsOf(state)).toEqual([[0, 1, 2, 3], [8, 9, 10, 11]]);
    expect(state.cursor).toMatchObject({ bar: 1, beat: 0 });
  });

  it("tas den sista Takten bort hamnar markören i den nya sista", () => {
    const state = run(filled(3), [{ type: "deleteBar" }]);

    expect(state.cursor).toMatchObject({ bar: 1, beat: 0 });
  });

  it("den enda Takten blir en paus i stället för att försvinna", () => {
    const state = run(createEditor(), [{ type: "enterFret", fret: 5 }, { type: "deleteBar" }]);

    expect(state.score.tracks[0].bars).toEqual([{ beats: [{ duration: 4, notes: [] }] }]);
  });

  it("ett Byte i en borttagen Takt gäller från nästa Takt, så att den behåller sin taktart och sitt tempo", () => {
    const changed = run(filled(3), [
      at(1),
      { type: "setBarTimeSignature", timeSignature: threeFour },
      { type: "setBarTempo", tempo: 90 },
    ]);
    const state = apply(changed, { type: "deleteBar" });

    expect(state.score.tracks[0].bars[1]).toMatchObject({ timeSignature: threeFour, tempo: 90 });
  });

  it("tas den första Takten bort blir det som gällde i den nya första Takten Partiturets start", () => {
    const changed = run(filled(3), [at(1), { type: "setBarTempo", tempo: 90 }]);
    const state = run(changed, [at(0), { type: "deleteBar" }]);

    expect(state.score.tempo).toBe(90);
    expect(state.score.tracks[0].bars[0].tempo).toBeUndefined();
  });

  it("repriser följer med sin Takt och försvinner med den", () => {
    const repeated = run(filled(3), [at(1), { type: "toggleRepeatStart" }, at(2), { type: "toggleRepeatEnd" }]);
    const inserted = run(repeated, [at(1), { type: "insertBarBefore" }]);
    const deleted = run(repeated, [at(1), { type: "deleteBar" }]);

    expect(inserted.score.tracks[0].bars.map((b) => [b.repeatStart, b.repeatEnd])).toEqual([
      [undefined, undefined],
      [undefined, undefined],
      [true, undefined],
      [undefined, 2],
    ]);
    expect(deleted.score.tracks[0].bars.map((b) => [b.repeatStart, b.repeatEnd])).toEqual([
      [undefined, undefined],
      [undefined, 2],
    ]);
  });

  it("infoga och ta bort Takt ångras som en enhet", () => {
    const start = run(filled(3), [at(1, 2)]);
    for (const type of ["insertBarBefore", "insertBarAfter", "deleteBar"] as const) {
      const changed = apply(start, { type });
      expect(changed.score, type).not.toEqual(start.score);
      const undone = apply(changed, { type: "undo" });
      expect(undone.score, type).toEqual(start.score);
      expect(undone.cursor, type).toEqual(start.cursor);
    }
  });
});

describe("Ackordnamn och Anteckning", () => {
  function text(field: BeatText, value: string): Command {
    return { type: "setBeatText", field, text: value };
  }

  it("sätter Ackordnamnet och Anteckningen på markörens slag, utan blanksteg runt texten", () => {
    const state = run(filled(1), [at(0, 1), text("chordName", "  Am7 "), text("annotation", "let ring")]);

    expect(beatsOf(state)[1]).toMatchObject({ chordName: "Am7", annotation: "let ring" });
    expect(beatsOf(state)[0].chordName).toBeUndefined();
  });

  it("tom text tar bort fältet", () => {
    const state = run(filled(1), [text("chordName", "G"), text("chordName", "   ")]);

    expect(beatsOf(state)[3]).not.toHaveProperty("chordName");
  });

  it("går att sätta på en paus, och en paus behåller Ackordnamnet", () => {
    const state = run(createEditor(), [text("chordName", "E"), { type: "insertRest" }]);

    expect(beatsOf(state)[0]).toMatchObject({ notes: [], chordName: "E" });
  });

  it("avvisar text som är för lång", () => {
    const state = run(createEditor(), [
      text("chordName", "x".repeat(MAX_BEAT_TEXT_LENGTH.chordName + 1)),
      text("annotation", "x".repeat(MAX_BEAT_TEXT_LENGTH.annotation + 1)),
    ]);

    expect(beatsOf(state)[0]).toEqual({ duration: 4, notes: [] });
  });

  it("går att ångra, och samma text igen blir inget nytt steg", () => {
    const state = run(createEditor(), [text("chordName", "C"), text("chordName", "C")]);

    expect(state.history.undo).toHaveLength(1);
    expect(beatsOf(apply(state, { type: "undo" }))[0].chordName).toBeUndefined();
  });

  it("ändrar bara markörens slag även med en markering (markören står där markeringen slutar)", () => {
    const state = run(filled(1), [at(0, 0), extend("right"), text("chordName", "D")]);

    expect(beatsOf(state).map((beat) => beat.chordName)).toEqual([undefined, "D", undefined, undefined]);
  });

  it("följer med slaget när det kopieras och klistras in", () => {
    const state = run(filled(2), [
      at(0, 0),
      text("chordName", "A"),
      text("annotation", "x2"),
      extend("right"),
      { type: "copy" },
      at(1, 0),
      { type: "paste" },
    ]);

    expect(beatsOf(state, 1)[0]).toMatchObject({ chordName: "A", annotation: "x2" });
    expect(beatsOf(state, 1)[1].chordName).toBeUndefined();
  });
});

describe("grannslaget till markören", () => {
  it("är nästa eller föregående slag, även i en annan Takt, på samma sträng", () => {
    const state = run(filled(2), [at(0, 3), { type: "moveCursor", direction: "down" }]);

    expect(neighbourBeat(state, "right")).toEqual({ track: 0, bar: 1, beat: 0, string: 2 });
    expect(neighbourBeat(state, "left")).toEqual({ track: 0, bar: 0, beat: 2, string: 2 });
  });

  it("saknas vid Partiturets början och slut, så att inga nya slag skapas", () => {
    const state = filled(1);

    expect(neighbourBeat(state, "right")).toBeNull();
    expect(neighbourBeat(apply(state, at(0, 0)), "left")).toBeNull();
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

/** `count` fulla Takter i 4/4 med banden 0, 1, 2 … och markören på det sista slaget. */
function filled(count: number): EditorState {
  return run(createEditor(), quarters(4 * count));
}

/** Flyttar markören till slaget på sträng 1, som ett klick i notbilden. */
function at(bar: number, beat = 0): Command {
  return { type: "moveCursorTo", position: { track: 0, bar, beat, string: 1 } };
}

function extend(direction: Side, unit: SelectionUnit = "beat"): Command {
  return { type: "extendSelection", direction, unit };
}

/** Banden på sträng 1, Takt för Takt. */
function fretsOf(state: EditorState): (number | undefined)[][] {
  return state.score.tracks[0].bars.map((bar) => bar.beats.map((beat) => beat.notes[0]?.fret));
}
