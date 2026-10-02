import { describe, expect, it } from "vitest";
import { createEditor } from "./editor";
import type { Score } from "./score";
import { readFileSync } from "node:fs";
import { fileName, migrate, parse, SCHEMA_VERSION, serialize, type Migration } from "./scoreFile";

describe("Partiturfil: rundtur", () => {
  it("ett tomt Partitur kommer tillbaka likadant", () => {
    const score = createEditor().score;

    expect(parse(serialize(score))).toEqual({ ok: true, score });
  });

  it.each<[string, (score: Score) => void]>([
    ["metadata", (s) => (s.metadata = { title: "Blackbird", subtitle: "Live", artist: "The Beatles", tabbedBy: "Ingo" })],
    ["Vy-läge", (s) => (s.viewMode = "rhythmTab")],
    ["tempo", (s) => (s.tempo = 93)],
    ["taktart", (s) => (s.timeSignature = { beats: 6, beatValue: 8 })],
    ["Stämning", (s) => (s.tracks[0].tuning = [62, 57, 55, 50, 45, 38])],
    ["Capo", (s) => (s.tracks[0].capo = 3)],
    [
      "alla Notvärden",
      (s) => (s.tracks[0].bars[0].beats = ([1, 2, 4, 8, 16, 32] as const).map((duration) => ({ duration, notes: [] }))),
    ],
    [
      "punktering och triol",
      (s) =>
        (s.tracks[0].bars[0].beats = [
          { duration: 4, dotted: true, notes: [{ string: 1, fret: 0 }] },
          { duration: 8, triplet: true, notes: [{ string: 2, fret: 1 }] },
          { duration: 8, dotted: true, triplet: true, notes: [] },
        ]),
    ],
    [
      "ackord, tvåsiffriga band och pauser",
      (s) =>
        (s.tracks[0].bars[0].beats = [
          { duration: 4, notes: [{ string: 1, fret: 12 }, { string: 2, fret: 24 }, { string: 6, fret: 0 }] },
          { duration: 4, notes: [] },
        ]),
    ],
    [
      "speltekniker",
      (s) =>
        (s.tracks[0].bars = [
          {
            beats: [
              { duration: 8, notes: [{ string: 3, fret: 5, hammerPull: true }, { string: 6, fret: 0, palmMute: true }] },
              { duration: 8, notes: [{ string: 3, fret: 7, slide: true }] },
              { duration: 8, notes: [{ string: 3, fret: 9 }] },
              { duration: 8, notes: [{ string: 1, fret: 7, bend: 2 }, { string: 2, fret: 8, bend: 1 }] },
            ],
          },
          { beats: [{ duration: 2, notes: [{ string: 3, fret: 10, bend: 3, palmMute: true }] }] },
        ]),
    ],
    [
      "flera Takter",
      (s) =>
        (s.tracks[0].bars = [
          { beats: [{ duration: 1, notes: [{ string: 3, fret: 2 }] }] },
          { beats: [{ duration: 2, notes: [] }] },
        ]),
    ],
    [
      "takt- och tempobyten samt repriser",
      (s) =>
        (s.tracks[0].bars = [
          { beats: [{ duration: 1, notes: [] }], repeatEnd: 2 },
          { beats: [{ duration: 2, dotted: true, notes: [] }], timeSignature: { beats: 3, beatValue: 4 }, repeatStart: true },
          { beats: [{ duration: 2, dotted: true, notes: [] }], tempo: 72, repeatStart: true, repeatEnd: 99 },
        ]),
    ],
  ])("%s kommer tillbaka likadant", (_, change) => {
    const score = scoreWith(change);

    expect(parse(serialize(score))).toEqual({ ok: true, score });
  });
});

describe("Partiturfil: avvisning", () => {
  it("text som inte är JSON avvisas som trasig", () => {
    expect(parse('{"schemaVersion": 1, "score": ')).toEqual({ ok: false, error: { kind: "invalidJson" } });
  });

  it.each([
    ["en lista", "[1, 2, 3]"],
    ["ett tal", "42"],
    ["null", "null"],
    ["ett objekt utan schemaVersion", '{"title": "Blackbird"}'],
    ["ett objekt utan formatmärkning", '{"schemaVersion": 1, "score": {}}'],
    ["ett objekt med en annan formatmärkning", '{"format": "other", "schemaVersion": 1, "score": {}}'],
    ["en schemaVersion som inte är ett heltal", '{"format": "itab", "schemaVersion": "1", "score": {}}'],
    ["en schemaVersion under 1", '{"format": "itab", "schemaVersion": 0, "score": {}}'],
  ])("JSON som inte är en Partiturfil (%s) avvisas", (_, text) => {
    expect(parse(text)).toEqual({ ok: false, error: { kind: "notAScoreFile" } });
  });

  it("en fil från en senare version av editorn avvisas med versionen", () => {
    const text = JSON.stringify({ format: "itab", schemaVersion: SCHEMA_VERSION + 1, score: {} });

    expect(parse(text)).toEqual({ ok: false, error: { kind: "unsupportedVersion", version: SCHEMA_VERSION + 1 } });
  });
});

describe("Partiturfil: trasigt Partitur", () => {
  // Testerna förstör medvetet JSON-dokumentet på sätt som typerna inte tillåter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  it.each<[string, (score: Record<string, any>) => void]>([
    ["Partituret saknas", (s) => Object.keys(s).forEach((key) => delete s[key])],
    ["metadata saknas", (s) => delete s.metadata],
    ["en titel som inte är text", (s) => (s.metadata.title = 5)],
    ["ett okänt Vy-läge", (s) => (s.viewMode = "lyrics")],
    ["ett tempo utanför 20–400", (s) => (s.tempo = 1000)],
    ["en taktart med ett ogiltigt Notvärde", (s) => (s.timeSignature = { beats: 4, beatValue: 3 })],
    ["inga Spår", (s) => (s.tracks = [])],
    ["en Stämning utan strängar", (s) => (s.tracks[0].tuning = [])],
    ["en orimlig tonhöjd i Stämningen", (s) => (s.tracks[0].tuning[0] = 300)],
    ["en Capo utanför 0–24", (s) => (s.tracks[0].capo = -1)],
    ["ett Spår utan Takter", (s) => (s.tracks[0].bars = [])],
    ["en Takt utan slag", (s) => (s.tracks[0].bars[0].beats = [])],
    ["ett okänt Notvärde", (s) => (s.tracks[0].bars[0].beats[0].duration = 3)],
    ["en punktering som inte är sant eller falskt", (s) => (s.tracks[0].bars[0].beats[0].dotted = "yes")],
    ["en ton på en sträng som inte finns", (s) => (s.tracks[0].bars[0].beats[0].notes = [{ string: 7, fret: 0 }])],
    ["ett band över 24", (s) => (s.tracks[0].bars[0].beats[0].notes = [{ string: 1, fret: 25 }])],
    ["ett okänt mål för en bend", (s) => (s.tracks[0].bars[0].beats[0].notes = [{ string: 1, fret: 5, bend: 4 }])],
    ["en palm mute som inte är sant eller falskt", (s) => (s.tracks[0].bars[0].beats[0].notes = [{ string: 1, fret: 5, palmMute: 1 }])],
    [
      "både hammer-on/pull-off och slide från samma ton",
      (s) =>
        (s.tracks[0].bars[0].beats = [
          { duration: 4, notes: [{ string: 1, fret: 5, hammerPull: true, slide: true }] },
          { duration: 4, notes: [{ string: 1, fret: 7 }] },
        ]),
    ],
    [
      "en hammer-on utan en ton att leda till",
      (s) => (s.tracks[0].bars[0].beats[0].notes = [{ string: 1, fret: 5, hammerPull: true }]),
    ],
    [
      "en slide till samma band",
      (s) =>
        (s.tracks[0].bars[0].beats = [
          { duration: 4, notes: [{ string: 1, fret: 5, slide: true }] },
          { duration: 4, notes: [{ string: 1, fret: 5 }] },
        ]),
    ],
    ["ett taktartsbyte i första Takten", (s) => (s.tracks[0].bars[0].timeSignature = { beats: 3, beatValue: 4 })],
    ["ett tempobyte i första Takten", (s) => (s.tracks[0].bars[0].tempo = 90)],
    ["ett ogiltigt taktartsbyte", (s) => s.tracks[0].bars.push({ beats: [{ duration: 4, notes: [] }], timeSignature: { beats: 0, beatValue: 4 } })],
    ["ett tempobyte utanför 20–400", (s) => s.tracks[0].bars.push({ beats: [{ duration: 4, notes: [] }], tempo: 10 })],
    ["en reprisstart som inte är sant eller falskt", (s) => (s.tracks[0].bars[0].repeatStart = "yes")],
    ["ett reprisslut med ett varv", (s) => (s.tracks[0].bars[0].repeatEnd = 1)],
    ["ett reprisslut med över 99 varv", (s) => (s.tracks[0].bars[0].repeatEnd = 100)],
    [
      "två toner på samma sträng i ett slag",
      (s) => (s.tracks[0].bars[0].beats[0].notes = [{ string: 1, fret: 0 }, { string: 1, fret: 2 }]),
    ],
  ])("ett Partitur med %s avvisas", (_, change) => {
    const document = JSON.parse(serialize(createEditor().score));
    change(document.score);

    expect(parse(JSON.stringify(document))).toEqual({ ok: false, error: { kind: "invalidScore" } });
  });

  it("okända fält och falska flaggor tas bort, så att Partituret blir som Editorn skapar det", () => {
    const document = JSON.parse(serialize(createEditor().score));
    document.score.comment = "hej";
    document.score.tracks[0].bars[0].beats[0] = { duration: 4, dotted: false, triplet: false, notes: [], color: "red" };

    expect(parse(JSON.stringify(document))).toEqual({ ok: true, score: createEditor().score });
  });

  it("tonerna i ett slag sorteras efter sträng, som Editorn håller dem", () => {
    const document = JSON.parse(serialize(createEditor().score));
    document.score.tracks[0].bars[0].beats[0].notes = [{ string: 5, fret: 3 }, { string: 2, fret: 1 }];

    const result = parse(JSON.stringify(document));

    expect(result.ok && result.score.tracks[0].bars[0].beats[0].notes).toEqual([
      { string: 2, fret: 1 },
      { string: 5, fret: 3 },
    ]);
  });
});

describe("Partiturfil: äldre versioner", () => {
  // Fixturfilerna är riktiga filer från en viss version och får aldrig ändras
  function fixture(version: number): string {
    return readFileSync(new URL(`./fixtures/score-v${version}.itab`, import.meta.url), "utf8");
  }

  it("en fil i version 1 går att öppna", () => {
    expect(parse(fixture(1))).toEqual({
      ok: true,
      score: {
        metadata: { title: "Fixture", subtitle: "Version 1", artist: "Ingo", tabbedBy: "Claude" },
        viewMode: "scoreAndTab",
        tempo: 96,
        timeSignature: { beats: 3, beatValue: 4 },
        tracks: [
          {
            tuning: [64, 59, 55, 50, 45, 38],
            capo: 2,
            bars: [
              {
                beats: [
                  { duration: 4, dotted: true, notes: [{ string: 1, fret: 0 }, { string: 6, fret: 12 }] },
                  { duration: 8, notes: [] },
                  { duration: 8, triplet: true, notes: [{ string: 3, fret: 2 }] },
                  { duration: 8, triplet: true, notes: [{ string: 3, fret: 4 }] },
                  { duration: 8, triplet: true, notes: [{ string: 3, fret: 5 }] },
                ],
              },
              { beats: [{ duration: 2, notes: [{ string: 2, fret: 24 }] }, { duration: 32, notes: [] }] },
            ],
          },
        ],
      },
    });
  });

  it("en fil i version 2 går att öppna, med speltekniker", () => {
    const result = parse(fixture(2));

    expect(result.ok && result.score.tracks[0].bars).toEqual([
      {
        beats: [
          { duration: 8, notes: [{ string: 3, fret: 5, hammerPull: true }, { string: 6, fret: 0, palmMute: true }] },
          { duration: 8, notes: [{ string: 3, fret: 7, slide: true }] },
          { duration: 8, notes: [{ string: 3, fret: 9 }] },
          { duration: 8, notes: [{ string: 2, fret: 8, bend: 1 }] },
        ],
      },
      { beats: [{ duration: 2, notes: [{ string: 1, fret: 10, bend: 2 }, { string: 2, fret: 12, bend: 3 }] }] },
    ]);
  });

  it("en fil i version 3 går att öppna, med takt- och tempobyten samt repriser", () => {
    const result = parse(fixture(3));

    expect(result.ok && result.score.tracks[0].bars).toEqual([
      { beats: [{ duration: 2, notes: [{ string: 1, fret: 3 }] }], repeatStart: true },
      { beats: [{ duration: 2, dotted: true, notes: [] }], timeSignature: { beats: 3, beatValue: 4 }, repeatEnd: 3 },
      { beats: [{ duration: 2, dotted: true, notes: [{ string: 2, fret: 5 }] }], tempo: 140, repeatEnd: 2 },
    ]);
  });

  it("migreringar kedjas från en äldre version till den nuvarande, en version i taget", () => {
    // Varje migrering lägger till sitt steg, så att ordningen syns i resultatet
    const step = (name: string): Migration => (score) => {
      const { steps = [], ...rest } = score as { steps?: string[] };
      return { ...rest, steps: [...steps, name] };
    };
    const migrations = { 1: step("1→2"), 2: step("2→3") };

    expect(migrate({ title: "x" }, 1, 3, migrations)).toEqual({ title: "x", steps: ["1→2", "2→3"] });
    expect(migrate({ title: "x" }, 2, 3, migrations)).toEqual({ title: "x", steps: ["2→3"] });
    expect(migrate({ title: "x" }, 3, 3, migrations)).toEqual({ title: "x" });
  });
});

describe("Partiturfil: filnamn", () => {
  it.each([
    ["Blackbird", "Blackbird.itab"],
    ["Visa från Utanmyra", "Visa från Utanmyra.itab"],
    ["AC/DC: Back in Black?", "AC DC Back in Black.itab"],
    ['<a>|b\\c*"d"', "a b c d.itab"],
    ["  Spaces   and\ttabs  ", "Spaces and tabs.itab"],
    ["Ends with dots...", "Ends with dots.itab"],
    ["CON", "CON_.itab"],
    ["com1", "com1_.itab"],
    ["", "Untitled.itab"],
    ["???", "Untitled.itab"],
  ])("titeln %j ger filnamnet %j", (title, expected) => {
    expect(fileName(scoreWith((s) => (s.metadata.title = title)))).toBe(expected);
  });

  it("en mycket lång titel kortas av", () => {
    const name = fileName(scoreWith((s) => (s.metadata.title = "a".repeat(300))));

    expect(name).toBe(`${"a".repeat(100)}.itab`);
  });
});

/** Ett nytt Partitur, ändrat med `change`. */
function scoreWith(change: (score: Score) => void): Score {
  const score = structuredClone(createEditor().score);
  change(score);
  return score;
}
