"use client";

import { useEffect, useRef, useState } from "react";
import type { Position, Progression } from "@/lib/progression";
import { countIn as countInBar, type Instrument, INSTRUMENTS, playbackPlan, pulseSeconds } from "@/lib/progressionPlayback";
import type { Playback, ProgressionAudio } from "./progressionAudio";

export type PlaybackState = "stopped" | "loading" | "playing" | "failed";

/** Vilka Instrument som är urbockade. */
export type MutedInstruments = Record<Instrument, boolean>;

const NONE_MUTED = Object.fromEntries(INSTRUMENTS.map((instrument) => [instrument, false])) as MutedInstruments;

const playbackOf = (progression: Progression, loop: string | null): Playback => ({
  plan: playbackPlan(progression, { loop }),
  pulseSeconds: pulseSeconds(progression),
});

export type ProgressionPlayback = ReturnType<typeof useProgressionPlayback>;

/**
 * Uppspelningen av en Ackordföljd. Ljudlagret och Tone.js laddas vid första Play. Ändringar i
 * Ackordföljden, Delen som loopas och Instrument som bockas i eller ur gäller direkt, utan att
 * musiken börjar om.
 */
export function useProgressionPlayback(progression: Progression) {
  const [loop, setLoop] = useState<string | null>(null);
  const [state, setState] = useState<PlaybackState>("stopped");
  const [sounding, setSounding] = useState<Position | null>(null);
  const [countIn, setCountIn] = useState(true);
  const [muted, setMutedState] = useState(NONE_MUTED);
  const context = useRef<AudioContext | null>(null);
  const playerPromise = useRef<Promise<ProgressionAudio> | null>(null);
  const player = useRef<ProgressionAudio | null>(null);
  const latest = useRef({ progression, muted, loop });
  /** Räknas upp vid Stop och när editorn försvinner, så att en Play som laddar inte startar sent. */
  const generation = useRef(0);

  useEffect(() => {
    latest.current = { progression, muted, loop };
  });

  useEffect(() => {
    if (state === "playing") player.current?.update(playbackOf(progression, loop));
  }, [progression, loop, state]);

  // Musiken slutar och ljudlagret städas bort när editorn försvinner.
  useEffect(
    () => () => {
      generation.current++;
      void playerPromise.current?.then((audio) => audio.dispose()).catch(() => {});
      void context.current?.close();
    },
    [],
  );

  async function play() {
    const current = ++generation.current;
    setState("loading");
    // Ljudet måste startas i klickets händelse, före all väntan.
    context.current ??= new AudioContext();
    void context.current.resume();
    try {
      const audioContext = context.current;
      playerPromise.current ??= import("./progressionAudio").then((module) => module.createProgressionAudio(audioContext));
      const audio = await playerPromise.current;
      if (current !== generation.current) return;
      player.current = audio;
      const { progression, muted, loop } = latest.current;
      for (const instrument of INSTRUMENTS) audio.setMuted(instrument, muted[instrument]);
      audio.play(playbackOf(progression, loop), { countIn: countIn ? countInBar(progression.timeSignature) : null, onChord: setSounding });
      setState("playing");
    } catch (error) {
      console.error(error);
      playerPromise.current = null;
      if (current === generation.current) setState("failed");
    }
  }

  function stop() {
    generation.current++;
    player.current?.stop();
    setSounding(null);
    setState("stopped");
  }

  function setMuted(instrument: Instrument, value: boolean) {
    setMutedState((current) => ({ ...current, [instrument]: value }));
    player.current?.setMuted(instrument, value);
  }

  return { state, sounding, countIn, setCountIn, muted, setMuted, loop, setLoop, play, stop };
}
