import { describe, expect, it } from "vitest";
import { frequencyToNote, initialTunerState, tunerNoteName, tunerStep, tunerStrings, type TunerConfig, type TunerState } from "./tuner";
import { stringInstrument } from "./tuning";

describe("Tonnamn i Stämmaren", () => {
  it.each([
    [40, "english", "E2"],
    [42, "english", "F♯2"],
    [63, "english", "E♭4"],
    [58, "english", "B♭3"],
    [59, "english", "B3"],
    [23, "english", "B0"],
    [60, "english", "C4"],
    [59, "swedish", "H3"],
    [58, "swedish", "B3"],
    [61, "swedish", "D♭4"],
  ] as const)("MIDI %d i %s läge är %s", (midi, mode, name) => {
    expect(tunerNoteName(midi, mode)).toBe(name);
  });
});

describe("Stämmarens strängar", () => {
  it("har en sträng per sträng på gitarr 6, sträng 1 först", () => {
    const guitar = stringInstrument("guitar6");
    expect(tunerStrings(guitar, guitar.tunings[0].tuning)).toEqual([
      { number: 1, course: 1, pitch: 64 },
      { number: 2, course: 2, pitch: 59 },
      { number: 3, course: 3, pitch: 55 },
      { number: 4, course: 4, pitch: 50 },
      { number: 5, course: 5, pitch: 45 },
      { number: 6, course: 6, pitch: 40 },
    ]);
  });

  it("stämmer båda strängarna i ett Strängpar med oktavsträng, och ett par med samma ton som en", () => {
    const twelve = stringInstrument("guitar12");
    const strings = tunerStrings(twelve, twelve.tunings[0].tuning);
    expect(strings.map((s) => [s.course, s.pitch])).toEqual([
      [1, 64],
      [2, 59],
      [3, 55],
      [3, 67],
      [4, 50],
      [4, 62],
      [5, 45],
      [5, 57],
      [6, 40],
      [6, 52],
    ]);
    expect(strings.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("har en sträng per Strängpar på mandolinen", () => {
    const mandolin = stringInstrument("mandolin");
    expect(tunerStrings(mandolin, mandolin.tunings[0].tuning).map((s) => s.pitch)).toEqual([76, 69, 62, 55]);
  });

  it("följer strängarna och inte tonhöjden på ukulele med hög G", () => {
    const ukulele = stringInstrument("ukulele");
    expect(tunerStrings(ukulele, ukulele.tunings[0].tuning).map((s) => [s.course, s.pitch])).toEqual([
      [1, 69],
      [2, 64],
      [3, 60],
      [4, 67],
    ]);
  });
});

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
