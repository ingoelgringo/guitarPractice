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
  const emphasisOf = (step: Step): Emphasis => {
    if (chord === undefined) return "scale";
    return inChord.has(step.semitones) ? "highlighted" : "muted";
  };

  const dots: Dot[] = [];
  selection.tuning.forEach((openPitch, index) => {
    for (let fret = 0; fret <= FRET_COUNT; fret++) {
      const semitones = (((openPitch + fret - root) % 12) + 12) % 12;
      const step = shown.find((candidate) => candidate.semitones === semitones);
      if (!step) continue;
      dots.push({ string: index + 1, fret, label: labelOf(step), isRoot: semitones === 0, emphasis: emphasisOf(step) });
    }
  });
  const roots = ROOT_MENU.map((spellings) =>
    spellings.map(([letter, accidental]) => noteName(letter, accidental, noteNames)).join("/"),
  );
  const chords = parent.map((step) => chordOption(parent, step.degree, (chordRoot) => stepName(letter, root, chordRoot, noteNames)));
  return { selection: { ...selection, chord }, dots, options: { roots, chords } };
}

/** Skalorna i den ordning de erbjuds, med namn för gränssnittet. */
export const SCALES: readonly { id: ScaleId; name: string }[] = [
  { id: "major", name: "Major" },
  { id: "naturalMinor", name: "Natural minor" },
  { id: "majorPentatonic", name: "Major pentatonic" },
  { id: "minorPentatonic", name: "Minor pentatonic" },
  { id: "blues", name: "Blues" },
];
