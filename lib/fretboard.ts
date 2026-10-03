/** Greppbrädan: vilka Prickar halsen visar för ett urval. Ren modul utan React. */

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

/** Treklangens steg och namn, med Ackordets grundton stavad efter tonarten. */
function chordOption(parent: readonly Step[], degree: number, nameOf: (step: Step) => string): ChordOption {
  const [chordRoot, third, fifth] = chordSteps(parent, degree);
  const minor = interval(chordRoot, third) === 3;
  const diminished = minor && interval(chordRoot, fifth) === 6;
  const numeral = minor ? NUMERALS[degree - 1].toLowerCase() : NUMERALS[degree - 1];
  const suffix = diminished ? "°" : minor ? "m" : "";
  return { degree, numeral: diminished ? `${numeral}°` : numeral, name: `${nameOf(chordRoot)}${suffix}` };
}

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
}

/** Hur starkt en Prick visas: nedtonad, som en vanlig skalton eller framhävd. */
export type Emphasis = "muted" | "scale" | "highlighted";

/** En Prick: en markerad position på halsen. Sträng 1 är den ljusaste. */
export interface Dot {
  string: number;
  fret: number;
  label: string;
  isRoot: boolean;
  emphasis: Emphasis;
}

export interface FretboardView {
  /** Urvalet med de val som inte gäller för Skalan borttagna. */
  selection: FretboardSelection;
  dots: Dot[];
  /** Det som går att välja, med namn för gränssnittet. */
  options: {
    /** Grundtonsmenyns namn per tonklass, C först. */
    roots: string[];
    /** Skalans Ackord, hämtade från Föräldraskalan, steg 1 först. */
    chords: ChordOption[];
    /** Skalans Boxar, 1–5. */
    boxes: number[];
  };
}

export function fretboardView(selection: FretboardSelection): FretboardView {
  const { root, labels = DEFAULT_LABEL_MODE, noteNames = DEFAULT_NOTE_NAME_MODE } = selection;
  const { steps, parent } = SCALE_STEPS[selection.scale];
  const letter = rootLetter(root, parent);
  const chord = parent.some((step) => step.degree === selection.chord) ? selection.chord : undefined;
  const labelOf = (step: Step) => (labels === "interval" ? intervalLabel(step) : stepName(letter, root, step, noteNames));

  // Ackordets toner visas även när de ligger utanför skalan, som H i ii° för A mollpentatonik
  const chordTones = chord === undefined ? [] : chordSteps(parent, chord);
  const inScale = new Set(steps.map((step) => step.semitones));
  const inChord = new Set(chordTones.map((step) => step.semitones));
  const shown = [...steps, ...chordTones.filter((step) => !inScale.has(step.semitones))];
  const requestedBox = selection.box ?? 0;
  const box = Number.isInteger(requestedBox) && requestedBox >= 1 && requestedBox <= BOX_COUNT ? requestedBox : undefined;
  const instances = box === undefined ? [] : boxInstances(boxShape(selection, box));
  const inBox = new Set(instances.flat().map(placeKey));
  // En ackordton utanför skalan hör till Boxen när den ligger inom Boxens band
  const insideBox = (step: Step, place: Place) =>
    inScale.has(step.semitones)
      ? inBox.has(placeKey(place))
      : instances.some((instance) => {
          const { low, high } = fretSpan(instance);
          return place.fret >= low && place.fret <= high;
        });

  // Varje valt lager (Ackord, Box) är ett filter. En Prick som klarar alla framhävs, en som klarar något visas som skalton.
  const emphasisOf = (step: Step, place: Place): Emphasis => {
    const filters = [
      ...(chord === undefined ? [] : [inChord.has(step.semitones)]),
      ...(box === undefined ? [] : [insideBox(step, place)]),
    ];
    if (filters.length === 0) return "scale";
    if (filters.every(Boolean)) return "highlighted";
    return filters.some(Boolean) ? "scale" : "muted";
  };

  const dots: Dot[] = [];
  selection.tuning.forEach((openPitch, index) => {
    for (let fret = 0; fret <= FRET_COUNT; fret++) {
      const semitones = pitchClassOf(openPitch + fret - root);
      const step = shown.find((candidate) => candidate.semitones === semitones);
      if (!step) continue;
      const place = { string: index + 1, fret };
      dots.push({ ...place, label: labelOf(step), isRoot: semitones === 0, emphasis: emphasisOf(step, place) });
    }
  });
  const boxes = Array.from({ length: BOX_COUNT }, (_, i) => i + 1);
  const roots = ROOT_MENU.map((spellings) =>
    spellings.map(([letter, accidental]) => noteName(letter, accidental, noteNames)).join("/"),
  );
  const chords = parent.map((step) => chordOption(parent, step.degree, (chordRoot) => stepName(letter, root, chordRoot, noteNames)));
  return { selection: { ...selection, chord, box }, dots, options: { roots, chords, boxes } };
}

/** Skalorna i den ordning de erbjuds, med namn för gränssnittet. */
export const SCALES: readonly { id: ScaleId; name: string }[] = [
  { id: "major", name: "Major" },
  { id: "naturalMinor", name: "Natural minor" },
  { id: "majorPentatonic", name: "Major pentatonic" },
  { id: "minorPentatonic", name: "Minor pentatonic" },
  { id: "blues", name: "Blues" },
];
