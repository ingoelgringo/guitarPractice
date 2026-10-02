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
import styles from "./TabEditor.module.css";

interface CursorBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Tunt skal kring alphaTab: renderar Partituret som A4-Sida och visar markören. */
export function ScoreView({ score, cursor }: { score: Score; cursor: Cursor }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<AlphaTabApi | null>(null);
  const renderedRef = useRef<model.Score | null>(null);
  const cursorRef = useRef(cursor);
  const [cursorBox, setCursorBox] = useState<CursorBox | null>(null);

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
    api.postRenderFinished.on(() => setCursorBox(locateCursor(api, renderedRef.current, cursorRef.current)));
    apiRef.current = api;
    return () => {
      api.destroy();
      apiRef.current = null;
    };
  }, []);

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
        {cursorBox && <div className={styles.cursor} style={cursorBox} />}
      </div>
    </div>
  );
}

/** Räknar ut markörens ruta: slagets kolumn i tabben, på markörens sträng. */
function locateCursor(api: AlphaTabApi, rendered: model.Score | null, cursor: Cursor): CursorBox | null {
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
