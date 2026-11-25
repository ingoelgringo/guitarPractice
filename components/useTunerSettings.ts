"use client";

import { useSyncExternalStore } from "react";
import { CUSTOM_TUNINGS_KEY } from "@/lib/customTunings";
import { browserStorage } from "@/lib/draft";
import {
  DEFAULT_TUNER_SETTINGS,
  readTunerSettings,
  saveTunerSettings,
  TUNER_SETTINGS_KEY,
  type TunerSettings,
} from "@/lib/tunerSettings";

// Inställningarna läses ur `localStorage`. Samma sparade text ger samma objekt, så att React inte
// renderar om i onödan. Ändras de i en annan flik får den här veta det via `storage`. De egna
// stämningarna ingår i den sparade texten, eftersom en borttagen egen stämning ändrar valet.
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cached: TunerSettings = DEFAULT_TUNER_SETTINGS;

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function read(): TunerSettings {
  const storage = browserStorage();
  let raw: string | null;
  try {
    if (!storage) return cached;
    raw = rawSettings(storage);
  } catch {
    return cached;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = readTunerSettings(storage);
  }
  return cached;
}

function rawSettings(storage: Pick<Storage, "getItem">): string {
  return JSON.stringify([storage.getItem(TUNER_SETTINGS_KEY), storage.getItem(CUSTOM_TUNINGS_KEY)]);
}

/** Stämmarens inställningar och en funktion som sparar nya. Servern renderar förvalen. */
export function useTunerSettings(): [TunerSettings, (settings: TunerSettings) => void] {
  const settings = useSyncExternalStore(subscribe, read, () => DEFAULT_TUNER_SETTINGS);
  return [settings, setTunerSettings];
}

function setTunerSettings(settings: TunerSettings) {
  saveTunerSettings(browserStorage(), settings);
  // Utan fungerande lagring gäller valet ändå tills sidan laddas om.
  cached = settings;
  try {
    const storage = browserStorage();
    cachedRaw = storage ? rawSettings(storage) : null;
  } catch {
    // `read` behåller `cached`
  }
  notifyTunerSettings();
}

/** Läser om inställningarna, t.ex. när de egna stämningarna har ändrats i den här fliken. */
export function notifyTunerSettings() {
  listeners.forEach((listener) => listener());
}
