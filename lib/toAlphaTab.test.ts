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
});

function scoreWithBeats(beats: Beat[]): Score {
  const score = createEditor().score;
  score.tracks[0].bars[0].beats = beats;
  return score;
}
