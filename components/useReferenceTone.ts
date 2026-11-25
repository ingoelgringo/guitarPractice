"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createReferenceTone,
  REFERENCE_RELEASE_SECONDS,
  REFERENCE_TONE_SECONDS,
  type ReferenceTone,
} from "./referenceTone";

/** Referenstonens läge i Stämmaren. */
export type ReferenceToneStatus = "idle" | "loading" | "playing" | "failed";

/**
 * Spelar Stämmarens referenston. `pauseAnalysis` får hur länge (ms) det kommer ljud ur högtalaren,
 * så att mikrofonanalysen kan pausas under tiden.
 */
export function useReferenceTone(pauseAnalysis: (ms: number) => void) {
  const [status, setStatus] = useState<ReferenceToneStatus>("idle");
  const pauseAnalysisRef = useRef(pauseAnalysis);
  // Räknas upp vid varje stopp och när sidan lämnas, så att en tryckning som väntar på Tone.js avbryts.
  const generationRef = useRef(0);
  const contextRef = useRef<AudioContext | null>(null);
  const toneRef = useRef<Promise<ReferenceTone> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pauseAnalysisRef.current = pauseAnalysis;
  }, [pauseAnalysis]);

  const clearTimer = () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const play = useCallback(async (frequency: number) => {
    // Skapas och startas i klickets händelse, annars släpper Safari på iOS inte fram något ljud.
    if (!contextRef.current) contextRef.current = new AudioContext();
    const context = contextRef.current;
    void context.resume();
    toneRef.current ??= createReferenceTone(context);
    const generation = ++generationRef.current;
    setStatus("loading");
    let tone: ReferenceTone;
    try {
      tone = await toneRef.current;
    } catch {
      if (generation !== generationRef.current) return;
      toneRef.current = null;
      setStatus("failed");
      return;
    }
    if (generation !== generationRef.current) return;
    pauseAnalysisRef.current((REFERENCE_TONE_SECONDS + REFERENCE_RELEASE_SECONDS) * 1000);
    tone.play(frequency);
    setStatus("playing");
    clearTimer();
    timerRef.current = setTimeout(() => setStatus("idle"), REFERENCE_TONE_SECONDS * 1000);
  }, []);

  const stop = useCallback(() => {
    generationRef.current++;
    clearTimer();
    setStatus("idle");
    const pending = toneRef.current;
    if (!pending) return;
    pauseAnalysisRef.current(REFERENCE_RELEASE_SECONDS * 1000);
    void pending.then((tone) => tone.stop()).catch(() => {});
  }, []);

  useEffect(
    () => () => {
      generationRef.current++;
      clearTimer();
      const pending = toneRef.current;
      const context = contextRef.current;
      toneRef.current = null;
      contextRef.current = null;
      void pending?.then((tone) => tone.dispose()).catch(() => {});
      void context?.close();
    },
    [],
  );

  return { status, play, stop };
}
