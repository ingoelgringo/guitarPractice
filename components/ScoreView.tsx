"use client";

import {
  AlphaTabApi,
  LayoutMode,
  NotationElement,
  Settings,
  StaveProfile,
  type model,
} from "@coderline/alphatab";
import { useEffect, useRef, useState } from "react";
import type { Cursor } from "@/lib/editor";
import type { Score } from "@/lib/score";
import { toAlphaTab } from "@/lib/toAlphaTab";
import type { InvalidBar } from "@/lib/validation";
import styles from "./TabEditor.module.css";

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface BarMark extends Box {
  problem: InvalidBar["problem"];
}

const PROBLEM_LABELS: Record<InvalidBar["problem"], string> = {
  tooShort: "Too few beats",
  tooLong: "Too many beats",
};

/**
 * Tunt skal kring alphaTab: renderar Partituret som A4-Sida, visar markören
 * och markerar Takter som valideringen har pekat ut.
 */
export function ScoreView({
  score,
  cursor,
  invalidBars,
}: {
  score: Score;
  cursor: Cursor;
  invalidBars: InvalidBar[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<AlphaTabApi | null>(null);
  const renderedRef = useRef<model.Score | null>(null);
  const cursorRef = useRef(cursor);
  const invalidBarsRef = useRef(invalidBars);
  const [cursorBox, setCursorBox] = useState<Box | null>(null);
  const [barMarks, setBarMarks] = useState<BarMark[]>([]);

  useEffect(() => {
    const settings = new Settings();
    settings.core.fontDirectory = "/alphatab/font/";
    settings.core.useWorkers = false;
    settings.core.engine = "svg";
    settings.display.layoutMode = LayoutMode.Page;
    settings.display.staveProfile = StaveProfile.ScoreTab;
    settings.player.enablePlayer = false;
    // Partiturmodellen har ingen dynamik än, så alphaTabs förvalda "f" ska inte synas
    settings.notation.elements.set(NotationElement.EffectDynamics, false);

    const api = new AlphaTabApi(containerRef.current!, settings);
    api.postRenderFinished.on(() => {
      setCursorBox(locateCursor(api, renderedRef.current, cursorRef.current));
      setBarMarks(locateBarMarks(api, invalidBarsRef.current));
    });
    apiRef.current = api;
    return () => {
      api.destroy();
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    // Valideringen härleds ur samma Partitur och ritas när renderingen är klar
    invalidBarsRef.current = invalidBars;
  }, [invalidBars]);

  useEffect(() => {
    const rendered = toAlphaTab(score);
    renderedRef.current = rendered;
    apiRef.current?.renderScore(rendered);
  }, [score]);

  useEffect(() => {
    cursorRef.current = cursor;
    const api = apiRef.current;
    if (api) setCursorBox(locateCursor(api, renderedRef.current, cursor));
  }, [cursor]);

  return (
    <div className={styles.page}>
      <div style={{ position: "relative" }}>
        <div ref={containerRef} />
        {barMarks.map(({ problem, ...box }, i) => (
          <div key={i} className={styles.invalidBar} style={box}>
            <span className={styles.invalidBarLabel}>{PROBLEM_LABELS[problem]}</span>
          </div>
        ))}
        {cursorBox && <div className={styles.cursor} style={cursorBox} />}
      </div>
    </div>
  );
}

/** Rutor över de felaktiga Takterna i det första Spåret, det enda som editorn skapar. */
function locateBarMarks(api: AlphaTabApi, invalidBars: InvalidBar[]): BarMark[] {
  const lookup = api.renderer.boundsLookup;
  if (!lookup) return [];
  return invalidBars.flatMap(({ track, bar, problem }) => {
    const bounds = track === 0 ? lookup.findMasterBarByIndex(bar) : null;
    if (!bounds) return [];
    const { x, y, w, h } = bounds.visualBounds;
    return [{ left: x, top: y, width: w, height: h, problem }];
  });
}

/** Räknar ut markörens ruta: slagets kolumn i tabben, på markörens sträng. */
function locateCursor(api: AlphaTabApi, rendered: model.Score | null, cursor: Cursor): Box | null {
  const lookup = api.renderer.boundsLookup;
  if (!lookup || !rendered) return null;
  const staff = rendered.tracks[cursor.track]?.staves[0];
  const beat = staff?.bars[cursor.bar]?.voices[0]?.beats[cursor.beat];
  if (!beat) return null;

  // Ett slag har en BeatBounds per stav-renderare; tabben ritas sist.
  const all = lookup.findBeats(beat);
  const tab = all?.[all.length - 1];
  if (!tab) return null;

  const bar = tab.barBounds.visualBounds;
  const stringCount = staff.tuning.length;
  const spacing = bar.h / (stringCount - 1);
  const size = Math.max(spacing, 12);
  return {
    left: tab.onNotesX - size / 2,
    top: bar.y + (cursor.string - 1) * spacing - size / 2,
    width: size,
    height: size,
  };
}
