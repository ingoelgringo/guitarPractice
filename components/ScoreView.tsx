"use client";

import {
  AlphaTabApi,
  LayoutMode,
  NotationElement,
  PlayerMode,
  Settings,
  type model,
} from "@coderline/alphatab";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { selectionRange, type Cursor, type Selection } from "@/lib/editor";
import type { Score } from "@/lib/score";
import { beatAt, configureStaves, toAlphaTab } from "@/lib/toAlphaTab";
import type { InvalidBar } from "@/lib/validation";
import styles from "./TabEditor.module.css";

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface CursorMark extends Box {
  /** Strängen, utskriven när det inte finns någon tabulatur att visa den i. */
  string?: number;
}

interface BarMark extends Box {
  problem: InvalidBar["problem"];
}

/** Markörens minsta storlek (px) på en sträng i tabben. */
const MIN_CURSOR_SIZE = 12;

/** Markörens bredd (px) som kolumn i notsystemet, när tabben saknas. */
const COLUMN_CURSOR_WIDTH = 16;

const PROBLEM_LABELS: Record<InvalidBar["problem"], string> = {
  tooShort: "Too few beats",
  tooLong: "Too many beats",
};

/** Soundfonten för uppspelningen, kopierad till public/ av scripts/copy-alphatab-assets.mjs. */
const SOUND_FONT = "/alphatab/soundfont/sonivox.sf2";

/**
 * alphaTabs eget skript, kopierat till public/. Spelaren startar synthen i en worker och
 * ljudet i en AudioWorklet från det skriptet, och alphaTab hittar det inte självt i bundlen.
 */
const SCRIPT_FILE = "/alphatab/alphaTab.js";

/** Utrymmet (px) överst i editorn som den fästa uppspelningsraden (`.playback`) täcker. */
const PLAYBACK_BAR_SPACE = 64;

/**
 * Tunt skal kring alphaTab: renderar Partituret som A4-Sida, visar markören och markeringen
 * och markerar Takter som valideringen har pekat ut. Ett klick i notbilden blir en position för
 * markören via `onPositionClick`. Uppspelningen styrs via alphaTab-API:t, som lämnas ut med
 * `onApiChange`.
 */
export function ScoreView({
  score,
  cursor,
  selection,
  invalidBars,
  onApiChange,
  onPositionClick,
}: {
  score: Score;
  cursor: Cursor;
  selection: Selection | null;
  invalidBars: InvalidBar[];
  onApiChange: (api: AlphaTabApi | null) => void;
  onPositionClick: (position: Cursor) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<AlphaTabApi | null>(null);
  const renderedRef = useRef<model.Score | null>(null);
  const cursorRef = useRef(cursor);
  const invalidBarsRef = useRef(invalidBars);
  const selectionRef = useRef(selection);
  const [cursorBox, setCursorBox] = useState<CursorMark | null>(null);
  const [selectionBoxes, setSelectionBoxes] = useState<Box[]>([]);
  const [barMarks, setBarMarks] = useState<BarMark[]>([]);

  useEffect(() => {
    const settings = new Settings();
    settings.core.fontDirectory = "/alphatab/font/";
    settings.core.useWorkers = false;
    settings.core.engine = "svg";
    settings.display.layoutMode = LayoutMode.Page;
    configureStaves(settings);
    settings.core.scriptFile = new URL(SCRIPT_FILE, location.href).href;
    settings.player.playerMode = PlayerMode.EnabledSynthesizer;
    settings.player.soundFont = SOUND_FONT;
    // Editorn är sin egen scrollyta, så det är den som ska rulla med uppspelningen
    settings.player.scrollElement = containerRef.current!.closest<HTMLElement>(`.${styles.editor}`) ?? "html,body";
    // Lämna plats för uppspelningsraden, som ligger fäst överst när editorn rullar
    settings.player.scrollOffsetY = -PLAYBACK_BAR_SPACE;
    // Uppspelningen börjar vid Markören, så ett klick i notvyn ska inte flytta den
    settings.player.enableUserInteraction = false;
    // Partiturmodellen har ingen dynamik än, så alphaTabs förvalda "f" ska inte synas
    settings.notation.elements.set(NotationElement.EffectDynamics, false);

    const api = new AlphaTabApi(containerRef.current!, settings);
    api.postRenderFinished.on(() => {
      setCursorBox(locateCursor(api, renderedRef.current, cursorRef.current));
      setBarMarks(locateBarMarks(api, invalidBarsRef.current));
      setSelectionBoxes(locateSelection(api, renderedRef.current, cursorRef.current.track, selectionRef.current));
    });
    apiRef.current = api;
    onApiChange(api);
    return () => {
      onApiChange(null);
      api.destroy();
      apiRef.current = null;
    };
  }, [onApiChange]);

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

  useEffect(() => {
    selectionRef.current = selection;
    const api = apiRef.current;
    if (api) setSelectionBoxes(locateSelection(api, renderedRef.current, cursorRef.current.track, selection));
  }, [selection]);

  function onClick(event: MouseEvent<HTMLDivElement>) {
    const api = apiRef.current;
    if (!api) return;
    const origin = event.currentTarget.getBoundingClientRect();
    const position = locateClick(api, event.clientX - origin.left, event.clientY - origin.top, cursorRef.current);
    if (position) onPositionClick(position);
  }

  return (
    <div className={styles.page}>
      <div style={{ position: "relative" }} onClick={onClick}>
        <div ref={containerRef} />
        {selectionBoxes.map((box, i) => (
          <div key={i} className={styles.selection} style={box} />
        ))}
        {barMarks.map(({ problem, ...box }, i) => (
          <div key={i} className={styles.invalidBar} style={box}>
            <span className={styles.invalidBarLabel}>{PROBLEM_LABELS[problem]}</span>
          </div>
        ))}
        {cursorBox && (
          <div className={styles.cursor} style={boxStyle(cursorBox)}>
            {cursorBox.string !== undefined && <span className={styles.cursorString}>String {cursorBox.string}</span>}
          </div>
        )}
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

/** En ruta per Takt över de markerade slagen i Spår `track`, över alla stavar. */
function locateSelection(
  api: AlphaTabApi,
  rendered: model.Score | null,
  track: number,
  selection: Selection | null,
): Box[] {
  const lookup = api.renderer.boundsLookup;
  if (!lookup || !rendered || !selection) return [];
  const { start, end } = selectionRange(selection);
  const boxes: Box[] = [];
  for (let bar = start.bar; bar <= end.bar; bar++) {
    const beats = beatAt(rendered, { track, bar, beat: 0, string: 1 })?.voice.beats ?? [];
    const first = beats[bar === start.bar ? start.beat : 0];
    const last = beats[bar === end.bar ? end.beat : beats.length - 1];
    const from = first && lookup.findBeats(first)?.at(-1);
    const to = last && lookup.findBeats(last)?.at(-1);
    if (!from || !to) continue;
    const { y, h } = from.barBounds.masterBarBounds.visualBounds;
    const left = from.realBounds.x;
    boxes.push({ left, top: y, width: to.realBounds.x + to.realBounds.w - left, height: h });
  }
  return boxes;
}

/**
 * Markörens position vid ett klick på (x, y) i notbilden: slaget där, och strängen när klicket
 * träffar tabben. Annars behålls markörens sträng.
 */
function locateClick(api: AlphaTabApi, x: number, y: number, cursor: Cursor): Cursor | null {
  const lookup = api.renderer.boundsLookup;
  const beat = lookup?.getBeatAtPos(x, y);
  if (!lookup || !beat) return null;
  const bar = beat.voice.bar;
  const position = { track: bar.staff.track.index, bar: bar.index, beat: beat.index, string: cursor.string };
  const tab = lookup.findBeats(beat)?.at(-1)?.barBounds.visualBounds;
  if (!bar.staff.showTablature || !tab) return position;
  const stringCount = bar.staff.tuning.length;
  const spacing = tab.h / (stringCount - 1);
  const string = Math.round((y - tab.y) / spacing) + 1;
  // Ett klick strax utanför den yttersta strängen räknas till den, längre bort behålls strängen
  if (string < 0 || string > stringCount + 1) return position;
  return { ...position, string: Math.min(Math.max(string, 1), stringCount) };
}

/** Bara rutans mått, så att övriga fält inte hamnar i `style`. */
function boxStyle({ left, top, width, height }: Box) {
  return { left, top, width, height };
}

/**
 * Räknar ut markörens ruta: slagets kolumn i tabben, på markörens sträng. Utan tabulatur
 * (Bara noter) täcker rutan slagets kolumn i notsystemet och skriver ut strängen.
 */
function locateCursor(api: AlphaTabApi, rendered: model.Score | null, cursor: Cursor): CursorMark | null {
  const lookup = api.renderer.boundsLookup;
  if (!lookup || !rendered) return null;
  const beat = beatAt(rendered, cursor);
  if (!beat) return null;
  const staff = beat.voice.bar.staff;

  // Ett slag har en BeatBounds per stav-renderare. Den sista hör till tabben när den ritas,
  // annars till notsystemet.
  const all = lookup.findBeats(beat);
  const beatBounds = all?.[all.length - 1];
  if (!beatBounds) return null;

  if (!staff.showTablature) {
    const { y, h } = beatBounds.barBounds.visualBounds;
    return {
      left: beatBounds.onNotesX - COLUMN_CURSOR_WIDTH / 2,
      top: y,
      width: COLUMN_CURSOR_WIDTH,
      height: h,
      string: cursor.string,
    };
  }

  const bar = beatBounds.barBounds.visualBounds;
  const stringCount = staff.tuning.length;
  const spacing = bar.h / (stringCount - 1);
  const size = Math.max(spacing, MIN_CURSOR_SIZE);
  return {
    left: beatBounds.onNotesX - size / 2,
    top: bar.y + (cursor.string - 1) * spacing - size / 2,
    width: size,
    height: size,
  };
}
