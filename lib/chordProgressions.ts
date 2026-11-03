/** Ackordföljder: Kvintcirkelns Ackord, deras namn och markeringen. Ren modul utan React. */

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
