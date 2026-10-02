import { model } from "@coderline/alphatab";
import { describe, expect, it } from "vitest";
import { createEditor } from "./editor";
import type { Beat, Score } from "./score";
import { toAlphaTab } from "./toAlphaTab";

describe("toAlphaTab", () => {
  it("ett tomt Partitur blir ett Spår med 6 strängar och en Takt med en fjärdedelspaus", () => {
    const result = toAlphaTab(createEditor().score);

    expect(result.tracks).toHaveLength(1);
    const staff = result.tracks[0].staves[0];
    expect(staff.tuning).toEqual([64, 59, 55, 50, 45, 40]);
    expect(staff.bars).toHaveLength(1);
    const beats = staff.bars[0].voices[0].beats;
    expect(beats).toHaveLength(1);
    expect(beats[0].isRest).toBe(true);
    expect(beats[0].duration).toBe(model.Duration.Quarter);
  });

  it("Partiturets taktart följer med till alphaTab", () => {
    const score = createEditor().score;
    score.timeSignature = { beats: 3, beatValue: 4 };

    const masterBar = toAlphaTab(score).masterBars[0];

    expect([masterBar.timeSignatureNumerator, masterBar.timeSignatureDenominator]).toEqual([3, 4]);
  });

  it("toner får rätt tonhöjd i standardstämning, med sträng 1 som ljusa e", () => {
    const result = toAlphaTab(
      scoreWithBeats([
        { duration: 4, notes: [{ string: 1, fret: 0 }] },
        { duration: 4, notes: [{ string: 6, fret: 3 }] },
        { duration: 4, notes: [{ string: 3, fret: 2 }] },
      ]),
    );

    const beats = result.tracks[0].staves[0].bars[0].voices[0].beats;
    // E4 = 64, G2 = 43, A3 = 57
    expect(beats.map((b) => b.notes[0].realValue)).toEqual([64, 43, 57]);
    expect(beats.map((b) => b.notes[0].fret)).toEqual([0, 3, 2]);
  });

  it("alla Notvärden från helnot till trettiotvåondel följer med", () => {
    const durations = [1, 2, 4, 8, 16, 32] as const;
    const beats = firstBarBeats(scoreWithBeats(durations.map((duration) => ({ duration, notes: [] }))));

    expect(beats.map((b) => b.duration)).toEqual([
      model.Duration.Whole,
      model.Duration.Half,
      model.Duration.Quarter,
      model.Duration.Eighth,
      model.Duration.Sixteenth,
      model.Duration.ThirtySecond,
    ]);
  });

  it("punkterade slag får en punkt och varar en och en halv gång så länge", () => {
    const [dotted, plain] = firstBarBeats(
      scoreWithBeats([
        { duration: 4, dotted: true, notes: [{ string: 1, fret: 0 }] },
        { duration: 4, notes: [{ string: 1, fret: 0 }] },
      ]),
    );

    expect(dotted.dots).toBe(1);
    expect(plain.dots).toBe(0);
    expect(dotted.playbackDuration).toBe(plain.playbackDuration * 1.5);
  });

  it("trioler blir 3:2-tupletter som varar två tredjedelar så länge", () => {
    const beats = firstBarBeats(
      scoreWithBeats([
        { duration: 8, triplet: true, notes: [{ string: 1, fret: 0 }] },
        { duration: 8, triplet: true, notes: [{ string: 1, fret: 2 }] },
        { duration: 8, triplet: true, notes: [{ string: 1, fret: 3 }] },
        { duration: 8, notes: [{ string: 1, fret: 5 }] },
      ]),
    );

    expect(beats.slice(0, 3).map((b) => [b.tupletNumerator, b.tupletDenominator])).toEqual([
      [3, 2],
      [3, 2],
      [3, 2],
    ]);
    expect(beats[3].hasTuplet).toBe(false);
    expect(beats[0].playbackDuration * 3).toBe(beats[3].playbackDuration * 2);
  });

  it("slag utan toner blir pauser med sitt Notvärde", () => {
    const [rest] = firstBarBeats(scoreWithBeats([{ duration: 8, dotted: true, notes: [] }]));

    expect(rest.isRest).toBe(true);
    expect(rest.duration).toBe(model.Duration.Eighth);
    expect(rest.dots).toBe(1);
  });

  it("ett ackord blir ett slag med en ton per sträng, med rätt band i tabben och tonhöjd i notsystemet", () => {
    // C-dur i första läget: x32010
    const [chord] = firstBarBeats(
      scoreWithBeats([
        {
          duration: 2,
          notes: [
            { string: 1, fret: 0 },
            { string: 2, fret: 1 },
            { string: 3, fret: 0 },
            { string: 4, fret: 2 },
            { string: 5, fret: 3 },
          ],
        },
      ]),
    );

    expect(chord.isRest).toBe(false);
    expect(chord.duration).toBe(model.Duration.Half);
    const notes = [...chord.notes].sort((a, b) => a.realValue - b.realValue);
    // C3 = 48, E3 = 52, G3 = 55, C4 = 60, E4 = 64
    expect(notes.map((n) => n.realValue)).toEqual([48, 52, 55, 60, 64]);
    // alphaTab numrerar strängar från den grövsta: vår sträng 5 är alphaTabs sträng 2
    expect(notes.map((n) => [n.string, n.fret])).toEqual([
      [2, 3],
      [3, 2],
      [4, 0],
      [5, 1],
      [6, 0],
    ]);
  });
});

function firstBarBeats(score: Score): model.Beat[] {
  return toAlphaTab(score).tracks[0].staves[0].bars[0].voices[0].beats;
}

function scoreWithBeats(beats: Beat[]): Score {
  const score = createEditor().score;
  score.tracks[0].bars[0].beats = beats;
  return score;
}
