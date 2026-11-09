"use client";

import { useEffect, useRef, useState } from "react";
import { type Position, type Progression, pulsesPerBar } from "@/lib/progression";
import { countIn as countInHits, type Instrument, INSTRUMENTS, playbackPlan, pulseSeconds } from "@/lib/progressionPlayback";
import type { ProgressionAudio } from "./progressionAudio";

export type PlaybackState = "stopped" | "loading" | "playing" | "failed";

const NONE_MUTED = Object.fromEntries(INSTRUMENTS.map((instrument) => [instrument, false])) as Record<Instrument, boolean>;

/**
 * Uppspelningen av en Ackordföljd. Ljudlagret och Tone.js laddas vid första Play. Ändringar i
 * Ackordföljden och Instrument som bockas i eller ur gäller direkt, utan att musiken börjar om.
 */
export function useProgressionPlayback(progression: Progression) {
  const [state, setState] = useState<PlaybackState>("stopped");
  const [sounding, setSounding] = useState<Position | null>(null);
  const [countIn, setCountIn] = useState(true);
  const [muted, setMutedState] = useState(NONE_MUTED);
  const audio = useRef<Promise<ProgressionAudio> | null>(null);
  const ready = useRef<ProgressionAudio | null>(null);
  const latest = useRef(progression);
  const generation = useRef(0);

  useEffect(() => {
    latest.current = progression;
    if (state === "playing") ready.current?.update(playbackPlan(progression), pulseSeconds(progression));
  }, [progression, state]);

  // Musiken slutar när editorn försvinner.
  useEffect(() => () => ready.current?.stop(), []);

  async function play() {
    const current = ++generation.current;
    setState("loading");
    try {
      audio.current ??= import("./progressionAudio").then((module) => module.createProgressionAudio());
      const player = await audio.current;
      if (current !== generation.current) return;
      ready.current = player;
      for (const instrument of INSTRUMENTS) player.setMuted(instrument, muted[instrument]);
      const progression = latest.current;
      const { timeSignature } = progression;
      player.play(playbackPlan(progression), {
        pulseSeconds: pulseSeconds(progression),
        countIn: countIn ? { hits: countInHits(timeSignature), length: pulsesPerBar(timeSignature) } : null,
        onChord: setSounding,
      });
      setState("playing");
    } catch (error) {
      console.error(error);
      audio.current = null;
      if (current === generation.current) setState("failed");
    }
  }

  function stop() {
    generation.current++;
    ready.current?.stop();
    setSounding(null);
    setState("stopped");
  }

  function setMuted(instrument: Instrument, value: boolean) {
    setMutedState((current) => ({ ...current, [instrument]: value }));
    ready.current?.setMuted(instrument, value);
  }

  return { state, sounding, countIn, setCountIn, muted, setMuted, play, stop };
}
