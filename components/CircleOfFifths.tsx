"use client";

import type { FocusEvent, KeyboardEvent } from "react";
import { type Chord, CIRCLE_OF_FIFTHS, circleLabel, sameChord, stepInCircle } from "@/lib/chordProgressions";
import type { NoteNameMode } from "@/lib/noteNameMode";
import styles from "./ChordProgressions.module.css";
import { CHORD_ATTRIBUTE } from "./chordElement";


// Mått i SVG-enheter, med mitten i (0, 0)
const OUTER = 190;
const MIDDLE = 128;
const INNER = 70;
const SIZE = OUTER + 6;
/** Varje plats tar en tolftedel av varvet, med C mitt överst. */
const STEP = Math.PI / 6;

/** En punkt på radien `radius` vid vinkeln `angle`, räknad medurs från klockan tolv. */
function point(radius: number, angle: number): string {
  return `${(radius * Math.sin(angle)).toFixed(2)} ${(-radius * Math.cos(angle)).toFixed(2)}`;
}

/** Ringsegmentet för plats `index` mellan radierna `inner` och `outer`. */
function segment(index: number, inner: number, outer: number): string {
  const from = (index - 0.5) * STEP;
  const to = (index + 0.5) * STEP;
  return [
    `M ${point(outer, from)}`,
    `A ${outer} ${outer} 0 0 1 ${point(outer, to)}`,
    `L ${point(inner, to)}`,
    `A ${inner} ${inner} 0 0 0 ${point(inner, from)}`,
    "Z",
  ].join(" ");
}

function labelPosition(index: number, radius: number) {
  const angle = index * STEP;
  return { x: radius * Math.sin(angle), y: -radius * Math.cos(angle) };
}

interface Props {
  noteNames: NoteNameMode;
  /** Ackordföljdens Tonart, som markeras med en ring. */
  tonic: Chord | null;
  locked: Chord | null;
  /** Det markerade Ackordet, som fylls grönt. */
  shown: Chord | null;
  /** Ackordet som tangentbordet står på, eller `null` när Kvintcirkeln inte har synligt fokus. */
  focused: Chord | null;
  label: string;
  onHover: (chord: Chord | null) => void;
  onFocusChord: (chord: Chord | null) => void;
  onLock: (chord: Chord) => void;
  onRelease: () => void;
}

/**
 * Kvintcirkeln som SVG: durackorden ytterst med C överst, medurs i kvintordning, och de parallella
 * mollackorden innanför. Den är fokuserbar och styrs med piltangenterna, Enter och Esc.
 */
export function CircleOfFifths({ noteNames, tonic, locked, shown, focused, label, onHover, onFocusChord, onLock, onRelease }: Props) {
  function onFocus(event: FocusEvent<SVGSVGElement>) {
    // Bara fokus från tangentbordet visas; ett musklick ska inte markera C-dur
    if (event.currentTarget.matches(":focus-visible")) onFocusChord(locked ?? CIRCLE_OF_FIFTHS[0].major);
  }

  function onKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    const next = stepInCircle(focused ?? locked, event.key);
    if (next) {
      event.preventDefault();
      onFocusChord(next);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const chord = focused ?? locked ?? CIRCLE_OF_FIFTHS[0].major;
      onFocusChord(chord);
      onLock(chord);
    } else if (event.key === "Escape") {
      onRelease();
    }
  }

  const ring = (chord: Chord, index: number, inner: number, outer: number) => {
    const { x, y } = labelPosition(index, (inner + outer) / 2);
    const classes = [
      styles.segment,
      chord.quality === "minor" ? styles.minor : styles.major,
      sameChord(chord, shown) ? styles.shown : "",
      sameChord(chord, focused) ? styles.focused : "",
      sameChord(chord, tonic) ? styles.tonic : "",
    ];
    return (
      <g
        key={`${chord.quality}${chord.root}`}
        {...{ [CHORD_ATTRIBUTE]: "" }}
        className={classes.join(" ")}
        onPointerEnter={() => onHover(chord)}
        onPointerLeave={() => onHover(null)}
        onClick={() => onLock(chord)}
      >
        <path d={segment(index, inner, outer)} />
        <text x={x} y={y} textAnchor="middle" dominantBaseline="central">
          {circleLabel(chord, noteNames)}
        </text>
      </g>
    );
  };

  return (
    <svg
      className={styles.circleSvg}
      viewBox={`${-SIZE} ${-SIZE} ${2 * SIZE} ${2 * SIZE}`}
      role="group"
      aria-label={label}
      tabIndex={0}
      onFocus={onFocus}
      onBlur={() => onFocusChord(null)}
      onKeyDown={onKeyDown}
    >
      {CIRCLE_OF_FIFTHS.map((place, index) => ring(place.major, index, MIDDLE, OUTER))}
      {CIRCLE_OF_FIFTHS.map((place, index) => ring(place.minor, index, INNER, MIDDLE))}
    </svg>
  );
}
