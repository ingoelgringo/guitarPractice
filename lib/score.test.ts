import { describe, expect, it } from "vitest";
import { createEditor } from "./editor";
import { beatTicks, restsFor, shiftBeats, withValidTies, type Bar, type Beat, type Note, type Score } from "./score";

/** Ticks för ett Notvärde, t.ex. `ticks(4)` för en fjärdedel. */
function ticks(duration: Beat["duration"], flags: Pick<Beat, "dotted" | "triplet"> = {}): number {
  return beatTicks({ duration, ...flags });
}

describe("Pausregeln", () => {
  it("fjärdedel till sextondel: sextondelspaus och åttondelspaus", () => {
    expect(restsFor(ticks(16), ticks(4) - ticks(16))).toEqual([
      { duration: 16, notes: [] },
      { duration: 8, notes: [] },
    ]);
  });

  it("punkterad fjärdedel till åttondel: två åttondelspauser", () => {
    expect(restsFor(ticks(8), ticks(4, { dotted: true }) - ticks(8))).toEqual([
      { duration: 8, notes: [] },
      { duration: 8, notes: [] },
    ]);
  });

  it("halvnot till sextondel: sextondelspaus, åttondelspaus och fjärdedelspaus", () => {
    expect(restsFor(ticks(16), ticks(2) - ticks(16))).toEqual([
      { duration: 16, notes: [] },
      { duration: 8, notes: [] },
      { duration: 4, notes: [] },
    ]);
  });

  it("pauserna börjar på en jämn multipel av sitt värde, räknat från Taktens början", () => {
    // Från andra fjärdedelen ryms en halvnot, men den skulle börja mitt i en halvnot
    expect(restsFor(ticks(4), ticks(2))).toEqual([
      { duration: 4, notes: [] },
      { duration: 4, notes: [] },
    ]);
  });

  it("tid efter en triol fylls med triolpauser", () => {
    // Fjärdedel till fjärdedelstriol lämnar en åttondelstriol
    expect(restsFor(ticks(4, { triplet: true }), ticks(8, { triplet: true }))).toEqual([
      { duration: 8, triplet: true, notes: [] },
    ]);
  });

  it("ingen tid ger inga pauser", () => {
    expect(restsFor(0, 0)).toEqual([]);
  });

  it("tid som inte går att fylla med pauser ger null", () => {
    // Punkterad trettiotvåondel till trettiotvåondelstriol lämnar en tredjedel av en trettiotvåondel
    expect(restsFor(ticks(32, { triplet: true }), ticks(32, { dotted: true }) - ticks(32, { triplet: true }))).toBeNull();
  });
});

describe("Bindebågar", () => {
  /** Ett Partitur med en Takt med `beats`, och eventuellt en Takt till med `next`. */
  function scoreWith(beats: Beat[], next?: Beat[]): Score {
    const score = createEditor().score;
    score.tracks[0].bars = [{ beats }, ...(next ? [{ beats: next }] : [])];
    return score;
  }

  const C: Note = { string: 2, fret: 1 };

  it("en giltig Bindebåge står kvar, även över ett taktstreck, och samma Partitur kommer tillbaka", () => {
    // Den mellersta halvan är både en sista och en första halva, så bara den sista får en bend
    const score = scoreWith(
      [
        { duration: 2, notes: [{ ...C, palmMute: true }], chordName: "C", annotation: "let ring" },
        { duration: 2, notes: [{ ...C, palmMute: true }], tiedFromPrevious: true },
      ],
      [{ duration: 1, notes: [{ ...C, palmMute: true, bend: 1 }], tiedFromPrevious: true }],
    );

    expect(withValidTies(score)).toBe(score);
  });

  it.each<[string, Beat, Beat]>([
    ["inget slag före", { duration: 4, notes: [C], tiedFromPrevious: true }, { duration: 4, notes: [] }],
    ["en paus", { duration: 4, notes: [] }, { duration: 4, notes: [], tiedFromPrevious: true }],
    ["ett annat band", { duration: 4, notes: [C] }, { duration: 4, notes: [{ ...C, fret: 3 }], tiedFromPrevious: true }],
    ["en ton till", { duration: 4, notes: [C] }, { duration: 4, notes: [C, { string: 3, fret: 0 }], tiedFromPrevious: true }],
    ["en ton färre", { duration: 4, notes: [C, { string: 3, fret: 0 }] }, { duration: 4, notes: [C], tiedFromPrevious: true }],
    ["palm mute på bara ena halvan", { duration: 4, notes: [{ ...C, palmMute: true }] }, { duration: 4, notes: [C], tiedFromPrevious: true }],
    ["en bend på första halvan", { duration: 4, notes: [{ ...C, bend: 2 }] }, { duration: 4, notes: [C], tiedFromPrevious: true }],
    ["ett Ackordnamn på andra halvan", { duration: 4, notes: [C] }, { duration: 4, notes: [C], tiedFromPrevious: true, chordName: "C" }],
    ["en Anteckning på andra halvan", { duration: 4, notes: [C] }, { duration: 4, notes: [C], tiedFromPrevious: true, annotation: "x" }],
  ])("en Bindebåge med %s bryts", (_, first, second) => {
    const score = scoreWith([first, second]);
    const result = withValidTies(score);

    // Bara Bindebågen försvinner, allt annat står kvar
    const untied = structuredClone(score);
    for (const beat of untied.tracks[0].bars[0].beats) delete beat.tiedFromPrevious;
    expect(result).toEqual(untied);
  });

  it("en förbindelse på första halvan bryter Bindebågen", () => {
    const score = scoreWith([
      { duration: 4, notes: [{ ...C, slide: true }] },
      { duration: 4, notes: [C], tiedFromPrevious: true },
    ]);

    expect(withValidTies(score).tracks[0].bars[0].beats[1].tiedFromPrevious).toBeUndefined();
  });
});

describe("Skjutning", () => {
  const C: Note = { string: 2, fret: 1 };
  const D: Note = { string: 2, fret: 3 };

  /** Ett Partitur i 4/4 med Takterna `bars`. */
  function scoreWith(...bars: Bar[]): Score {
    const score = createEditor().score;
    score.tracks[0].bars = bars;
    return score;
  }

  function note(duration: Beat["duration"], ...notes: Note[]): Beat {
    return { duration, notes };
  }

  function rest(duration: Beat["duration"]): Beat {
    return { duration, notes: [] };
  }

  function barsOf(score: Score | null): Beat[][] {
    return score!.tracks[0].bars.map((bar) => bar.beats);
  }

  it("Slagen läggs i Takten, och tid som blir över i sista Takten fylls med pauser", () => {
    const score = scoreWith({ beats: Array.from({ length: 8 }, () => note(8, C)) });

    const shifted = shiftBeats(score, 0, 0, [note(16, C), ...Array.from({ length: 7 }, () => note(8, C))]);

    expect(barsOf(shifted)).toEqual([[note(16, C), ...Array.from({ length: 7 }, () => note(8, C)), rest(16)]]);
  });

  it("en ton över ett taktstreck delas i bundna delar (som slås ihop i samma Takt), och en paus över ett taktstreck delas enligt Pausregeln", () => {
    const score = scoreWith({ beats: [note(4, C), note(4, C), note(4, C), note(4, D)] }, { beats: [rest(4), rest(4), rest(4), rest(4)] });

    const shifted = shiftBeats(score, 0, 0, [rest(16), ...barsOf(score).flat()]);

    expect(barsOf(shifted)).toEqual([
      [rest(16), note(4, C), note(4, C), note(4, C), { ...note(8, D), dotted: true }],
      [{ ...note(16, D), tiedFromPrevious: true }, rest(4), rest(4), rest(4), rest(16), rest(8)],
    ]);
  });

  it("Slag som inte ryms i sista Takten får nya Takter i samma taktart", () => {
    const score = scoreWith({ beats: [note(2, C), note(2, D)] });

    const shifted = shiftBeats(score, 0, 0, [rest(4), note(2, C), note(2, D)]);

    expect(barsOf(shifted)).toEqual([
      [rest(4), note(2, C), note(4, D)],
      [{ ...note(4, D), tiedFromPrevious: true }, rest(4), rest(2)],
    ]);
  });

  it("Texter hamnar på första delen, och bend och förbindelser på sista", () => {
    const bent: Note = { ...C, bend: 2, palmMute: true };
    const score = scoreWith({ beats: [note(1, C)] }, { beats: [note(1, C)] });

    const shifted = shiftBeats(score, 0, 0, [rest(2), { ...note(1, bent), chordName: "C", annotation: "x" }, note(2, C)]);

    expect(barsOf(shifted)).toEqual([
      [rest(2), { ...note(2, { ...C, palmMute: true }), chordName: "C", annotation: "x" }],
      [{ ...note(2, bent), tiedFromPrevious: true }, note(2, C)],
    ]);
  });

  it("vid flytt tillbaka tas en sista Takt bort som blir tom, men inte en som redan var tom", () => {
    const emptied = scoreWith({ beats: [note(2, C), note(2, C)] }, { beats: [note(2, D), rest(2)] });
    const alreadyEmpty = scoreWith({ beats: [note(2, C), note(2, C)] }, { beats: [rest(1)] });

    expect(barsOf(shiftBeats(emptied, 0, 0, [note(2, C), note(2, D), rest(2)]))).toEqual([[note(2, C), note(2, D)]]);
    expect(barsOf(shiftBeats(alreadyEmpty, 0, 0, [note(2, C), rest(1)]))).toEqual([
      [note(2, C), rest(2)],
      [rest(2), rest(2)],
    ]);
  });

  it("den enda Takten blir kvar som pauser", () => {
    const score = scoreWith({ beats: [note(1, C)] });

    expect(barsOf(shiftBeats(score, 0, 0, []))).toEqual([[rest(1)]]);
  });

  it("Byten och repriser sitter kvar på sin Takt, och Slagen läggs efter taktarten där", () => {
    const score = scoreWith(
      { beats: [note(4, C), note(4, C), note(4, C), note(4, C)] },
      { beats: [note(4, D), note(4, D), note(4, D)], timeSignature: { beats: 3, beatValue: 4 }, repeatStart: true },
      { beats: [rest(2), rest(4)], repeatEnd: 2 },
    );

    const shifted = shiftBeats(score, 0, 0, [rest(4), ...barsOf(score).flat()])!;

    expect(barsOf(shifted)).toEqual([
      [rest(4), note(4, C), note(4, C), note(4, C)],
      [note(4, C), note(4, D), note(4, D)],
      [note(4, D), rest(2)],
    ]);
    expect(shifted.tracks[0].bars.map((bar) => Object.fromEntries(Object.entries(bar).filter(([key]) => key !== "beats")))).toEqual([
      {},
      { timeSignature: { beats: 3, beatValue: 4 }, repeatStart: true },
      { repeatEnd: 2 },
    ]);
  });

  it("bundna halvor i samma Takt slås ihop när summan är ett Notvärde, eventuellt punkterat", () => {
    const tied = (beat: Beat): Beat => ({ ...beat, tiedFromPrevious: true });
    const score = scoreWith({ beats: [rest(1)] });

    const shifted = shiftBeats(score, 0, 0, [
      { ...note(8, C), chordName: "C" },
      tied(note(16, C)),
      tied(note(16, { ...C, bend: 1 })),
      note(8, D),
      tied({ ...note(8, D), dotted: true }),
      note(4, C),
      tied(note(8, C)),
    ]);

    expect(barsOf(shifted)).toEqual([
      [{ ...note(4, { ...C, bend: 1 }), chordName: "C" }, note(8, D), tied({ ...note(8, D), dotted: true }), { ...note(4, C), dotted: true }, rest(16)],
    ]);
  });

  it("en triol som skulle delas av ett taktstreck stoppar Skjutningen", () => {
    const triplet = (): Beat => ({ ...rest(8), triplet: true });
    const score = scoreWith({ beats: [rest(2), rest(4), triplet(), triplet(), triplet()] });

    expect(shiftBeats(score, 0, 0, [rest(16), ...barsOf(score).flat()])).toBeNull();
  });

  it("en triol som börjar vid ett taktstreck går över till nästa Takt", () => {
    const triplet = (): Beat => ({ ...note(8, C), triplet: true });
    const score = scoreWith({ beats: [rest(2), rest(4), triplet(), triplet(), triplet()] });

    expect(barsOf(shiftBeats(score, 0, 0, [rest(4), ...barsOf(score).flat()]))).toEqual([
      [rest(4), rest(2), rest(4)],
      [triplet(), triplet(), triplet(), rest(4), rest(2)],
    ]);
  });
});
