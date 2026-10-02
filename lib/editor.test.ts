import { describe, expect, it } from "vitest";
import { apply, createEditor, type Command, type EditorState } from "./editor";

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
});

function run(state: EditorState, commands: Command[]): EditorState {
  return commands.reduce(apply, state);
}
