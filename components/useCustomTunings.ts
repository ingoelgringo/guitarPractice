"use client";

import { useSyncExternalStore } from "react";
import { CUSTOM_TUNINGS_KEY, readCustomTunings, saveCustomTunings, type CustomTuning } from "@/lib/customTunings";
import { browserStorage } from "@/lib/draft";
import { notifyTunerSettings } from "./useTunerSettings";

// Som i useTunerSettings: samma sparade text ger samma lista, och en annan flik hörs via `storage`.
const listeners = new Set<() => void>();
const EMPTY: readonly CustomTuning[] = [];
let cachedRaw: string | null | undefined;
let cached: readonly CustomTuning[] = EMPTY;

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function read(): readonly CustomTuning[] {
  const storage = browserStorage();
  let raw: string | null;
  try {
    if (!storage) return cached;
    raw = storage.getItem(CUSTOM_TUNINGS_KEY);
  } catch {
    return cached;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = readCustomTunings(storage);
  }
  return cached;
}

/** De egna stämningarna och en funktion som sparar en ny lista. Servern renderar en tom lista. */
export function useCustomTunings(): [readonly CustomTuning[], (tunings: readonly CustomTuning[]) => void] {
  const tunings = useSyncExternalStore(subscribe, read, () => EMPTY);
  return [tunings, setCustomTunings];
}

function setCustomTunings(tunings: readonly CustomTuning[]) {
  const storage = browserStorage();
  saveCustomTunings(storage, tunings);
  // Utan fungerande lagring gäller listan ändå tills sidan laddas om.
  cached = tunings;
  try {
    cachedRaw = storage?.getItem(CUSTOM_TUNINGS_KEY);
  } catch {
    // `read` behåller `cached`
  }
  listeners.forEach((listener) => listener());
  notifyTunerSettings();
}
