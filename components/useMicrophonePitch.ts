"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { detectPitch } from "@/lib/pitch";

/** Mikrofonens läge i Stämmaren. */
export type MicrophoneStatus = "idle" | "starting" | "listening" | "denied" | "unavailable";

/** Fönstret som analyseras: tillräckligt långt för låg B på bas 5 (cirka 31 Hz). */
const WINDOW = 8192;

/**
 * Lyssnar på mikrofonen och anropar `onPitch` med frekvensen (eller `null`) och tiden för varje
 * bildruta. Mikrofonen startar bara med `start`, eftersom webbläsaren kräver en användargest, och
 * stängs av när fliken döljs.
 */
export function useMicrophonePitch(onPitch: (frequency: number | null, timeMs: number) => void) {
  const [status, setStatus] = useState<MicrophoneStatus>("idle");
  const onPitchRef = useRef(onPitch);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onPitchRef.current = onPitch;
  }, [onPitch]);

  // Räknas upp vid varje stopp, så att en start som fortfarande väntar på mikrofonen avbryts.
  const generationRef = useRef(0);

  const stop = useCallback(() => {
    generationRef.current++;
    stopRef.current?.();
    stopRef.current = null;
    setStatus((current) => (current === "listening" || current === "starting" ? "idle" : current));
  }, []);

  const start = useCallback(async () => {
    if (stopRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      return;
    }
    setStatus("starting");
    const generation = generationRef.current;
    let stream: MediaStream;
    try {
      // Utan webbläsarens ljudbehandling, som annars dämpar tonen man stämmer.
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (generation === generationRef.current) {
        setStatus(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable");
      }
      return;
    }
    if (generation !== generationRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = WINDOW;
    const source = context.createMediaStreamSource(stream);
    source.connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    let frame = 0;

    const tick = (timeMs: number) => {
      analyser.getFloatTimeDomainData(samples);
      const reading = detectPitch(samples, context.sampleRate);
      onPitchRef.current(reading?.frequency ?? null, timeMs);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    stopRef.current = () => {
      cancelAnimationFrame(frame);
      source.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      void context.close();
    };
    setStatus("listening");
  }, []);

  // Mikrofonen stängs av när fliken döljs och när man lämnar sidan.
  useEffect(() => {
    const generation = generationRef;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") stop();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      generation.current++;
      stopRef.current?.();
      stopRef.current = null;
    };
  }, [stop]);

  return { status, start, stop };
}
