"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { browserStorage } from "@/lib/draft";
import { type CagedShape, DEFAULT_NOTE_NAME_MODE, FRET_COUNT, fretboardView, INLAY_FRETS, type LabelMode, type NoteNameMode, SCALES, type ScaleId } from "@/lib/fretboard";
import { choiceToParams, type FretboardChoice } from "@/lib/fretboardParams";
import { STANDARD_TUNING } from "@/lib/score";
import styles from "./Fretboard.module.css";

// Halsens mått i SVG-enheter
/** Kolumnen längst till vänster med × för strängar som CAGED-greppet dämpar. */
const MUTE_WIDTH = 20;
const OPEN_WIDTH = 44;
const NUT_X = MUTE_WIDTH + OPEN_WIDTH;
const FRET_WIDTH = 64;
const STRING_GAP = 32;
const TOP = 24;
const BOTTOM = 32;
const DOT_RADIUS = 13;
const INLAY_RADIUS = 6;
const END_MARGIN = 8;

const STRING_COUNT = STANDARD_TUNING.length;
const NECK_HEIGHT = (STRING_COUNT - 1) * STRING_GAP;
const WIDTH = NUT_X + FRET_COUNT * FRET_WIDTH + END_MARGIN;
const HEIGHT = TOP + NECK_HEIGHT + BOTTOM;

// Notnamnsläget sparas per webbläsare, med svenskt som standard. Det ligger inte i adressen.
const NOTE_NAME_KEY = "guitarPractice.fretboard.noteNames";
const noteNameListeners = new Set<() => void>();

function readNoteNameMode(): NoteNameMode {
  try {
    return browserStorage()?.getItem(NOTE_NAME_KEY) === "english" ? "english" : DEFAULT_NOTE_NAME_MODE;
  } catch {
    return DEFAULT_NOTE_NAME_MODE;
  }
}

function saveNoteNameMode(mode: NoteNameMode) {
  try {
    browserStorage()?.setItem(NOTE_NAME_KEY, mode);
  } catch {
    // Utan lagring gäller valet bara tills sidan laddas om
  }
  noteNameListeners.forEach((listener) => listener());
}

function subscribeNoteNameMode(listener: () => void) {
  noteNameListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    noteNameListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** x-mitten för ett band: lös sträng till vänster om sadeln, övriga mitt mellan bandstavarna. */
function fretCenter(fret: number): number {
  return fret === 0 ? MUTE_WIDTH + OPEN_WIDTH / 2 : NUT_X + (fret - 0.5) * FRET_WIDTH;
}

/** y för en sträng. Sträng 1 (ljusa e) överst, som i tabulatur. */
function stringY(string: number): number {
  return TOP + (string - 1) * STRING_GAP;
}

export function Fretboard({ initialChoice }: { initialChoice: FretboardChoice }) {
  const [choice, setChoice] = useState(initialChoice);
  const noteNames = useSyncExternalStore(subscribeNoteNameMode, readNoteNameMode, () => DEFAULT_NOTE_NAME_MODE);
  const { root, scale, labels } = choice;
  const { selection, dots, mutedStrings, options } = fretboardView({ ...choice, noteNames, tuning: STANDARD_TUNING });
  const { chord, box, caged } = selection;
  const cagedDisabled = options.cagedShapes.every((option) => option.disabled);

  /** Byter val och skriver det i adressen, utan en ny post i historiken per val. Val som inte gäller släpps. */
  function choose(change: Partial<FretboardChoice>) {
    const next = { ...choice, ...change };
    const normalized = fretboardView({ ...next, tuning: STANDARD_TUNING }).selection;
    next.chord = normalized.chord;
    next.box = normalized.box;
    next.caged = normalized.caged;
    setChoice(next);
    window.history.replaceState(null, "", `?${choiceToParams(next)}`);
  }

  return (
    <main className={styles.page}>
      <nav aria-label="Site">
        <Link href="/">← Guitar Practice</Link>
      </nav>
      <h1>Fretboard</h1>
      <div className={styles.controls}>
        <label>
          Root{" "}
          <select value={root} onChange={(event) => choose({ root: Number(event.target.value) })}>
            {options.roots.map((name, pitchClass) => (
              <option key={pitchClass} value={pitchClass}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Scale{" "}
          <select value={scale} onChange={(event) => choose({ scale: event.target.value as ScaleId })}>
            {SCALES.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Chord{" "}
          <select
            value={chord ?? ""}
            onChange={(event) => choose({ chord: event.target.value === "" ? undefined : Number(event.target.value) })}
          >
            <option value="">None</option>
            {options.chords.map(({ degree, numeral, name }) => (
              <option key={degree} value={degree}>
                {numeral} – {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Box{" "}
          <select
            value={box ?? ""}
            onChange={(event) => choose({ box: event.target.value === "" ? undefined : Number(event.target.value) })}
          >
            <option value="">None</option>
            {options.boxes.map((number) => (
              <option key={number} value={number}>
                Box {number}
              </option>
            ))}
          </select>
        </label>
        <label>
          CAGED{" "}
          <select
            value={caged ?? ""}
            disabled={cagedDisabled}
            title={cagedDisabled ? "Choose a major or minor chord to see its CAGED shapes" : undefined}
            onChange={(event) => choose({ caged: event.target.value === "" ? undefined : (event.target.value as CagedShape) })}
          >
            <option value="">None</option>
            {options.cagedShapes.map(({ shape, disabled }) => (
              <option key={shape} value={shape} disabled={disabled}>
                {shape} shape
              </option>
            ))}
          </select>
        </label>
        <label>
          Labels{" "}
          <select value={labels} onChange={(event) => choose({ labels: event.target.value as LabelMode })}>
            <option value="interval">Intervals</option>
            <option value="noteName">Note names</option>
          </select>
        </label>
        <label>
          Note names{" "}
          <select value={noteNames} onChange={(event) => saveNoteNameMode(event.target.value as NoteNameMode)}>
            <option value="swedish">Swedish (H, B)</option>
            <option value="english">English (B, B♭)</option>
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
          aria-label={`${options.roots[root]} ${SCALES.find((s) => s.id === scale)?.name} on the fretboard`}
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
              x1={NUT_X + i * FRET_WIDTH}
              x2={NUT_X + i * FRET_WIDTH}
              y1={TOP}
              y2={TOP + NECK_HEIGHT}
            />
          ))}
          {Array.from({ length: STRING_COUNT }, (_, i) => (
            <line key={i} className={styles.string} x1={NUT_X} x2={WIDTH - END_MARGIN} y1={stringY(i + 1)} y2={stringY(i + 1)} />
          ))}
          {Array.from({ length: FRET_COUNT }, (_, i) => (
            <text key={i} className={styles.fretNumber} x={fretCenter(i + 1)} y={HEIGHT - 8}>
              {i + 1}
            </text>
          ))}
          {mutedStrings.map((string) => (
            <text key={string} className={styles.mutedString} x={MUTE_WIDTH / 2} y={stringY(string)}>
              ×
            </text>
          ))}
          {dots.map((dot) => (
            <g
              key={`${dot.string}-${dot.fret}`}
              className={[dot.isRoot ? styles.rootDot : styles.dot, styles[dot.emphasis]].filter(Boolean).join(" ")}
            >
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
