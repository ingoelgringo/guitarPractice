import { describe, expect, it } from "vitest";
import { createEditor } from "./editor";
import type { Bar, Beat, Duration, Score } from "./score";
import { invalidBars } from "./validation";

describe("invalidBars", () => {
  it("ett nytt Partitur har inga felaktiga Takter, eftersom den sista Takten får vara ofärdig", () => {
    expect(invalidBars(createEditor().score)).toEqual([]);
  });

  it("fulla Takter är giltiga", () => {
    expect(invalidBars(scoreWithBars([[4, 4, 4, 4], [1], [2, 8, 8, 4]]))).toEqual([]);
  });

  it("pekar ut Takter med för få och för många slag", () => {
    const result = invalidBars(scoreWithBars([[4, 4, 4], [4, 4, 4, 4], [2, 2, 4], [4]]));

    expect(result).toEqual([
      { track: 0, bar: 0, problem: "tooShort" },
      { track: 0, bar: 2, problem: "tooLong" },
    ]);
  });

  it("den sista Takten flaggas om den är för lång", () => {
    expect(invalidBars(scoreWithBars([[1, 4]]))).toEqual([{ track: 0, bar: 0, problem: "tooLong" }]);
  });

  it("räknar med punktering och trioler", () => {
    const dottedHalf: Beat = { duration: 2, dotted: true, notes: [] };
    const tripletEighth: Beat = { duration: 8, triplet: true, notes: [] };
    const score = createEditor().score;
    score.tracks[0].bars = [
      { beats: [dottedHalf, tripletEighth, tripletEighth, tripletEighth] },
      { beats: [dottedHalf, tripletEighth, tripletEighth] },
      { beats: [] },
    ];

    expect(invalidBars(score)).toEqual([{ track: 0, bar: 1, problem: "tooShort" }]);
  });

  it("följer Partiturets taktart", () => {
    const score = scoreWithBars([[4, 4, 4], [4, 4, 4, 4], [4]]);
    score.timeSignature = { beats: 3, beatValue: 4 };

    expect(invalidBars(score)).toEqual([{ track: 0, bar: 1, problem: "tooLong" }]);
  });

  it("följer taktartsbyten från Takten där de står", () => {
    const score = scoreWithBars([[4, 4, 4, 4], [4, 4, 4], [4, 4, 4], [2, 2], [4]]);
    score.tracks[0].bars[1].timeSignature = { beats: 3, beatValue: 4 };
    score.tracks[0].bars[3].timeSignature = { beats: 6, beatValue: 8 };

    expect(invalidBars(score)).toEqual([{ track: 0, bar: 3, problem: "tooLong" }]);
  });
});

function scoreWithBars(bars: Duration[][]): Score {
  const score = createEditor().score;
  score.tracks[0].bars = bars.map(
    (durations): Bar => ({ beats: durations.map((duration) => ({ duration, notes: [] })) }),
  );
  return score;
}
