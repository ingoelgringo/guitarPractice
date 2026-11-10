"use client";

import { useEffect, useRef, useState } from "react";
import { browserStorage } from "@/lib/draft";
import type { Position, Progression } from "@/lib/progression";
import { countIn as countInBar, type Instrument, INSTRUMENTS, playbackPlan, pulseSeconds } from "@/lib/progressionPlayback";
import { type PlaybackSettings, readPlaybackSettings, savePlaybackSettings } from "@/lib/progressionPlaybackSettings";
import type { Playback, ProgressionAudio } from "./progressionAudio";

export type PlaybackState = "stopped" | "loading" | "playing" | "failed";

const playbackOf = (progression: Progression, loop: string | null): Playback => ({
  plan: playbackPlan(progression, { loop }),
  pulseSeconds: pulseSeconds(progression),
});

export type ProgressionPlayback = ReturnType<typeof useProgressionPlayback>;

/**
 * Uppspelningen av en Ackordföljd. Ljudlagret och Tone.js laddas vid första Play. Ändringar i
 * Ackordföljden, Delen som loopas och Instrument som bockas i eller ur gäller direkt, utan att
 * musiken börjar om. Innan Ackordföljden har laddats (`null`) går det inte att spela. Inräkningen
 * och Instrumenten sparas i webbläsaren.
 */
export function useProgressionPlayback(progression: Progression | null) {
  const [loop, setLoop] = useState<string | null>(null);
  const [state, setState] = useState<PlaybackState>("stopped");
  const [sounding, setSounding] = useState<Position | null>(null);
  // Servern renderar ingen editor, så att det sparade valet kan läsas direkt utan att sidan blinkar.
  const [settings, setSettings] = useState(() => readPlaybackSettings(browserStorage()));
  const { countIn, muted } = settings;
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
    if (state === "playing" && progression) player.current?.update(playbackOf(progression, loop));
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
    if (!latest.current.progression) return;
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
      if (!progression) return;
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

  function changeSettings(change: (current: PlaybackSettings) => PlaybackSettings) {
    const next = change(settings);
    setSettings(next);
    savePlaybackSettings(browserStorage(), next);
  }

  function setCountIn(value: boolean) {
    changeSettings((current) => ({ ...current, countIn: value }));
  }

  function setMuted(instrument: Instrument, value: boolean) {
    changeSettings((current) => ({ ...current, muted: { ...current.muted, [instrument]: value } }));
    player.current?.setMuted(instrument, value);
  }

  return { state, sounding, countIn, setCountIn, muted, setMuted, loop, setLoop, play, stop };
}
