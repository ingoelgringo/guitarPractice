/** Greppbrädans val i adressens query-parametrar, så att det går att bokmärka och dela. */

import { DEFAULT_LABEL_MODE, type FretboardSelection, type LabelMode, type ScaleId } from "./fretboard";

/** Det man väljer på Greppbrädan och som ligger i adressen. Notnamnsläget sparas i webbläsaren i stället. */
export type FretboardChoice = Required<Pick<FretboardSelection, "root" | "scale" | "labels">> & Pick<FretboardSelection, "chord">;

const DEFAULT_CHOICE: FretboardChoice = { root: 9, scale: "minorPentatonic", labels: DEFAULT_LABEL_MODE };

/** Grundtonen per tonklass i adressen: engelska namn, sänkta toner för de svarta tangenterna. */
const ROOT_PARAMS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
/** Korsförtecken som också förstås när någon skriver adressen själv. */
const SHARP_ROOT_PARAMS = ["C#", "D#", "F#", "G#", "A#"];
const SHARP_ROOTS = [1, 3, 6, 8, 10];

/** Grundtonens tonklass i adressen, oavsett skiftläge, eller -1. */
function parseRoot(value: string | null): number {
  const token = (value ?? "").toLowerCase();
  const flat = ROOT_PARAMS.findIndex((param) => param.toLowerCase() === token);
  if (flat !== -1) return flat;
  const sharp = SHARP_ROOT_PARAMS.findIndex((param) => param.toLowerCase() === token);
  return sharp === -1 ? -1 : SHARP_ROOTS[sharp];
}

const SCALE_PARAMS: Record<ScaleId, string> = {
  major: "major",
  naturalMinor: "natural-minor",
  majorPentatonic: "major-pentatonic",
  minorPentatonic: "minor-pentatonic",
  blues: "blues",
};

const LABEL_PARAMS: Record<LabelMode, string> = { interval: "intervals", noteName: "notes" };

/** Den nyckel i `params` vars värde är `value`, om någon. */
function keyOf<K extends string>(params: Record<K, string>, value: string | null): K | undefined {
  return (Object.keys(params) as K[]).find((key) => params[key] === value);
}

/** Ackordets steg i adressen, eller inget. Om steget finns i Skalan avgör `fretboardView`. */
function parseChord(value: string | null): number | undefined {
  return value !== null && /^[1-9]$/.test(value) ? Number(value) : undefined;
}

/** Valet i adressen. Saknade eller ogiltiga värden ger standardvalet, vart och ett för sig. */
export function choiceFromParams(params: URLSearchParams): FretboardChoice {
  const root = parseRoot(params.get("root"));
  return {
    root: root === -1 ? DEFAULT_CHOICE.root : root,
    scale: keyOf(SCALE_PARAMS, params.get("scale")) ?? DEFAULT_CHOICE.scale,
    labels: keyOf(LABEL_PARAMS, params.get("labels")) ?? DEFAULT_CHOICE.labels,
    chord: parseChord(params.get("chord")),
  };
}

/** Valet som parametrar för adressen, t.ex. `root=Eb&scale=blues&labels=notes&chord=4`. */
export function choiceToParams(choice: FretboardChoice): URLSearchParams {
  const params = new URLSearchParams({
    root: ROOT_PARAMS[choice.root],
    scale: SCALE_PARAMS[choice.scale],
    labels: LABEL_PARAMS[choice.labels],
  });
  if (choice.chord !== undefined) params.set("chord", String(choice.chord));
  return params;
}
