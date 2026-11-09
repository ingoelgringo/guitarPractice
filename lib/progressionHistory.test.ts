import { describe, expect, it } from "vitest";
import {
  addSection,
  newProgression,
  placeChord,
  type Position,
  type Progression,
  setSectionBars,
  setTempo,
  setTimeSignature,
  triad,
} from "./progression";
import { EMPTY_HISTORY, historyKey, MAX_HISTORY, type ProgressionHistory, record, redo, undo } from "./progressionHistory";

const at = (progression: Progression, bar: number, pulse: number): Position => ({
  section: progression.sections[0].id,
  bar,
  pulse,
});

/** Gör ändringen och lägger den i historiken, som editorn gör. */
function change(state: { progression: Progression; history: ProgressionHistory }, next: Progression) {
  return { progression: next, history: record(state.history, state.progression, next) };
}

describe("historiken för Ackordföljden", () => {
  it("ångrar och gör om en ändring", () => {
    const start = newProgression();
    const state = change({ progression: start, history: EMPTY_HISTORY }, setTempo(start, 120));

    const undone = undo(state.history, state.progression);
    expect(undone?.progression).toBe(start);

    const redone = redo(undone!.history, undone!.progression);
    expect(redone?.progression.tempo).toBe(120);
  });

  it("ångrar flera ändringar i omvänd ordning", () => {
    let state = { progression: newProgression(), history: EMPTY_HISTORY };
    state = change(state, setTempo(state.progression, 120));
    state = change(state, placeChord(state.progression, at(state.progression, 0, 0), triad(0, "major")));
    state = change(state, addSection(state.progression, "Chorus"));

    let step = undo(state.history, state.progression)!;
    expect(step.progression.sections).toHaveLength(1);
    step = undo(step.history, step.progression)!;
    expect(step.progression.sections[0].chords).toEqual([]);
    step = undo(step.history, step.progression)!;
    expect(step.progression.tempo).toBe(100);
    expect(undo(step.history, step.progression)).toBeNull();
  });

  it("har inget att ångra eller göra om från början", () => {
    const progression = newProgression();
    expect(undo(EMPTY_HISTORY, progression)).toBeNull();
    expect(redo(EMPTY_HISTORY, progression)).toBeNull();
  });

  it("glömmer det som gick att göra om när en ny ändring görs", () => {
    let state = { progression: newProgression(), history: EMPTY_HISTORY };
    state = change(state, setTempo(state.progression, 120));
    const undone = undo(state.history, state.progression)!;
    state = change(undone, setTempo(undone.progression, 90));
    expect(redo(state.history, state.progression)).toBeNull();
  });

  it("lägger inte en ändring som inte ändrade något i historiken", () => {
    const progression = newProgression();
    const history = record(EMPTY_HISTORY, progression, setTempo(progression, progression.tempo));
    expect(history).toBe(EMPTY_HISTORY);
  });

  it("minns som mest de senaste ändringarna", () => {
    let state = { progression: newProgression(), history: EMPTY_HISTORY };
    for (let i = 0; i < MAX_HISTORY + 5; i++) state = change(state, setTempo(state.progression, 41 + i));
    let undos = 0;
    let step: { progression: Progression; history: ProgressionHistory } | null = state;
    while ((step = undo(step.history, step.progression))) undos++;
    expect(undos).toBe(MAX_HISTORY);
  });
});

describe("byte av taktart", () => {
  it("tar bort Ackord på Taktslag som försvinner, och ångra återställer dem", () => {
    let progression = newProgression();
    progression = placeChord(progression, at(progression, 0, 0), triad(0, "major"));
    progression = placeChord(progression, at(progression, 0, 3), triad(7, "major"));
    progression = placeChord(progression, at(progression, 1, 2), triad(9, "minor"));
    const before = progression;

    const state = change({ progression, history: EMPTY_HISTORY }, setTimeSignature(progression, "2/4"));
    expect(state.progression.sections[0].chords.map(({ bar, pulse }) => [bar, pulse])).toEqual([[0, 0]]);

    const undone = undo(state.history, state.progression)!;
    expect(undone.progression).toEqual(before);
    expect(undone.progression.timeSignature).toBe("4/4");
  });
});

describe("en Del som minskar", () => {
  it("tar bort Ackorden i Takterna som försvinner, och ångra återställer dem", () => {
    let progression = newProgression();
    progression = placeChord(progression, at(progression, 0, 0), triad(0, "major"));
    progression = placeChord(progression, at(progression, 3, 0), triad(7, "major"));
    const before = progression;

    const state = change({ progression, history: EMPTY_HISTORY }, setSectionBars(progression, progression.sections[0].id, 2));
    expect(state.progression.sections[0].chords.map(({ bar }) => bar)).toEqual([0]);

    expect(undo(state.history, state.progression)!.progression).toEqual(before);
  });
});

describe("tangenterna", () => {
  const press = (key: string, modifiers: Partial<{ ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean }> = {}) =>
    historyKey({ key, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...modifiers });

  it("Ctrl+Z ångrar och Ctrl+Y eller Ctrl+Shift+Z gör om", () => {
    expect(press("z", { ctrlKey: true })).toBe("undo");
    expect(press("y", { ctrlKey: true })).toBe("redo");
    expect(press("Z", { ctrlKey: true, shiftKey: true })).toBe("redo");
  });

  it("Cmd fungerar som Ctrl", () => {
    expect(press("z", { metaKey: true })).toBe("undo");
  });

  it("andra tangenter, och Z utan Ctrl, gör inget", () => {
    expect(press("z")).toBeNull();
    expect(press("x", { ctrlKey: true })).toBeNull();
    expect(press("z", { ctrlKey: true, altKey: true })).toBeNull();
  });
});
