"use client";

import { type MouseEvent, type PointerEvent, useLayoutEffect, useRef, useState } from "react";
import { chordName, isDrag, noteNameOf, type Point, triangleCenter, visibleTriangles, visibleVertices } from "@/lib/chordProgressions";
import type { NoteNameMode } from "@/lib/noteNameMode";
import styles from "./ChordProgressions.module.css";

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

/**
 * Tonnetzen som SVG: en oändlig yta av trianglar som dras med mus eller finger. Bara de synliga
 * trianglarna ritas, och de räknas fram ur förskjutningen. C-dur står mitt i rutan från början.
 */
export function Tonnetz({ noteNames, label }: { noteNames: NoteNameMode; label: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const press = useRef<Press | null>(null);
  /** Om den senaste nedtryckningen blev en dragning. Då är klicket som följer inget klick. */
  const dragged = useRef(false);
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

  /** En dragning ska inte räknas som ett klick, t.ex. utanför Ackorden så att låsningen släpps. */
  function onClickCapture(event: MouseEvent) {
    if (!dragged.current) return;
    dragged.current = false;
    event.stopPropagation();
  }

  const view = { offset, ...size, edge: EDGE };
  const ready = size.width > 0 && size.height > 0;

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
            return (
              <g key={`${chord.quality}${triangle.i},${triangle.j}`} className={chord.quality === "major" ? styles.major : styles.minor}>
                <polygon className={styles.triangle} points={points.map((p) => `${p.x},${p.y}`).join(" ")} />
                <text className={styles.triangleLabel} x={x} y={y} textAnchor="middle" dominantBaseline="central">
                  {chordName(chord, noteNames)}
                </text>
              </g>
            );
          })}
          {visibleVertices(view).map((vertex) => (
            <g key={`${vertex.i},${vertex.j}`} className={styles.vertex}>
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
