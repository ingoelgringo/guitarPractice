/** Greppbrädan: vilka Prickar halsen visar för ett urval. Ren modul utan React. */

import { STANDARD_TUNING } from "./score";

/** Antal band som visas utöver lös sträng. */
export const FRET_COUNT = 15;

/** Band med bandmarkering (inlay) på halsen. Band 12 har två. */
export const INLAY_FRETS: readonly number[] = [3, 5, 7, 9, 12];

export type ScaleId = "major" | "naturalMinor" | "majorPentatonic" | "minorPentatonic" | "blues";

/** Vad Prickarnas etiketter visar. */
export type LabelMode = "interval" | "noteName";

/** Notnamnsläge: svenskt (H, och B för B♭) eller engelskt. */
export type NoteNameMode = "swedish" | "english";

export const DEFAULT_LABEL_MODE: LabelMode = "interval";
export const DEFAULT_NOTE_NAME_MODE: NoteNameMode = "swedish";

/** Ett skalsteg: stegnummer 1–7 och avstånd i halvtoner från Grundtonen. */
interface Step {
  degree: number;
  semitones: number;
}

const MAJOR: readonly Step[] = [0, 2, 4, 5, 7, 9, 11].map((semitones, i) => ({ degree: i + 1, semitones }));
const NATURAL_MINOR: readonly Step[] = [0, 2, 3, 5, 7, 8, 10].map((semitones, i) => ({ degree: i + 1, semitones }));

function stepsOf(parent: readonly Step[], degrees: readonly number[]): Step[] {
  return degrees.map((degree) => parent[degree - 1]);
}

/** Varje Skala: dess steg och den sjutoniga skala (Föräldraskalan) som bestämmer stavningen. */
const SCALE_STEPS: Record<ScaleId, { steps: readonly Step[]; parent: readonly Step[] }> = {
  major: { steps: MAJOR, parent: MAJOR },
  naturalMinor: { steps: NATURAL_MINOR, parent: NATURAL_MINOR },
  majorPentatonic: { steps: stepsOf(MAJOR, [1, 2, 3, 5, 6]), parent: MAJOR },
  minorPentatonic: { steps: stepsOf(NATURAL_MINOR, [1, 3, 4, 5, 7]), parent: NATURAL_MINOR },
  // Den blå tonen är en sänkt kvint, så den stavas med kvintens bokstav
  blues: {
    steps: [...stepsOf(NATURAL_MINOR, [1, 3, 4]), { degree: 5, semitones: 6 }, ...stepsOf(NATURAL_MINOR, [5, 7])],
    parent: NATURAL_MINOR,
  },
};

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
/** Tonklass för varje bokstav utan förtecken. */
const NATURAL_PITCH = [0, 2, 4, 5, 7, 9, 11];

/**
 * Grundtonsmenyn som (bokstav, förtecken) per tonklass: de svarta tangenterna med båda namnen där
 * båda är vanliga. Den första stavningen avgör när två tonarter har lika många förtecken.
 */
const ROOT_MENU: readonly (readonly [number, number][])[] = [
  [[0, 0]],
  [[0, 1], [1, -1]],
  [[1, 0]],
  [[2, -1]],
  [[2, 0]],
  [[3, 0]],
  [[3, 1], [4, -1]],
  [[4, 0]],
  [[5, -1]],
  [[5, 0]],
  [[6, -1]],
  [[6, 0]],
];

/** Tonklassen 0–11 för ett antal halvtoner, även negativa. */
function pitchClassOf(semitones: number): number {
  return ((semitones % 12) + 12) % 12;
}

/** Förtecknet i halvtoner (-2…2) mellan en bokstav och en tonklass. */
function accidentalOf(letter: number, pitchClass: number): number {
  return ((((pitchClass - NATURAL_PITCH[letter]) % 12) + 18) % 12) - 6;
}

/**
 * Grundtonens bokstav: den av bokstäverna närmast tonklassen som ger Föräldraskalan
 * minst förtecken utan dubbla förtecken, så att G♯-moll väljs före A♭-moll.
 * Vid lika gäller grundtonsmenyns första stavning (E♭-moll före D♯-moll, F♯-dur före G♭-dur).
 */
function rootLetter(root: number, parent: readonly Step[]): number {
  const menuLetter = ROOT_MENU[root][0][0];
  let best = { letter: 0, cost: Infinity };
  LETTERS.forEach((_, letter) => {
    const rootAccidental = accidentalOf(letter, root);
    if (Math.abs(rootAccidental) > 1) return;
    const accidentals = parent.map((step) => accidentalOf((letter + step.degree - 1) % 7, (root + step.semitones) % 12));
    if (accidentals.some((accidental) => Math.abs(accidental) > 1)) return;
    const cost = accidentals.reduce((sum, accidental) => sum + Math.abs(accidental), 0);
    if (cost < best.cost || (cost === best.cost && letter === menuLetter)) best = { letter, cost };
  });
  return best.letter;
}

const ACCIDENTAL_SIGNS: Record<number, string> = { [-2]: "𝄫", [-1]: "♭", 0: "", 1: "♯", 2: "𝄪" };

/** Tonnamnet för en bokstav och ett förtecken. På svenska heter B H, och H♭ heter B. */
function noteName(letter: number, accidental: number, mode: NoteNameMode): string {
  if (mode === "swedish" && LETTERS[letter] === "B") return accidental === -1 ? "B" : `H${ACCIDENTAL_SIGNS[accidental]}`;
  return `${LETTERS[letter]}${ACCIDENTAL_SIGNS[accidental]}`;
}

/**
 * Tonnamnet för ett skalsteg, med stegets bokstav räknat från Grundtonens. En ton som då skulle få
 * dubbla förtecken (den blå tonen i E♭-blues blir B𝄫) stavas i stället med grannbokstaven (A).
 */
function stepName(rootLetter: number, root: number, step: Step, mode: NoteNameMode): string {
  const pitchClass = (root + step.semitones) % 12;
  let letter = (rootLetter + step.degree - 1) % 7;
  const accidental = accidentalOf(letter, pitchClass);
  if (Math.abs(accidental) > 1) letter = (letter + Math.sign(accidental) + 7) % 7;
  return noteName(letter, accidentalOf(letter, pitchClass), mode);
}

/** Intervalletiketten, t.ex. "♭3", räknat mot durskalans steg. */
function intervalLabel(step: Step): string {
  return `${ACCIDENTAL_SIGNS[step.semitones - MAJOR[step.degree - 1].semitones]}${step.degree}`;
}

const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII"];

/** Ett Ackord bland Föräldraskalans diatoniska treklanger, t.ex. steg 2 "ii" och "Dm". */
export interface ChordOption {
  degree: number;
  numeral: string;
  name: string;
}

/** Föräldraskalans steg för Ackordet på ett steg: grundton, ters och kvint. */
function chordSteps(parent: readonly Step[], degree: number): Step[] {
  return [0, 2, 4].map((offset) => parent[(degree - 1 + offset) % 7]);
}

/** Avståndet i halvtoner uppåt mellan två steg. */
function interval(from: Step, to: Step): number {
  return (to.semitones - from.semitones + 12) % 12;
}

/** Treklangens typ: dur, moll eller förminskad. */
type ChordQuality = "major" | "minor" | "diminished";

/** De ackordtyper som har CAGED-former. */
type CagedQuality = Exclude<ChordQuality, "diminished">;

function chordQuality(parent: readonly Step[], degree: number): ChordQuality {
  const [chordRoot, third, fifth] = chordSteps(parent, degree);
  if (interval(chordRoot, third) === 4) return "major";
  return interval(chordRoot, fifth) === 6 ? "diminished" : "minor";
}

/** Treklangens steg och namn, med Ackordets grundton stavad efter tonarten. */
function chordOption(parent: readonly Step[], degree: number, nameOf: (step: Step) => string): ChordOption {
  const quality = chordQuality(parent, degree);
  const [chordRoot] = chordSteps(parent, degree);
  const numeral = quality === "major" ? NUMERALS[degree - 1] : NUMERALS[degree - 1].toLowerCase();
  const suffix = { major: "", minor: "m", diminished: "°" }[quality];
  return {
    degree,
    numeral: quality === "diminished" ? `${numeral}°` : numeral,
    name: `${nameOf(chordRoot)}${suffix}`,
  };
}

/** En CAGED-form, uppkallad efter det öppna ackord den bygger på. */
export type CagedShape = "C" | "A" | "G" | "E" | "D";

export const CAGED_SHAPES: readonly CagedShape[] = ["C", "A", "G", "E", "D"];

/**
 * Det öppna greppet i standardstämning för varje form: det öppna ackordets grundton (tonklass) och
 * band per sträng, sträng 1 först. `null` är en dämpad sträng.
 */
const CAGED_GRIPS: Record<CagedQuality, Record<CagedShape, { root: number; frets: readonly (number | null)[] }>> = {
  major: {
    C: { root: 0, frets: [0, 1, 0, 2, 3, null] },
    A: { root: 9, frets: [0, 2, 2, 2, 0, null] },
    G: { root: 7, frets: [3, 0, 0, 0, 2, 3] },
    E: { root: 4, frets: [0, 0, 1, 2, 2, 0] },
    D: { root: 2, frets: [2, 3, 2, 0, null, null] },
  },
  minor: {
    C: { root: 0, frets: [null, 1, 0, 1, 3, null] },
    A: { root: 9, frets: [0, 1, 2, 2, 0, null] },
    G: { root: 7, frets: [3, 3, 0, 0, 1, 3] },
    E: { root: 4, frets: [0, 0, 0, 2, 2, 0] },
    D: { root: 2, frets: [1, 3, 2, 0, null, null] },
  },
};

/** Den pentatoniska skala vars lägen ger Skalans Boxar. Dur och moll är pentatonikens lägen med två extra toner. */
const BOX_PENTATONIC: Record<ScaleId, ScaleId> = {
  major: "majorPentatonic",
  naturalMinor: "minorPentatonic",
  majorPentatonic: "majorPentatonic",
  minorPentatonic: "minorPentatonic",
  blues: "minorPentatonic",
};

const BOX_COUNT = 5;

/** En plats på halsen (sträng och band), med eller utan Prick. */
type Place = Pick<Dot, "string" | "fret">;

/**
 * Boxens platser där den börjar på sträng 6. Pentatonikens toner läggs två per sträng i stigande
 * ordning, från dess ton nummer `box` (Box 1 börjar på Grundtonen). Skalans övriga toner läggs på
 * en av grannarnas strängar, den som håller tonen närmast den pentatoniska boxens band.
 */
function boxShape(selection: FretboardSelection, box: number): Place[] {
  const { root, tuning } = selection;
  const pentatonic = SCALE_STEPS[BOX_PENTATONIC[selection.scale]].steps;
  const lowest = tuning.length - 1;
  const start = pentatonic[box - 1].semitones;
  const firstPitch = tuning[lowest] + pitchClassOf(root + start - tuning[lowest]);

  // Tonhöjd och sträng (index i Stämningen) för pentatonikens toner
  const notes = Array.from({ length: tuning.length * 2 }, (_, i) => {
    const index = box - 1 + i;
    const semitones = pentatonic[index % pentatonic.length].semitones + Math.floor(index / pentatonic.length) * 12;
    return { pitch: firstPitch + semitones - start, string: lowest - Math.floor(i / 2) };
  });
  const placeOf = ({ pitch, string }: { pitch: number; string: number }): Place => ({
    string: string + 1,
    fret: pitch - tuning[string],
  });
  const shape = notes.map(placeOf);

  const { low, high } = fretSpan(shape);
  const distance = (fret: number) => Math.max(low - fret, fret - high, 0);
  const extraSemitones = SCALE_STEPS[selection.scale].steps
    .map((step) => step.semitones)
    .filter((semitones) => !pentatonic.some((step) => step.semitones === semitones));
  notes.slice(1).forEach((upper, i) => {
    const lower = notes[i];
    for (let pitch = lower.pitch + 1; pitch < upper.pitch; pitch++) {
      if (!extraSemitones.includes(pitchClassOf(pitch - root))) continue;
      const below = placeOf({ pitch, string: lower.string });
      const above = placeOf({ pitch, string: upper.string });
      // Vid lika avstånd vinner den ljusare strängen
      shape.push(distance(below.fret) < distance(above.fret) ? below : above);
    }
  });
  return shape;
}

function fretSpan(places: readonly Place[]): { low: number; high: number } {
  const frets = places.map(({ fret }) => fret);
  return { low: Math.min(...frets), high: Math.max(...frets) };
}

/** Om en plats ligger inom bandspannet för en uppsättning platser, t.ex. en kopia av en Box. */
function withinSpan(places: readonly Place[], { fret }: Place): boolean {
  const { low, high } = fretSpan(places);
  return fret >= low && fret <= high;
}

/**
 * Boxen på varje ställe där den får plats inom band 0–15, en oktav ner eller upp. Får den inte plats
 * någonstans visas de delar som ligger inom banden.
 */
function boxInstances(shape: readonly Place[]): Place[][] {
  const instances = [-12, 0, 12].map((shift) => shape.map(({ string, fret }) => ({ string, fret: fret + shift })));
  const onNeck = ({ fret }: Place) => fret >= 0 && fret <= FRET_COUNT;
  const whole = instances.filter((instance) => instance.every(onNeck));
  return whole.length > 0 ? whole : instances.map((instance) => instance.filter(onNeck)).filter((instance) => instance.length > 0);
}

const placeKey = ({ string, fret }: Place) => `${string}-${fret}`;

/** Ett CAGED-grepp: dess lägen inom band 0–15 (lägsta först) och de strängar det dämpar. */
interface Grip {
  positions: Place[][];
  /** Delarna inom banden när greppet inte ryms någonstans. */
  fallback: Place[];
  mutedStrings: number[];
}

/**
 * CAGED-greppet för ett dur- eller mollackord: formens öppna grepp flyttat till Ackordets grundton,
 * i varje oktavläge där hela greppet ryms inom band 0–15. Greppet läggs som tonhöjder, så att det
 * följer Stämningen.
 */
function cagedGrip(tuning: readonly number[], quality: CagedQuality, shape: CagedShape, chordRoot: number): Grip {
  const { root, frets } = CAGED_GRIPS[quality][shape];
  const shift = pitchClassOf(chordRoot - root);
  const pitches = frets.map((fret, index) => (fret === null ? null : STANDARD_TUNING[index] + fret + shift));
  const placesAt = (octave: number): Place[] =>
    pitches.flatMap((pitch, index) => (pitch === null ? [] : [{ string: index + 1, fret: pitch + octave - tuning[index] }]));
  const onNeck = ({ fret }: Place) => fret >= 0 && fret <= FRET_COUNT;
  return {
    positions: [-12, 0, 12].map(placesAt).filter((position) => position.every(onNeck)),
    fallback: placesAt(0).filter(onNeck),
    mutedStrings: frets.flatMap((fret, index) => (fret === null ? [index + 1] : [])),
  };
}

/**
 * Ett mönsters läge (ett grepp eller en kopia av en Penta-box) i varje kopia av en Box: det läge som
 * har flest toner inom kopians band, och det antalet. En kopia som inget läge når får inget.
 */
function fitInBox(positions: readonly Place[][], instances: readonly Place[][]): { positions: Place[][]; overlap: number } {
  const fits = instances.flatMap((instance) => {
    const overlap = (position: Place[]) => position.filter((place) => withinSpan(instance, place)).length;
    const best = positions.reduce<Place[] | undefined>(
      (found, position) => (overlap(position) > (found === undefined ? 0 : overlap(found)) ? position : found),
      undefined,
    );
    return best === undefined ? [] : [{ position: best, overlap: overlap(best) }];
  });
  return {
    positions: [...new Set(fits.map(({ position }) => position))],
    overlap: Math.max(0, ...fits.map(({ overlap }) => overlap)),
  };
}

/**
 * Greppets platser: i varje kopia av den valda Boxen, eller utan Box (eller om greppet inte når
 * Boxen) i det lägsta läget där det ryms.
 */
function gripPlaces(grip: Grip, instances: readonly Place[][]): Place[] {
  const { positions } = fitInBox(grip.positions, instances);
  return positions.length > 0 ? positions.flat() : (grip.positions[0] ?? grip.fallback);
}

/**
 * Formen i varje Box för ett dur- eller mollackord: en rotation av C-A-G-E-D (formernas ordning
 * uppåt längs halsen), den där greppen sammanlagt har flest toner inom sina Boxars band.
 */
function shapesPerBox(
  tuning: readonly number[],
  quality: CagedQuality,
  chordRoot: number,
  boxes: readonly Place[][][],
): CagedShape[] {
  const overlaps = CAGED_SHAPES.map((shape) => {
    const grip = cagedGrip(tuning, quality, shape, chordRoot);
    return boxes.map((instances) => fitInBox(grip.positions, instances).overlap);
  });
  return bestRotation(overlaps).map((shape) => CAGED_SHAPES[shape]);
}

/**
 * Den rotation av fem mönster (index 0–4) på de fem Boxarna där mönstren sammanlagt har flest toner
 * inom sina Boxars band. `overlaps[mönster][box]` är antalet för ett mönster i en Box.
 */
function bestRotation(overlaps: readonly (readonly number[])[]): number[] {
  const rotations = overlaps.map((_, offset) => overlaps.map((_, box) => (offset + box) % overlaps.length));
  const score = (rotation: number[]) => rotation.reduce((sum, pattern, box) => sum + overlaps[pattern][box], 0);
  return rotations.reduce((found, rotation) => (score(rotation) > score(found) ? rotation : found));
}

/** Ackordets penta: durpentatonik för ett durackord och mollpentatonik för ett mollackord. */
const CHORD_PENTATONIC: Record<CagedQuality, ScaleId> = { major: "majorPentatonic", minor: "minorPentatonic" };

/**
 * Ackordets penta som Föräldraskalans steg. Den ryms alltid i Föräldraskalan: durackordens steg har
 * durpentatonikens toner och mollackordens steg mollpentatonikens.
 */
function chordPentaSteps(parent: readonly Step[], quality: CagedQuality, chordRoot: Step): Step[] {
  return SCALE_STEPS[CHORD_PENTATONIC[quality]].steps.map(
    (step) => parent.find((candidate) => candidate.semitones === (chordRoot.semitones + step.semitones) % 12)!,
  );
}

/** Kopiorna av varje Penta-box (1–5 först) i Ackordets penta, byggda som Skalans Boxar från Ackordets grundton. */
function pentaBoxInstances(tuning: readonly number[], quality: CagedQuality, chordRoot: number): Place[][][] {
  const pentaSelection = { root: pitchClassOf(chordRoot), scale: CHORD_PENTATONIC[quality], tuning };
  return Array.from({ length: BOX_COUNT }, (_, i) => boxInstances(boxShape(pentaSelection, i + 1)));
}

/**
 * Penta-boxens nummer i varje Box: en rotation av 1–5 (boxarnas ordning uppåt längs halsen), den där
 * Penta-boxarna sammanlagt har flest toner inom sina Boxars band.
 */
function pentaBoxesPerBox(pentaBoxes: readonly Place[][][], boxes: readonly Place[][][]): number[] {
  const overlaps = pentaBoxes.map((penta) => boxes.map((instances) => fitInBox(penta, instances).overlap));
  return bestRotation(overlaps).map((pentaBox) => pentaBox + 1);
}

/** Omvändningen: Ackordets lägsta ton i ett Treklangsgrepp, som intervall från Ackordets grundton. */
export type Inversion = "R" | "3" | "5";

const INVERSIONS: readonly Inversion[] = ["R", "3", "5"];

/** Ett Treklangsgrepp: dess Omvändning och platser, lägsta strängen först. */
interface Triad {
  inversion: Inversion;
  places: Place[];
}

/**
 * Ackordets Treklangsgrepp på ett Strängset, i alla lägen inom band 0–15. Tonerna läggs stigande från
 * bastonen: på intilliggande strängar i Ackordets ordning (R-3-5, 3-5-R, 5-R-3), och med en överhoppad
 * sträng med mellantonen en oktav upp (R-5-3, 3-R-5, 5-3-R). `chordTones` är tonklasserna för grundton,
 * ters och kvint.
 */
function triadsOn(tuning: readonly number[], chordTones: readonly number[], strings: StringSet): Triad[] {
  const [low, middle, high] = [...strings].map(Number);
  const skipsString = low - middle === 2;
  const onNeck = ({ fret }: Place) => fret >= 0 && fret <= FRET_COUNT;
  return INVERSIONS.flatMap((inversion, index) => {
    const order = [0, 1, 2].map((offset) => chordTones[(index + offset) % 3]);
    const [bass, ...upper] = skipsString ? [order[0], order[2], order[1]] : order;
    const found: Triad[] = [];
    for (let fret = 0; fret <= FRET_COUNT; fret++) {
      let pitch = tuning[low - 1] + fret;
      if (pitchClassOf(pitch) !== bass) continue;
      const places: Place[] = [{ string: low, fret }];
      [middle, high].forEach((string, i) => {
        // Nästa ton uppåt med rätt tonklass
        pitch += pitchClassOf(upper[i] - pitch);
        places.push({ string, fret: pitch - tuning[string - 1] });
      });
      if (places.every(onNeck)) found.push({ inversion, places });
    }
    return found;
  });
}

/**
 * Hur långt ett Treklangsgrepp ligger från en kopia av en Box, jämfört i ordning: toner utanför kopians
 * band, sammanlagt antal band utanför och greppets lägsta band. Lägre är närmare.
 */
function triadDistance({ places }: Triad, instance: readonly Place[]): number[] {
  const { low, high } = fretSpan(instance);
  const outside = places.map(({ fret }) => Math.max(low - fret, fret - high, 0));
  return [
    outside.filter((distance) => distance > 0).length,
    outside.reduce((sum, distance) => sum + distance, 0),
    Math.min(...places.map(({ fret }) => fret)),
  ];
}

/** Om ett avstånd från `triadDistance` är mindre än ett annat. */
function isCloser(distance: readonly number[], other: readonly number[]): boolean {
  const index = distance.findIndex((value, i) => value !== other[i]);
  return index !== -1 && distance[index] < other[index];
}

/** Det Treklangsgrepp som ligger närmast någon kopia av Boxen. */
function closestTriad(triads: readonly Triad[], instances: readonly Place[][]): Triad {
  const distance = (triad: Triad) =>
    instances.map((instance) => triadDistance(triad, instance)).reduce((best, next) => (isCloser(next, best) ? next : best));
  return triads.reduce((closest, triad) => (isCloser(distance(triad), distance(closest)) ? triad : closest));
}

/**
 * Cellens Treklangsgrepp i varje kopia av Boxen: det närmaste med cellens Omvändning, i de kopior som
 * det når. Når det ingen kopia ritas det närmaste greppet en gång.
 */
function triadPlaces(triads: readonly Triad[], instances: readonly Place[][]): Place[] {
  const closest = closestTriad(triads, instances);
  const same = triads.filter(({ inversion }) => inversion === closest.inversion);
  const perInstance = instances.flatMap((instance) => {
    const triad = closestTriad(same, [instance]);
    return triad.places.some((place) => withinSpan(instance, place)) ? [triad] : [];
  });
  return [...new Set(perInstance.length > 0 ? perInstance : [closest])].flatMap(({ places }) => places);
}

/** Fliken i Greppbrädans panel. */
export type FretboardTab = "caged" | "penta" | "triads";

/** Flikarna i den ordning de visas. */
export const FRETBOARD_TABS: readonly FretboardTab[] = ["caged", "penta", "triads"];

/**
 * Ett Strängset: de tre strängar ett Treklangsgrepp spelas på, lägsta först. Antingen tre intilliggande
 * strängar, eller en bassträng följd av en överhoppad sträng och de två nästa.
 */
export type StringSet = "654" | "543" | "432" | "321" | "643" | "532" | "421";

/** Strängseten i den ordning de erbjuds. */
export const STRING_SETS: readonly StringSet[] = ["654", "543", "432", "321", "643", "532", "421"];

export const DEFAULT_STRING_SET: StringSet = "321";

export interface FretboardSelection {
  /** Grundtonens tonklass, C = 0 … H/B = 11. */
  root: number;
  scale: ScaleId;
  /** Stämningen: MIDI-tonhöjd per lös sträng, sträng 1 först. */
  tuning: readonly number[];
  /** Intervall om inget anges. */
  labels?: LabelMode;
  /** Svenskt om inget anges. */
  noteNames?: NoteNameMode;
  /** Det valda Ackordets steg i Föräldraskalan, 1–7. Inget Ackord om det saknas. */
  chord?: number;
  /** Den valda Boxen, 1–5. Ingen Box om den saknas. */
  box?: number;
  /** Den valda CAGED-formen för Ackordet. Gäller bara dur- och mollackord i CAGED-fliken. */
  caged?: CagedShape;
  /** Fliken. CAGED om den saknas. */
  tab?: FretboardTab;
  /** Strängsetet för Treklangsgreppen. 3-2-1 om det saknas. */
  strings?: StringSet;
}

/**
 * Prickens lager. Ackordets lager är greppet, Penta-boxen, Treklangsgreppet, Ackordets penta i Penta-fliken, eller annars
 * Ackordets toner (i Boxen om en Box är vald). Boxens lager är Boxens övriga toner. Skalans lager gäller
 * när varken Ackord eller Box är valt. Resten tonas ner.
 */
export type Layer = "chord" | "box" | "scale" | "muted";

/** Vilken grundton en Prick är: Skalans Grundton, Ackordets grundton eller ingen. Ackordets vinner när båda är samma ton. */
export type RootRole = "scale" | "chord" | "none";

/** En Prick: en markerad position på halsen. Sträng 1 är den ljusaste. */
export interface Dot {
  string: number;
  fret: number;
  label: string;
  rootRole: RootRole;
  layer: Layer;
}

/** En rad i CAGED-tabellen: ett Ackord och en cell per Box (Box 1 först) med formen, `null` för ett förminskat Ackord. */
export interface CagedRow extends ChordOption {
  cells: { box: number; shape: CagedShape | null }[];
}

/** En rad i Penta-tabellen: ett Ackord och en cell per Box (Box 1 först) med Penta-boxens nummer, `null` för ett förminskat Ackord. */
export interface PentaRow extends ChordOption {
  cells: { box: number; pentaBox: number | null }[];
}

/** En rad i Treklangstabellen: ett Ackord och en cell per Box (Box 1 först) med Omvändningen för det närmaste Treklangsgreppet. */
export interface TriadRow extends ChordOption {
  cells: { box: number; inversion: Inversion }[];
}

export interface FretboardView {
  /** Urvalet med de val som inte gäller för Skalan borttagna. */
  selection: FretboardSelection;
  dots: Dot[];
  /** Strängar som CAGED-greppet dämpar, sträng 1 först. Tom utan grepp. */
  mutedStrings: number[];
  /** Det som går att välja, med namn för gränssnittet. */
  options: {
    /** Grundtonsmenyns namn per tonklass, C först. */
    roots: string[];
    /** Skalans Boxar, 1–5. */
    boxes: number[];
    /** CAGED-tabellen: en rad per Ackord i Skalan (från Föräldraskalan), steg 1 först. */
    cagedTable: CagedRow[];
    /** Penta-tabellen: samma rader som CAGED-tabellen, med Penta-boxen i varje cell. */
    pentaTable: PentaRow[];
    /** Treklangstabellen för det valda Strängsetet: samma rader som CAGED-tabellen, med Omvändningen i varje cell. */
    triadTable: TriadRow[];
    /** Strängseten, i den ordning de erbjuds. */
    stringSets: readonly StringSet[];
  };
}

export function fretboardView(selection: FretboardSelection): FretboardView {
  const { root, labels = DEFAULT_LABEL_MODE, noteNames = DEFAULT_NOTE_NAME_MODE } = selection;
  const { steps, parent } = SCALE_STEPS[selection.scale];
  const letter = rootLetter(root, parent);
  const chord = parent.some((step) => step.degree === selection.chord) ? selection.chord : undefined;
  const tab = FRETBOARD_TABS.find((candidate) => candidate === selection.tab) ?? "caged";
  const strings = STRING_SETS.find((candidate) => candidate === selection.strings) ?? DEFAULT_STRING_SET;
  const labelOf = (step: Step) => (labels === "interval" ? intervalLabel(step) : stepName(letter, root, step, noteNames));

  const chordTones = chord === undefined ? [] : chordSteps(parent, chord);
  const requestedBox = selection.box ?? 0;
  const box = Number.isInteger(requestedBox) && requestedBox >= 1 && requestedBox <= BOX_COUNT ? requestedBox : undefined;
  const boxes = Array.from({ length: BOX_COUNT }, (_, i) => i + 1);
  const instancesPerBox = boxes.map((number) => boxInstances(boxShape(selection, number)));
  const instances = box === undefined ? [] : instancesPerBox[box - 1];
  // CAGED-former och Ackordets penta finns bara för dur- och mollackord
  const quality = chord === undefined ? undefined : chordQuality(parent, chord);
  const gripQuality: CagedQuality | undefined = quality === "diminished" ? undefined : quality;
  const requestedShape = CAGED_SHAPES.find((shape) => shape === selection.caged);
  const caged = tab === "caged" && gripQuality !== undefined ? requestedShape : undefined;
  const grip =
    caged === undefined || gripQuality === undefined
      ? undefined
      : cagedGrip(selection.tuning, gripQuality, caged, root + chordTones[0].semitones);

  /** En rad per Ackord med en cell per Box. Ett förminskat Ackord har bara tomma celler. */
  const tableRows = <T,>(cellsOf: (quality: CagedQuality, chordRoot: number) => T[]) =>
    parent.map(({ degree }) => {
      const rowQuality = chordQuality(parent, degree);
      const [rowRoot] = chordSteps(parent, degree);
      const cells = rowQuality === "diminished" ? boxes.map(() => null) : cellsOf(rowQuality, root + rowRoot.semitones);
      return {
        ...chordOption(parent, degree, (chordRoot) => stepName(letter, root, chordRoot, noteNames)),
        cells: boxes.map((number, index) => ({ box: number, value: cells[index] })),
      };
    });
  const cagedTable = tableRows((rowQuality, rowRoot) =>
    shapesPerBox(selection.tuning, rowQuality, rowRoot, instancesPerBox),
  ).map((row): CagedRow => ({ ...row, cells: row.cells.map(({ box: number, value }) => ({ box: number, shape: value })) }));
  const pentaTable = tableRows((rowQuality, rowRoot) =>
    pentaBoxesPerBox(pentaBoxInstances(selection.tuning, rowQuality, rowRoot), instancesPerBox),
  ).map((row): PentaRow => ({ ...row, cells: row.cells.map(({ box: number, value }) => ({ box: number, pentaBox: value })) }));

  // Treklangsgrepp finns för alla Ackord, även förminskade
  const triadsOf = (degree: number) =>
    triadsOn(
      selection.tuning,
      chordSteps(parent, degree).map((step) => pitchClassOf(root + step.semitones)),
      strings,
    );
  const triadTable = parent.map(
    ({ degree }): TriadRow => {
      const triads = triadsOf(degree);
      return {
        ...chordOption(parent, degree, (chordRoot) => stepName(letter, root, chordRoot, noteNames)),
        cells: boxes.map((number, index) => ({ box: number, inversion: closestTriad(triads, instancesPerBox[index]).inversion })),
      };
    },
  );
  // I Treklangsfliken är Ackordets lager cellens Treklangsgrepp, eller utan Box alla Treklangsgrepp över halsen
  const chordTriadPlaces = (() => {
    if (tab !== "triads" || chord === undefined) return undefined;
    const triads = triadsOf(chord);
    return box === undefined ? triads.flatMap(({ places }) => places) : triadPlaces(triads, instances);
  })();

  const pentaTones =
    tab === "penta" && gripQuality !== undefined ? chordPentaSteps(parent, gripQuality, chordTones[0]) : undefined;
  // Penta-boxen i varje kopia av Boxen: den som Penta-tabellen har i Boxens cell
  const pentaBoxPlaces = (() => {
    const pentaBox = pentaTable.find((row) => row.degree === chord)?.cells.find((cell) => cell.box === box)?.pentaBox;
    if (pentaTones === undefined || gripQuality === undefined || pentaBox == null) return undefined;
    const pentaBoxes = pentaBoxInstances(selection.tuning, gripQuality, root + chordTones[0].semitones);
    return fitInBox(pentaBoxes[pentaBox - 1], instances).positions.flat();
  })();
  /** Platserna i Ackordets lager när de är ett mönster (greppet, Penta-boxen eller Treklangsgreppen) och inte bara tonerna. */
  const patternPlaces = grip === undefined ? (pentaBoxPlaces ?? chordTriadPlaces) : gripPlaces(grip, instances);
  const inPattern = new Set((patternPlaces ?? []).map(placeKey));
  // Tonerna i Ackordets lager (Ackordets penta eller toner) visas även när de ligger utanför skalan,
  // som H i ii° för A mollpentatonik
  const chordLayerTones = pentaTones ?? chordTones;
  const inScale = new Set(steps.map((step) => step.semitones));
  const inChord = new Set(chordLayerTones.map((step) => step.semitones));
  const shown = [...steps, ...chordLayerTones.filter((step) => !inScale.has(step.semitones))];
  const inBox = new Set(instances.flat().map(placeKey));
  // En ackordton utanför skalan hör till Boxen när den ligger inom Boxens band
  const insideBox = (step: Step, place: Place) =>
    inScale.has(step.semitones)
      ? inBox.has(placeKey(place))
      : instances.some((instance) => withinSpan(instance, place));

  const layerOf = (step: Step, place: Place): Layer => {
    if (chord === undefined && box === undefined) return "scale";
    // Utan Box gäller Ackordets toner över hela halsen
    const inSelectedBox = box !== undefined && insideBox(step, place);
    const shownAsChord =
      patternPlaces === undefined
        ? inChord.has(step.semitones) && (box === undefined || inSelectedBox)
        : inPattern.has(placeKey(place));
    if (shownAsChord) return "chord";
    return inSelectedBox && inScale.has(step.semitones) ? "box" : "muted";
  };

  const rootRoleOf = (semitones: number): RootRole => {
    if (chordTones.length > 0 && semitones === chordTones[0].semitones) return "chord";
    return semitones === 0 ? "scale" : "none";
  };

  const dots: Dot[] = [];
  selection.tuning.forEach((openPitch, index) => {
    for (let fret = 0; fret <= FRET_COUNT; fret++) {
      const semitones = pitchClassOf(openPitch + fret - root);
      const step = shown.find((candidate) => candidate.semitones === semitones);
      if (!step) continue;
      const place = { string: index + 1, fret };
      dots.push({ ...place, label: labelOf(step), rootRole: rootRoleOf(semitones), layer: layerOf(step, place) });
    }
  });
  const roots = ROOT_MENU.map((spellings) =>
    spellings.map(([letter, accidental]) => noteName(letter, accidental, noteNames)).join("/"),
  );
  return {
    selection: { ...selection, chord, box, caged, tab, strings },
    dots,
    mutedStrings: grip?.mutedStrings ?? [],
    options: { roots, boxes, cagedTable, pentaTable, triadTable, stringSets: STRING_SETS },
  };
}

/** Skalorna i den ordning de erbjuds, med namn för gränssnittet. */
export const SCALES: readonly { id: ScaleId; name: string }[] = [
  { id: "major", name: "Major" },
  { id: "naturalMinor", name: "Natural minor" },
  { id: "majorPentatonic", name: "Major pentatonic" },
  { id: "minorPentatonic", name: "Minor pentatonic" },
  { id: "blues", name: "Blues" },
];
