"use client";

import { type MouseEvent, type PointerEvent, useLayoutEffect, useRef, useState } from "react";
import {
  type Chord,
  chordName,
  chordVertices,
  isDrag,
  latticeKey,
  noteNameOf,
  type Point,
  sameChord,
  triangleCenter,
  visibleTriangles,
  visibleVertices,
} from "@/lib/chordProgressions";
import type { NoteNameMode } from "@/lib/noteNameMode";
import styles from "./ChordProgressions.module.css";
import { CHORD_ATTRIBUTE } from "./chordElement";

/** Kantlängden på en triangel, i pixlar. */
const EDGE = 84;
const VERTEX_RADIUS = 14;

/** En pågående nedtryckning: var den började och förskjutningen då. */
interface Press {
  pointerId: number;
  start: Point;
  startOffset: Point;
  dragging: boolean;
}

interface Props {
  noteNames: NoteNameMode;
  /** Det markerade Ackordet. Alla synliga kopior av dess triangel fylls grönt och hörnen markeras. */
  shown: Chord | null;
  label: string;
  onHover: (chord: Chord | null) => void;
  onLock: (chord: Chord) => void;
}

/**
 * Tonnetzen som SVG: en oändlig yta av trianglar som dras med mus eller finger. Bara de synliga
 * trianglarna ritas, och de räknas fram ur förskjutningen. C-dur står mitt i rutan från början.
 * En triangel som hovras eller klickas markerar sitt Ackord; en dragning låser ingenting.
 */
export function Tonnetz({ noteNames, shown, label, onHover, onLock }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const press = useRef<Press | null>(null);
  /** Om den senaste nedtryckningen blev en dragning. Då är klicket som följer inget klick. */
  const dragged = useRef(false);
  /**
   * Triangeln som trycktes ner. Det är den som ett klick låser, även om pekaren rört sig lite över en
   * kant innan uppsläppet; då hamnar klicket på rutan och inte på någon triangel.
   */
  const pressedChord = useRef<Chord | null>(null);
  const [dragging, setDragging] = useState(false);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => setSize({ width: box.clientWidth, height: box.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  function onPointerDown(event: PointerEvent<SVGSVGElement>) {
    if (press.current || (event.pointerType === "mouse" && event.button !== 0)) return;
    dragged.current = false;
    // Triangelns egen pointerdown har redan körts och satt `pressedChord`
    press.current = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      startOffset: offset,
      dragging: false,
    };
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    const current = press.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const now = { x: event.clientX, y: event.clientY };
    // Inom tröskeln är det ett klick, och ytan står still så att ett tryck inte darrar
    if (!current.dragging && !isDrag(current.start, now)) return;
    if (!current.dragging) {
      // Pekaren fångas först när det blivit en dragning, så att ett klick når triangeln under den
      event.currentTarget.setPointerCapture(event.pointerId);
      current.dragging = true;
      setDragging(true);
      // Under dragningen står pekaren inte över något Ackord; det låsta ligger kvar
      onHover(null);
    }
    setOffset({
      x: current.startOffset.x + now.x - current.start.x,
      y: current.startOffset.y + now.y - current.start.y,
    });
  }

  function onPointerEnd(event: PointerEvent<SVGSVGElement>) {
    if (press.current?.pointerId !== event.pointerId) return;
    dragged.current = press.current.dragging;
    press.current = null;
    setDragging(false);
  }

  /** En nedtryckning som lämnar rutan innan den blivit en dragning är inget klick och ingen dragning. */
  function onPointerLeave(event: PointerEvent<SVGSVGElement>) {
    if (press.current?.pointerId === event.pointerId && !press.current.dragging) press.current = null;
  }

  /**
   * Klicket hanteras här i stället för på trianglarna: efter en dragning är det inget klick, och
   * annars låser det triangeln som trycktes ner. Det går aldrig vidare, eftersom trianglarna täcker
   * hela rutan och ett klick här därför aldrig är utanför Ackorden.
   */
  function onClickCapture(event: MouseEvent) {
    event.stopPropagation();
    const chord = pressedChord.current;
    pressedChord.current = null;
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    if (chord) onLock(chord);
  }

  const view = { offset, ...size, edge: EDGE };
  const ready = size.width > 0 && size.height > 0;
  const shownVertices = chordVertices(view, shown);

  return (
    <div ref={boxRef} className={styles.tonnetzBox}>
      {ready && (
        <svg
          className={`${styles.tonnetzSvg} ${dragging ? styles.dragging : ""}`}
          width={size.width}
          height={size.height}
          role="img"
          aria-label={label}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onLostPointerCapture={onPointerEnd}
          onPointerLeave={onPointerLeave}
          onClickCapture={onClickCapture}
        >
          {visibleTriangles(view).map((triangle) => {
            const { points, chord } = triangle;
            const { x, y } = triangleCenter(triangle);
            const classes = [chord.quality === "major" ? styles.major : styles.minor, sameChord(chord, shown) ? styles.shown : ""];
            return (
              <g
                key={`${chord.quality}${latticeKey(triangle.i, triangle.j)}`}
                {...{ [CHORD_ATTRIBUTE]: "" }}
                className={classes.join(" ")}
                onPointerEnter={() => !press.current?.dragging && onHover(chord)}
                onPointerLeave={() => onHover(null)}
                onPointerDown={() => (pressedChord.current = chord)}
              >
                <polygon className={styles.triangle} points={points.map((p) => `${p.x},${p.y}`).join(" ")} />
                <text className={styles.triangleLabel} x={x} y={y} textAnchor="middle" dominantBaseline="central">
                  {chordName(chord, noteNames)}
                </text>
              </g>
            );
          })}
          {visibleVertices(view).map((vertex) => (
            <g
              key={latticeKey(vertex.i, vertex.j)}
              className={`${styles.vertex} ${shownVertices.has(latticeKey(vertex.i, vertex.j)) ? styles.shown : ""}`}
            >
              <circle cx={vertex.x} cy={vertex.y} r={VERTEX_RADIUS} />
              <text x={vertex.x} y={vertex.y} textAnchor="middle" dominantBaseline="central">
                {noteNameOf(vertex.pitch, noteNames)}
              </text>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
