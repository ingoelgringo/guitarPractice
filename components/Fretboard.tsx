"use client";

import Link from "next/link";
import { useState } from "react";
import { FRET_COUNT, fretboardView, INLAY_FRETS, ROOT_NAMES, SCALES, type ScaleId } from "@/lib/fretboard";
import { STANDARD_TUNING } from "@/lib/score";
import styles from "./Fretboard.module.css";

// Halsens mått i SVG-enheter
const OPEN_WIDTH = 44;
const FRET_WIDTH = 64;
const STRING_GAP = 32;
const TOP = 24;
const BOTTOM = 32;
const DOT_RADIUS = 13;
const INLAY_RADIUS = 6;
const END_MARGIN = 8;

// Startvalet: A mollpentatonik, den vanligaste skalan att börja med
const START_ROOT = 9;

const STRING_COUNT = STANDARD_TUNING.length;
const NECK_HEIGHT = (STRING_COUNT - 1) * STRING_GAP;
const WIDTH = OPEN_WIDTH + FRET_COUNT * FRET_WIDTH + END_MARGIN;
const HEIGHT = TOP + NECK_HEIGHT + BOTTOM;

/** x-mitten för ett band: lös sträng till vänster om sadeln, övriga mitt mellan bandstavarna. */
function fretCenter(fret: number): number {
  return fret === 0 ? OPEN_WIDTH / 2 : OPEN_WIDTH + (fret - 0.5) * FRET_WIDTH;
}

/** y för en sträng. Sträng 1 (ljusa e) överst, som i tabulatur. */
function stringY(string: number): number {
  return TOP + (string - 1) * STRING_GAP;
}

export function Fretboard() {
  const [root, setRoot] = useState(START_ROOT);
  const [scale, setScale] = useState<ScaleId>("minorPentatonic");
  const { dots } = fretboardView({ root, scale, tuning: STANDARD_TUNING });

  return (
    <main className={styles.page}>
      <nav aria-label="Site">
        <Link href="/">← Guitar Practice</Link>
      </nav>
      <h1>Fretboard</h1>
      <div className={styles.controls}>
        <label>
          Root{" "}
          <select value={root} onChange={(event) => setRoot(Number(event.target.value))}>
            {ROOT_NAMES.map((name, pitchClass) => (
              <option key={pitchClass} value={pitchClass}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Scale{" "}
          <select value={scale} onChange={(event) => setScale(event.target.value as ScaleId)}>
            {SCALES.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={styles.scroller}>
        <svg
          className={styles.neck}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width={WIDTH}
          height={HEIGHT}
          role="img"
          aria-label={`${ROOT_NAMES[root]} ${SCALES.find((s) => s.id === scale)?.name} on the fretboard`}
        >
          {INLAY_FRETS.map((fret) =>
            fret === 12 ? (
              <g key={fret} className={styles.inlay}>
                <circle cx={fretCenter(fret)} cy={TOP + STRING_GAP * 1.5} r={INLAY_RADIUS} />
                <circle cx={fretCenter(fret)} cy={TOP + STRING_GAP * 3.5} r={INLAY_RADIUS} />
              </g>
            ) : (
              <circle key={fret} className={styles.inlay} cx={fretCenter(fret)} cy={TOP + NECK_HEIGHT / 2} r={INLAY_RADIUS} />
            ),
          )}
          {Array.from({ length: FRET_COUNT + 1 }, (_, i) => (
            <line
              key={i}
              className={i === 0 ? styles.nut : styles.fretWire}
              x1={OPEN_WIDTH + i * FRET_WIDTH}
              x2={OPEN_WIDTH + i * FRET_WIDTH}
              y1={TOP}
              y2={TOP + NECK_HEIGHT}
            />
          ))}
          {Array.from({ length: STRING_COUNT }, (_, i) => (
            <line key={i} className={styles.string} x1={OPEN_WIDTH} x2={WIDTH - END_MARGIN} y1={stringY(i + 1)} y2={stringY(i + 1)} />
          ))}
          {Array.from({ length: FRET_COUNT }, (_, i) => (
            <text key={i} className={styles.fretNumber} x={fretCenter(i + 1)} y={HEIGHT - 8}>
              {i + 1}
            </text>
          ))}
          {dots.map((dot) => (
            <g key={`${dot.string}-${dot.fret}`} className={dot.isRoot ? styles.rootDot : styles.dot}>
              <circle cx={fretCenter(dot.fret)} cy={stringY(dot.string)} r={DOT_RADIUS} />
              <text x={fretCenter(dot.fret)} y={stringY(dot.string)}>
                {dot.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </main>
  );
}
