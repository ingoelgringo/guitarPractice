"use client";

import { useSyncExternalStore } from "react";
import { browserStorage } from "@/lib/draft";
import { newProgression, type Progression } from "@/lib/progression";
import { loadProgressionDraft, saveProgressionDraft } from "@/lib/progressionDraft";

// Ackordföljden läses från Utkastet första gången den behövs i webbläsaren och sparas vid varje
// ändring. Servern renderar ingen Ackordföljd, så att sidan inte blinkar till med en tom.
let current: Progression | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function read(): Progression {
  current ??= loadProgressionDraft(browserStorage()) ?? newProgression();
  return current;
}

function write(progression: Progression) {
  current = progression;
  saveProgressionDraft(browserStorage(), progression);
  listeners.forEach((listener) => listener());
}

/** Ackordföljden i Utkastet och en funktion som ändrar den, eller `null` på servern. */
export function useProgressionDraft(): [Progression | null, (progression: Progression) => void] {
  const progression = useSyncExternalStore(subscribe, read, () => null);
  return [progression, write];
}
