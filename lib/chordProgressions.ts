/**
 * Ackordföljder: Kvintcirkelns Ackord, deras namn, markeringen, Tonnetzens gitter och skillnaden
 * mellan klick och dragning. Ren modul utan React.
 */

import type { NoteNameMode } from "./noteNameMode";

export type ChordQuality = "major" | "minor";

/** Ett dur- eller mollackord: tonklass 0–11 (C = 0) och kvalitet. */
export interface Chord {
  root: number;
  quality: ChordQuality;
}

/** En plats i Kvintcirkeln: durackordet ytterst och det parallella mollackordet innanför. */
export interface CirclePlace {
  major: Chord;
  minor: Chord;
}

/** Kvintcirkelns tolv platser med C överst, medurs i kvintordning. */
export const CIRCLE_OF_FIFTHS: readonly CirclePlace[] = Array.from({ length: 12 }, (_, index) => {
  const root = (index * 7) % 12;
  return { major: { root, quality: "major" }, minor: { root: (root + 9) % 12, quality: "minor" } };
});

/** Tonernas fasta stavning per tonklass. Durackorden heter som sin grundton. */
const NOTE_NAMES = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
/** Mollackordens grundtoner, som stavas annorlunda på de svarta tangenterna (C♯m, G♯m). */
const MINOR_ROOT_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"];

/** På svenska heter B H, och B♭ heter B. */
function inMode(name: string, mode: NoteNameMode): string {
  if (mode !== "swedish") return name;
  if (name === "B♭") return "B";
  return name.replace(/^B/, "H");
}

/** Ackordets namn, t.ex. "C", "F♯m" eller i svenskt Notnamnsläge "Hm". */
export function chordName(chord: Chord, mode: NoteNameMode): string {
  if (chord.quality === "major") return inMode(NOTE_NAMES[chord.root], mode);
  return `${inMode(MINOR_ROOT_NAMES[chord.root], mode)}m`;
}

/** Namnet i Kvintcirkeln: Ackordets namn, men "F♯/G♭" på F♯-platsen. */
export function circleLabel(chord: Chord, mode: NoteNameMode): string {
  if (chord.quality === "major" && chord.root === 6) return "F♯/G♭";
  return chordName(chord, mode);
}

export function sameChord(a: Chord | null, b: Chord | null): boolean {
  return a !== null && b !== null && a.root === b.root && a.quality === b.quality;
}

/** Det markerade Ackordet: det hovrade om något hovras, annars det låsta. */
export function shownChord(locked: Chord | null, hovered: Chord | null): Chord | null {
  return hovered ?? locked;
}

/** Det låsta Ackordet efter ett klick på ett Ackord, eller utanför Ackorden (`null`). */
export function clickedChord(locked: Chord | null, clicked: Chord | null): Chord | null {
  return clicked === null || sameChord(locked, clicked) ? null : clicked;
}

/** Platsen i Kvintcirkeln för ett Ackord. */
function placeOf(chord: Chord): number {
  return CIRCLE_OF_FIFTHS.findIndex((place) => sameChord(place[chord.quality], chord));
}

/**
 * Ackordet efter en piltangent i Kvintcirkeln: höger medurs och vänster moturs i kvintordning, upp
 * till durackordet och ner till mollackordet på samma plats. Utan Ackord blir det C-dur. Andra
 * tangenter ger `null`.
 */
export function stepInCircle(chord: Chord | null, key: string): Chord | null {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(key)) return null;
  if (chord === null) return CIRCLE_OF_FIFTHS[0].major;
  const index = placeOf(chord);
  switch (key) {
    case "ArrowRight":
      return CIRCLE_OF_FIFTHS[(index + 1) % 12][chord.quality];
    case "ArrowLeft":
      return CIRCLE_OF_FIFTHS[(index + 11) % 12][chord.quality];
    case "ArrowUp":
      return CIRCLE_OF_FIFTHS[index].major;
    default:
      return CIRCLE_OF_FIFTHS[index].minor;
  }
}

/** Tonnamnet för en tonklass, med samma fasta stavning som durackorden. */
export function noteNameOf(pitch: number, mode: NoteNameMode): string {
  return inMode(NOTE_NAMES[pitch], mode);
}

// Tonnetzen: hörnet (i, j) har tonklassen 7i + 4j. Kvinter ligger vågrätt (i), stora terser
// längs diagonalen uppåt höger (j) och små terser längs diagonalen uppåt vänster.

/** En punkt i pixlar, med y nedåt som på skärmen. */
export interface Point {
  x: number;
  y: number;
}

/** Ett hörn i Tonnetzens gitter. */
export type LatticePoint = readonly [i: number, j: number];

const ROW_HEIGHT = Math.sqrt(3) / 2;

/** Tonklassen 0–11 i hörnet (i, j). */
export function vertexPitch(i: number, j: number): number {
  return (((7 * i + 4 * j) % 12) + 12) % 12;
}

/** Hörnets läge i pixlar relativt hörnet (0, 0), med y nedåt som på skärmen så att j går uppåt. */
export function vertexPosition(i: number, j: number, edge: number): Point {
  return { x: (i + j / 2) * edge, y: -j * ROW_HEIGHT * edge };
}

/** En triangel i gittret: hörnen och Ackordet. Cellen (i, j) har en dur- och en molltriangel. */
export interface Triangle {
  i: number;
  j: number;
  chord: Chord;
  vertices: readonly [LatticePoint, LatticePoint, LatticePoint];
}

/** Durackordet på (i, j): hörnen (i, j), (i+1, j) och (i, j+1). */
export function majorTriangle(i: number, j: number): Triangle {
  return { i, j, chord: { root: vertexPitch(i, j), quality: "major" }, vertices: [[i, j], [i + 1, j], [i, j + 1]] };
}

/** Mollackordet på (i, j+1), alltså tersen i durackordet nedanför: hörnen (i+1, j), (i, j+1) och (i+1, j+1). */
export function minorTriangle(i: number, j: number): Triangle {
  return {
    i,
    j,
    chord: { root: vertexPitch(i, j + 1), quality: "minor" },
    vertices: [[i + 1, j], [i, j + 1], [i + 1, j + 1]],
  };
}

/** Rutan som Tonnetzen visas i: dragningens förskjutning, storleken och kantlängden, i pixlar. */
export interface TonnetzView {
  offset: Point;
  width: number;
  height: number;
  edge: number;
}

export interface VisibleTriangle extends Triangle {
  /** Hörnen i rutans pixlar, i samma ordning som `vertices`. */
  points: readonly [Point, Point, Point];
}

/** Triangelns mittpunkt, där ackordnamnet står. */
export function triangleCenter({ points: [a, b, c] }: VisibleTriangle): Point {
  return { x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 };
}

export interface VisibleVertex {
  i: number;
  j: number;
  pitch: number;
  x: number;
  y: number;
}

/** Var hörnet (0, 0) ligger i rutan, så att C-durs mittpunkt hamnar mitt i rutan plus förskjutningen. */
function origin({ offset, width, height, edge }: TonnetzView) {
  return { x: width / 2 + offset.x - edge / 2, y: height / 2 + offset.y + (ROW_HEIGHT * edge) / 3 };
}

/** Hörnets läge i rutan. */
function onScreen(view: TonnetzView, i: number, j: number): Point {
  const o = origin(view);
  const p = vertexPosition(i, j, view.edge);
  return { x: o.x + p.x, y: o.y + p.y };
}

/** Cellerna (i, j) som syns i rutan, med en cells marginal runt om så att inga hål syns vid kanterna. */
function visibleCells(view: TonnetzView): LatticePoint[] {
  const o = origin(view);
  const { edge, width, height } = view;
  const rowOf = (y: number) => -(y - o.y) / (ROW_HEIGHT * edge);
  const cells: LatticePoint[] = [];
  for (let j = Math.floor(rowOf(height)) - 1; j <= Math.ceil(rowOf(0)) + 1; j++) {
    const columnOf = (x: number) => (x - o.x) / edge - j / 2;
    for (let i = Math.floor(columnOf(0)) - 1; i <= Math.ceil(columnOf(width)) + 1; i++) cells.push([i, j]);
  }
  return cells;
}

/** Trianglarna som syns i rutan. De räknas fram ur förskjutningen, så ytan tar aldrig slut. */
export function visibleTriangles(view: TonnetzView): VisibleTriangle[] {
  return visibleCells(view).flatMap(([i, j]) =>
    [majorTriangle(i, j), minorTriangle(i, j)].map((triangle) => ({
      ...triangle,
      points: [onScreen(view, ...triangle.vertices[0]), onScreen(view, ...triangle.vertices[1]), onScreen(view, ...triangle.vertices[2])],
    })),
  );
}

/** Nyckeln för en punkt (i, j) i gittret, ett hörn eller en cell, t.ex. i en mängd hörn eller som React-nyckel. */
export function latticeKey(i: number, j: number): string {
  return `${i},${j}`;
}

/** Alla synliga kopior av Ackordets triangel. */
export function chordCopies(view: TonnetzView, chord: Chord | null): VisibleTriangle[] {
  return chord ? visibleTriangles(view).filter((triangle) => sameChord(triangle.chord, chord)) : [];
}

/** Hörnen till alla synliga kopior av Ackordet, som nycklar från `latticeKey`. */
export function chordVertices(view: TonnetzView, chord: Chord | null): Set<string> {
  return new Set(chordCopies(view, chord).flatMap((triangle) => triangle.vertices.map(([i, j]) => latticeKey(i, j))));
}

/** Hörnen till de synliga trianglarna, vart och ett en gång. */
export function visibleVertices(view: TonnetzView): VisibleVertex[] {
  const seen = new Map<string, VisibleVertex>();
  for (const [i, j] of visibleCells(view)) {
    for (const [vi, vj] of [[i, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]] as const) {
      const key = latticeKey(vi, vj);
      if (!seen.has(key)) seen.set(key, { i: vi, j: vj, pitch: vertexPitch(vi, vj), ...onScreen(view, vi, vj) });
    }
  }
  return [...seen.values()];
}

/**
 * Hur långt pekaren får röra sig från nedtryckningen för att det ska räknas som ett klick. Går den
 * längre är det en dragning, även om den kommer tillbaka.
 */
export const DRAG_THRESHOLD = 5;

/** Om pekarens rörelse från `start` till `end` är en dragning i stället för ett klick. */
export function isDrag(start: Point, end: Point): boolean {
  return Math.hypot(end.x - start.x, end.y - start.y) > DRAG_THRESHOLD;
}
