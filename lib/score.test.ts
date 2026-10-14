import { describe, expect, it } from "vitest";
import { createEditor } from "./editor";
import { beatTicks, restsFor, withValidTies, type Beat, type Note, type Score } from "./score";

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
