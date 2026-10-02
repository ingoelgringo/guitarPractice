import { model, Settings, StaveProfile, TabRhythmMode } from "@coderline/alphatab";
import { describe, expect, it } from "vitest";
import { createEditor } from "./editor";
import type { Beat, BendTarget, Score, ViewMode } from "./score";
import { beatAt, configureStaves, noteAt, toAlphaTab } from "./toAlphaTab";

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

describe("Stämning och Capo i toAlphaTab", () => {
  /** Tonhöjden för varje lös sträng, sträng 1 först, när Spåret har `tuning` och `capo`. */
  function openStringPitches(tuning: readonly number[], capo = 0): number[] {
    const score = scoreWithBeats(
      [1, 2, 3, 4, 5, 6].map((string) => ({ duration: 4, notes: [{ string, fret: 0 }] })),
    );
    score.tracks[0].tuning = [...tuning];
    score.tracks[0].capo = capo;
    return firstBarBeats(score).map((b) => b.notes[0].realValue);
  }

  it("de förvalda stämningarna ger rätt tonhöjd på lösa strängar", () => {
    // E4 B3 G3 D3 A2 E2
    expect(openStringPitches([64, 59, 55, 50, 45, 40])).toEqual([64, 59, 55, 50, 45, 40]);
    // Drop D: E4 B3 G3 D3 A2 D2
    expect(openStringPitches([64, 59, 55, 50, 45, 38])).toEqual([64, 59, 55, 50, 45, 38]);
    // DADGAD: D4 A3 G3 D3 A2 D2
    expect(openStringPitches([62, 57, 55, 50, 45, 38])).toEqual([62, 57, 55, 50, 45, 38]);
  });

  it("en egen Stämning ger rätt tonhöjd", () => {
    // Open G: D4 B3 G3 D3 G2 D2
    expect(openStringPitches([62, 59, 55, 50, 43, 38])).toEqual([62, 59, 55, 50, 43, 38]);
  });

  it("Capo höjer tonhöjden lika många halvtoner som bandet, medan bandnumren i tabben står kvar", () => {
    for (const [capo, expected] of [
      [0, 66],
      [2, 68],
      [5, 71],
      [7, 73],
    ]) {
      const score = scoreWithBeats([{ duration: 4, notes: [{ string: 1, fret: 2 }] }]);
      score.tracks[0].capo = capo;

      const [beat] = firstBarBeats(score);

      // Band 2 på ljusa e är F#4 = 66 utan Capo
      expect(beat.notes[0].realValue, `capo ${capo}`).toBe(expected);
      expect(beat.notes[0].fret, `capo ${capo}`).toBe(2);
    }
  });

  it("Capo och Stämning verkar tillsammans", () => {
    // DADGAD med Capo 2: lösa strängar blir E4 B3 A3 E3 B2 E2
    expect(openStringPitches([62, 57, 55, 50, 45, 38], 2)).toEqual([64, 59, 57, 52, 47, 40]);
  });
});

describe("huvudet i toAlphaTab", () => {
  it("titel, undertitel, artist och \"tabbad av\" följer med, och raden \"Tabbed by\" visas", () => {
    const score = createEditor().score;
    score.metadata = { title: "Blackbird", subtitle: "Live", artist: "The Beatles", tabbedBy: "Ingo" };

    const result = toAlphaTab(score);

    expect([result.title, result.subTitle, result.artist, result.tab]).toEqual([
      "Blackbird",
      "Live",
      "The Beatles",
      "Ingo",
    ]);
    expect(tabbedByLine(result)).toBe("Tabbed by Ingo");
  });

  it("tomma fält utelämnas i huvudet", () => {
    const result = toAlphaTab(createEditor().score);

    expect([result.title, result.subTitle, result.artist, result.tab]).toEqual(["", "", "", ""]);
    expect(tabbedByLine(result)).toBe("");
  });

  it("starttempot blir Partiturets tempo och en tempomarkering i första Takten", () => {
    const score = createEditor().score;
    score.tempo = 90;

    const result = toAlphaTab(score);

    expect(result.tempo).toBe(90);
    expect(result.masterBars[0].tempoAutomations.map((a) => a.value)).toEqual([90]);
  });

  it("Stämningen visas med namn för förvalen och utan namn för en egen Stämning", () => {
    const tuningLabels = [
      [64, 59, 55, 50, 45, 40],
      [64, 59, 55, 50, 45, 38],
      [62, 57, 55, 50, 45, 38],
      // En egen Stämning som alphaTab inte heller har något namn på (känner den igen den, t.ex. Open G, sätter den sitt eget)
      [64, 59, 55, 50, 45, 41],
    ].map((tuning) => {
      const score = createEditor().score;
      score.tracks[0].tuning = tuning;
      const { stringTuning } = toAlphaTab(score).tracks[0].staves[0];
      return [stringTuning.name, stringTuning.isStandard];
    });

    // Bara standardstämningen ritas utan lista över strängarna
    expect(tuningLabels).toEqual([
      ["Standard tuning", true],
      ["Drop D", false],
      ["DADGAD", false],
      ["", false],
    ]);
  });
});

/** Raden "Tabbed by" som alphaTab ritar i huvudet, eller "" om den inte ritas. */
function tabbedByLine(score: model.Score): string {
  const style = score.style?.headerAndFooter.get(model.ScoreSubElement.Transcriber);
  return style?.isVisible ? style.buildText(score) : "";
}

function firstBarBeats(score: Score): model.Beat[] {
  return toAlphaTab(score).tracks[0].staves[0].bars[0].voices[0].beats;
}

function scoreWithBeats(beats: Beat[]): Score {
  const score = createEditor().score;
  score.tracks[0].bars[0].beats = beats;
  return score;
}

describe("Vy-läge i toAlphaTab", () => {
  /** Vilka stavar alphaTab ritar för Spåret när Partituret har `viewMode`. */
  function staves(viewMode: ViewMode) {
    const score = createEditor().score;
    score.viewMode = viewMode;
    const staff = toAlphaTab(score).tracks[0].staves[0];
    return {
      standardNotation: staff.showStandardNotation,
      tablature: staff.showTablature,
      slash: staff.showSlash,
      numbered: staff.showNumbered,
    };
  }

  it("Noter + tabulatur ritar notsystem ovanför tabulatur", () => {
    expect(staves("scoreAndTab")).toEqual({ standardNotation: true, tablature: true, slash: false, numbered: false });
  });

  it("Bara noter ritar bara notsystem", () => {
    expect(staves("scoreOnly")).toEqual({ standardNotation: true, tablature: false, slash: false, numbered: false });
  });

  it("Rytmtab ritar bara tabulatur, som då får rytmskaft eftersom notsystemet saknas", () => {
    expect(staves("rhythmTab")).toEqual({ standardNotation: false, tablature: true, slash: false, numbered: false });
  });

  it("visningsinställningarna låter stavarna styra och ger tabulaturen rytmskaft utan notsystem", () => {
    const settings = new Settings();
    settings.display.staveProfile = StaveProfile.ScoreTab;
    settings.notation.rhythmMode = TabRhythmMode.Hidden;

    configureStaves(settings);

    expect(settings.display.staveProfile).toBe(StaveProfile.Default);
    expect(settings.notation.rhythmMode).toBe(TabRhythmMode.Automatic);
  });
});

describe("uppspelning i toAlphaTab", () => {
  it("Spåret spelas med stålsträngad akustisk gitarr (General MIDI-program 25, nollräknat)", () => {
    const track = toAlphaTab(createEditor().score).tracks[0];

    expect(track.playbackInfo.program).toBe(25);
  });

  it("varje Spår har egna MIDI-kanaler, så att Spåren inte stör varandra", () => {
    const score = createEditor().score;
    score.tracks.push(structuredClone(score.tracks[0]));

    const channels = toAlphaTab(score).tracks.map((t) => [t.playbackInfo.primaryChannel, t.playbackInfo.secondaryChannel]);

    expect(new Set(channels.flat()).size).toBe(4);
  });
});

describe("Markörens position i alphaTabs modell", () => {
  const score = createEditor().score;
  score.tracks[0].bars = [
    { beats: [{ duration: 2, notes: [] }, { duration: 2, notes: [{ string: 1, fret: 5 }, { string: 6, fret: 3 }] }] },
    { beats: [{ duration: 1, notes: [{ string: 3, fret: 2 }] }] },
  ];
  const rendered = toAlphaTab(score);

  it("slaget vid Markören är samma slag i alphaTab, där uppspelningen kan börja", () => {
    const beat = beatAt(rendered, { track: 0, bar: 1, beat: 0, string: 1 });

    expect(beat?.duration).toBe(model.Duration.Whole);
    expect(beat?.notes.map((n) => n.realValue)).toEqual([57]);
  });

  it("tonen vid Markören är tonen på Markörens sträng", () => {
    // Sträng 6, band 3 i standardstämning är G2 = 43
    expect(noteAt(rendered, { track: 0, bar: 0, beat: 1, string: 6 })?.realValue).toBe(43);
    expect(noteAt(rendered, { track: 0, bar: 0, beat: 1, string: 1 })?.realValue).toBe(69);
  });

  it("utan ton på Markörens sträng finns ingen ton att spela", () => {
    expect(noteAt(rendered, { track: 0, bar: 0, beat: 1, string: 2 })).toBeNull();
    expect(noteAt(rendered, { track: 0, bar: 0, beat: 0, string: 1 })).toBeNull();
  });

  it("en position utanför Partituret har inget slag", () => {
    expect(beatAt(rendered, { track: 0, bar: 2, beat: 0, string: 1 })).toBeNull();
    expect(beatAt(rendered, { track: 1, bar: 0, beat: 0, string: 1 })).toBeNull();
  });
});

describe("speltekniker i toAlphaTab", () => {
  it("hammer-on och pull-off leder till nästa ton på samma sträng", () => {
    const [up, down, last] = firstBarBeats(
      scoreWithBeats([
        { duration: 4, notes: [{ string: 3, fret: 5, hammerPull: true }] },
        { duration: 4, notes: [{ string: 3, fret: 7, hammerPull: true }] },
        { duration: 4, notes: [{ string: 3, fret: 5 }] },
      ]),
    );

    expect(up.notes[0].isHammerPullOrigin).toBe(true);
    expect(up.notes[0].hammerPullDestination).toBe(down.notes[0]);
    expect(down.notes[0].hammerPullDestination).toBe(last.notes[0]);
    expect(last.notes[0].isHammerPullOrigin).toBe(false);
  });

  it("slide leder till nästa ton på samma sträng, även i nästa Takt", () => {
    const score = scoreWithBeats([{ duration: 1, notes: [{ string: 2, fret: 3, slide: true }] }]);
    score.tracks[0].bars.push({ beats: [{ duration: 1, notes: [{ string: 2, fret: 8 }] }] });

    const bars = toAlphaTab(score).tracks[0].staves[0].bars;
    const [from, to] = bars.map((bar) => bar.voices[0].beats[0].notes[0]);

    expect(from.slideOutType).toBe(model.SlideOutType.Shift);
    expect(from.slideTarget).toBe(to);
  });

  it.each([
    [1, 2],
    [2, 4],
    [3, 6],
  ])("en bend på %i halvtoner böjer upp %i kvartstoner", (semitones, quarterTones) => {
    const [bent] = firstBarBeats(
      scoreWithBeats([{ duration: 4, notes: [{ string: 2, fret: 8, bend: semitones as BendTarget }] }]),
    );
    const note = bent.notes[0];

    expect(note.hasBend).toBe(true);
    expect(note.bendType).toBe(model.BendType.Bend);
    expect(note.bendPoints?.[0].value).toBe(0);
    expect(note.maxBendPoint?.value).toBe(quarterTones);
  });

  it("palm mute följer med tonen", () => {
    const [beat] = firstBarBeats(
      scoreWithBeats([{ duration: 4, notes: [{ string: 6, fret: 0, palmMute: true }, { string: 5, fret: 2 }] }]),
    );

    expect(beat.notes.find((n) => n.fret === 0)?.isPalmMute).toBe(true);
    expect(beat.notes.find((n) => n.fret === 2)?.isPalmMute).toBe(false);
  });

  it("toner utan tekniker spelas som vanligt", () => {
    const [beat] = firstBarBeats(scoreWithBeats([{ duration: 4, notes: [{ string: 1, fret: 5 }] }]));
    const note = beat.notes[0];

    expect([note.isHammerPullOrigin, note.slideOutType, note.hasBend, note.isPalmMute]).toEqual([
      false,
      model.SlideOutType.None,
      false,
      false,
    ]);
  });
});
