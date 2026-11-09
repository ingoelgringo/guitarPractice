import { describe, expect, it } from "vitest";
import { newProgression, placeChord, type Progression, setTimeSignature, triad } from "./progression";
import { countIn, playbackPlan, pulseSeconds } from "./progressionPlayback";

const C = 0, F = 5, G = 7, A = 9;

/** En Ackordföljd med en Del på fyra Takter och Ackorden på de givna platserna (Takt, Taktslag). */
function withChords(chords: [bar: number, pulse: number, root: number, type?: "major" | "minor"][], progression = newProgression()): Progression {
  return chords.reduce(
    (p, [bar, pulse, root, type = "major"]) => placeChord(p, { section: p.sections[0].id, bar, pulse }, triad(root, type)),
    progression,
  );
}

describe("uppspelningsplanen", () => {
  it("låter ett Ackord klinga till nästa Ackord, över taktstrecken, och det sista till slutet", () => {
    const progression = withChords([[0, 0, C], [1, 2, A, "minor"], [3, 0, G]]);
    const plan = playbackPlan(progression);
    expect(plan.length).toBe(16);
    expect(plan.chords.map(({ start, end, chord }) => [start, end, chord.root])).toEqual([
      [0, 6, C],
      [6, 12, A],
      [12, 16, G],
    ]);
  });

  it("har bara trummor före det första Ackordet", () => {
    const plan = playbackPlan(withChords([[1, 0, F]]));
    expect(plan.drums.filter((hit) => hit.time < 4).length).toBeGreaterThan(0);
    for (const instrument of ["bass", "piano", "pad"] as const) {
      expect(plan[instrument].length, instrument).toBeGreaterThan(0);
      expect(Math.min(...plan[instrument].map((note) => note.time)), instrument).toBe(4);
    }
  });

  it("spelar trummorna i ett fast mönster per taktart, i varje Takt", () => {
    const times = (progression: Progression, drum: string) =>
      playbackPlan(progression).drums.filter((hit) => hit.drum === drum).map((hit) => hit.time).sort((a, b) => a - b);
    const fourFour = newProgression();
    expect(times(fourFour, "snare")).toEqual([1, 3, 5, 7, 9, 11, 13, 15]);
    expect(times(fourFour, "kick").filter((t) => t < 4)).toEqual([0, 2, 2.5]);
    const sixEight = setTimeSignature(newProgression(), "6/8");
    expect(times(sixEight, "snare")).toEqual([3, 9, 15, 21]);
    expect(times(sixEight, "hihat").filter((t) => t < 6)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(times(setTimeSignature(newProgression(), "3/4"), "snare").filter((t) => t < 3)).toEqual([1, 2]);
  });

  it("räknar tempot i fjärdedelar, men i 6/8 och 12/8 i punkterade fjärdedelar", () => {
    const at = (timeSignature: "4/4" | "3/4" | "6/8" | "12/8") => setTimeSignature({ ...newProgression(), tempo: 60 }, timeSignature);
    expect(pulseSeconds(at("4/4"))).toBe(1);
    expect(pulseSeconds(at("3/4"))).toBe(1);
    expect(pulseSeconds(at("6/8"))).toBeCloseTo(1 / 3);
    expect(pulseSeconds(at("12/8"))).toBeCloseTo(1 / 3);
    expect(pulseSeconds({ ...newProgression(), tempo: 120 })).toBe(0.5);
  });

  describe("stämföringen", () => {
    /** Tonerna som padden håller för varje Ackord, i tidsordning. */
    const padChords = (progression: Progression) => playbackPlan(progression).pad.map((event) => event.notes);

    it("behåller gemensamma toner och tar de närmaste stegen till nästa ackord", () => {
      expect(padChords(withChords([[0, 0, C], [1, 0, F], [2, 0, A, "minor"]]))).toEqual([
        [60, 64, 67],
        [60, 65, 69],
        [60, 64, 69],
      ]);
    });

    it("är samma för elpianot som för padden", () => {
      const plan = playbackPlan(withChords([[0, 0, C], [1, 0, F]]));
      expect(plan.piano.find((event) => event.time === 4)?.notes).toEqual([60, 65, 69]);
    });

    it("glider inte iväg i registret under en lång följd", () => {
      // Kvintcirkeln baklänges tre varv: C F B♭ E♭ A♭ D♭ G♭ B E A D G …
      const many = { ...newProgression(), sections: [{ ...newProgression().sections[0], bars: 36 }] };
      const progression = withChords(Array.from({ length: 36 }, (_, bar) => [bar, 0, (bar * 5) % 12] as [number, number, number]), many);
      for (const notes of padChords({ ...progression, form: [progression.sections[0].id] })) {
        expect(Math.min(...notes)).toBeGreaterThanOrEqual(52);
        expect(Math.max(...notes)).toBeLessThanOrEqual(79);
      }
    });
  });

  it("låter basen spela Basen i ett lågt register", () => {
    const progression = withChords([[0, 0, C]]);
    const slash = placeChord(progression, { section: progression.sections[0].id, bar: 1, pulse: 0 }, { ...triad(G, "major"), bass: 11 });
    const bass = playbackPlan(slash).bass;
    expect(bass.filter((event) => event.time < 4).map((event) => event.notes)).toEqual([[36], [36]]);
    expect(bass.filter((event) => event.time >= 4).map((event) => event.notes)[0]).toEqual([35]);
  });

  it("räknar in en Takt på fjärdedelarna, och i 6/8 och 12/8 på de punkterade fjärdedelarna", () => {
    const times = (timeSignature: "4/4" | "3/4" | "6/8" | "12/8") => countIn(timeSignature).hits.map((hit) => hit.time);
    expect(times("4/4")).toEqual([0, 1, 2, 3]);
    expect(times("3/4")).toEqual([0, 1, 2]);
    expect(times("6/8")).toEqual([0, 3]);
    expect(times("12/8")).toEqual([0, 3, 6, 9]);
    expect(countIn("6/8").length).toBe(6);
  });

  it("har bara trummor när det inte finns några Ackord", () => {
    const plan = playbackPlan(newProgression());
    expect(plan.drums.length).toBeGreaterThan(0);
    expect([...plan.bass, ...plan.piano, ...plan.pad]).toEqual([]);
  });
});
