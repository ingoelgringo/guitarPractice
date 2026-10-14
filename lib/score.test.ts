import { describe, expect, it } from "vitest";
import { beatTicks, restsFor, type Beat } from "./score";

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
