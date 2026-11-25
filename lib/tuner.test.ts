import { describe, expect, it } from "vitest";
import { frequencyToNote, initialTunerState, tunerStep, type TunerConfig, type TunerState } from "./tuner";

/** Standardstämning för gitarr 6, sträng 1 först. */
const STANDARD = [64, 59, 55, 50, 45, 40];
const config: TunerConfig = { strings: STANDARD, a4: 440, lockedString: null };

/** Frekvensen som ligger `cents` från MIDI-tonen, med A4 = 440. */
function hz(midi: number, cents = 0): number {
  return 440 * 2 ** ((midi - 69 + cents / 100) / 12);
}

/** Matar in frekvenser med 50 ms mellanrum, från tiden 0. */
function feed(frequencies: (number | null)[], cfg: TunerConfig = config, from: TunerState = initialTunerState()): TunerState {
  return frequencies.reduce<TunerState>(
    (state, frequency, i) => tunerStep(state, { frequency, timeMs: i * 50 }, cfg),
    from,
  );
}

describe("Stämmaren", () => {
  it("visar inget innan någon ton har hörts", () => {
    expect(initialTunerState().target).toBeNull();
    expect(feed([null, null]).target).toBeNull();
  });

  it("väljer den närmaste strängen när ingen sträng är låst", () => {
    const state = feed([hz(45, 12)]);
    expect(state.target).toEqual({ kind: "string", string: 5, cents: expect.closeTo(12, 1) });
  });

  it("visar avvikelsen mot den låsta strängen, även när en annan sträng ligger närmare", () => {
    const state = feed([hz(45)], { ...config, lockedString: 6 });
    expect(state.target).toEqual({ kind: "string", string: 6, cents: expect.closeTo(500, 1) });
  });

  it("visar den kromatiska tonen när den ligger mer än en halvton från alla strängar", () => {
    // F#2 ligger två halvtoner över E2 och tre under A2.
    expect(feed([hz(42, -8)]).target).toEqual({ kind: "chromatic", midi: 42, cents: expect.closeTo(-8, 1) });
  });

  it("visar strängen när tonen ligger högst en halvton från den", () => {
    expect(feed([hz(41, -10)]).target).toEqual({ kind: "string", string: 6, cents: expect.closeTo(90, 1) });
  });

  describe("hysteres", () => {
    it("stannar på strängen när tonen glider lite över gränsen för kromatisk visning", () => {
      const state = feed([hz(41, -5), hz(41, 8)]);
      expect(state.target).toEqual({ kind: "string", string: 6, cents: expect.closeTo(108, 1) });
    });

    it("släpper strängen när tonen har glidit tydligt över gränsen", () => {
      expect(feed([hz(41, -5), hz(41, 25)]).target).toMatchObject({ kind: "chromatic", midi: 41 });
    });

    it("byter inte sträng förrän en annan sträng ligger tydligt närmare", () => {
      const close: TunerConfig = { ...config, strings: [41, 40] };
      expect(feed([hz(40), hz(40, 55)], close).target).toMatchObject({ kind: "string", string: 2 });
      expect(feed([hz(40), hz(40, 70)], close).target).toMatchObject({ kind: "string", string: 1 });
    });
  });

  describe("stämd sträng", () => {
    const repeat = <T,>(value: T, times: number): T[] => Array.from({ length: times }, () => value);

    it("ger strängen en bock när den har legat inom ±3 cent i en halv sekund", () => {
      // 11 avläsningar med 50 ms mellanrum: från 0 till 500 ms.
      expect(feed(repeat(hz(40, 2.5), 11)).tuned).toEqual([6]);
    });

    it("ger ingen bock före en halv sekund", () => {
      expect(feed(repeat(hz(40, 2.5), 10)).tuned).toEqual([]);
    });

    it("ger ingen bock utanför ±3 cent", () => {
      expect(feed(repeat(hz(40, 4), 20)).tuned).toEqual([]);
    });

    it("börjar om när tonen lämnar toleransen", () => {
      const frequencies = [...repeat(hz(40, 1), 6), hz(40, 6), ...repeat(hz(40, 1), 6)];
      expect(feed(frequencies).tuned).toEqual([]);
    });

    it("börjar om när tonen tystnar", () => {
      const frequencies = [...repeat(hz(40, 1), 6), null, ...repeat(hz(40, 1), 6)];
      expect(feed(frequencies).tuned).toEqual([]);
    });

    it("behåller bocken när man går vidare till nästa sträng", () => {
      const state = feed([...repeat(hz(40), 11), null, ...repeat(hz(45, 1), 11), hz(45, 30)]);
      expect(state.tuned).toEqual([5, 6]);
      expect(state.target).toMatchObject({ kind: "string", string: 5 });
    });

    it("ger den låsta strängen en bock", () => {
      expect(feed(repeat(hz(45), 11), { ...config, lockedString: 5 }).tuned).toEqual([5]);
    });

    it("ger ingen bock för en kromatisk ton", () => {
      expect(feed(repeat(hz(42), 20)).tuned).toEqual([]);
    });
  });

  it("håller kvar den senaste visningen när tonen tystnar", () => {
    expect(feed([hz(45, 12), null]).target).toMatchObject({ kind: "string", string: 5 });
  });
});

describe("Frekvens till ton", () => {
  it.each([
    [440, 440, 69, 0],
    [82.41, 440, 40, 0], // E2, låg E på gitarr
    [30.87, 440, 23, 0], // B0, låg B på bas 5
    [329.63, 440, 64, 0], // E4, ljusa e
    [432, 432, 69, 0],
    [440, 432, 69, 31.77], // 440 Hz är 31,77 cent högt när A4 = 432
    [452, 440, 69, 46.58],
    [455, 440, 70, -41.97], // närmare A#4 än A4
  ])("%d Hz med A4 = %d Hz är MIDI %d med %d cent", (frequency, a4, midi, cents) => {
    const note = frequencyToNote(frequency, a4);
    expect(note.midi).toBe(midi);
    expect(note.cents).toBeCloseTo(cents, 0);
  });
});
