"use client";

import { synth, type AlphaTabApi } from "@coderline/alphatab";
import { useEffect, useRef, useState } from "react";
import type { Cursor } from "@/lib/editor";
import { beatAt, noteAt } from "@/lib/toAlphaTab";
import styles from "./TabEditor.module.css";

/** Uppspelningstempot i procent av Partiturets tempo. */
const MIN_SPEED = 25;
const MAX_SPEED = 200;
const SPEED_STEP = 5;

/** Volymen för metronomen och intalningen när de är på (alphaTab tillåter 0–3). */
const CLICK_VOLUME = 1;

/** Inställningarna för uppspelningen som användaren väljer. */
export interface PlaybackOptions {
  /** Tempot i procent av Partiturets tempo. */
  speed: number;
  metronome: boolean;
  countIn: boolean;
  /** Om en ton hörs när den skrivs in. */
  soundOnInput: boolean;
}

export const DEFAULT_PLAYBACK_OPTIONS: PlaybackOptions = {
  speed: 100,
  metronome: false,
  countIn: false,
  soundOnInput: true,
};

/**
 * Tunt skal kring alphaTabs spelare: spela och pausa, tempo i procent, metronom och intalning.
 * Uppspelningen börjar vid Markören. En pausad uppspelning fortsätter där den var, så länge
 * Markören inte har flyttats sedan pausen.
 */
export function PlaybackControls({
  api,
  cursor,
  options,
  onOptionsChange,
}: {
  api: AlphaTabApi | null;
  cursor: Cursor;
  options: PlaybackOptions;
  onOptionsChange: (options: PlaybackOptions) => void;
}) {
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  // Markören när uppspelningen pausades, eller null när den ska börja om vid Markören
  const pausedAtRef = useRef<Cursor | null>(null);

  useEffect(() => {
    if (!api) return;
    // Spelaren blir redo när soundfonten har laddats och igen efter varje rendering
    const offReady = api.playerReady.on(() => setReady(api.isReadyForPlayback));
    const offState = api.playerStateChanged.on(({ state, stopped }) => {
      setPlaying(state === synth.PlayerState.Playing);
      if (stopped) pausedAtRef.current = null;
    });
    return () => {
      offReady();
      offState();
      setReady(false);
      setPlaying(false);
    };
  }, [api]);

  useEffect(() => {
    if (api) configurePlayer(api, options);
  }, [api, options]);

  function playPause() {
    if (!api) return;
    if (playing) {
      api.pause();
      pausedAtRef.current = cursor;
      return;
    }
    if (!pausedAtRef.current || !samePosition(pausedAtRef.current, cursor)) seekTo(api, cursor);
    pausedAtRef.current = null;
    api.play();
  }

  const updateOptions = (change: Partial<PlaybackOptions>) => onOptionsChange({ ...options, ...change });

  return (
    <div className={styles.playback} role="group" aria-label="Playback">
      <button
        type="button"
        className={styles.playButton}
        disabled={!ready}
        title={ready ? undefined : "Loading sounds…"}
        onClick={playPause}
      >
        {playing ? "Pause" : "Play"}
      </button>
      <label>
        <span>Tempo {options.speed}%</span>
        <input
          type="range"
          min={MIN_SPEED}
          max={MAX_SPEED}
          step={SPEED_STEP}
          value={options.speed}
          onChange={(e) => updateOptions({ speed: Number(e.target.value) })}
        />
      </label>
      <label>
        <input type="checkbox" checked={options.metronome} onChange={(e) => updateOptions({ metronome: e.target.checked })} />
        Metronome
      </label>
      <label>
        <input type="checkbox" checked={options.countIn} onChange={(e) => updateOptions({ countIn: e.target.checked })} />
        Count-in
      </label>
      <label>
        <input
          type="checkbox"
          checked={options.soundOnInput}
          onChange={(e) => updateOptions({ soundOnInput: e.target.checked })}
        />
        Sound on input
      </label>
    </div>
  );
}

/**
 * Spelar tonen vid Markören, t.ex. när den just har skrivits in. Under uppspelning hörs inget,
 * eftersom en enskild ton avbryter uppspelningen.
 */
export function playNoteAt(api: AlphaTabApi, cursor: Cursor): void {
  if (!api.score || api.playerState === synth.PlayerState.Playing) return;
  const note = noteAt(api.score, cursor);
  if (note) api.playNote(note);
}

// alphaTabs API styrs genom att sätta egenskaper. Det görs här, utanför komponenten.

function configurePlayer(api: AlphaTabApi, options: PlaybackOptions): void {
  api.playbackSpeed = options.speed / 100;
  api.metronomeVolume = options.metronome ? CLICK_VOLUME : 0;
  api.countInVolume = options.countIn ? CLICK_VOLUME : 0;
}

/** Flyttar uppspelningens position till slaget vid Markören. */
function seekTo(api: AlphaTabApi, cursor: Cursor): void {
  const beat = api.score && beatAt(api.score, cursor);
  if (beat) api.tickPosition = api.tickCache?.getBeatStart(beat) ?? 0;
}

function samePosition(a: Cursor, b: Cursor): boolean {
  return a.track === b.track && a.bar === b.bar && a.beat === b.beat;
}
