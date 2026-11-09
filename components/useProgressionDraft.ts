"use client";

import { useSyncExternalStore } from "react";
import { browserStorage, type LibraryRef } from "@/lib/draft";
import { newProgression, type Progression } from "@/lib/progression";
import { loadProgressionDraft, type ProgressionDraft, saveProgressionDraft } from "@/lib/progressionDraft";

// Utkastet läses första gången det behövs i webbläsaren och sparas vid varje ändring. Servern
// renderar ingen Ackordföljd, så att sidan inte blinkar till med en tom.
let current: ProgressionDraft | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Utkastet just nu, även i en callback som kom efter flera ändringar. Bara i webbläsaren. */
export function currentProgressionDraft(): ProgressionDraft {
  return read();
}

function read(): ProgressionDraft {
  current ??= loadProgressionDraft(browserStorage()) ?? { progression: newProgression() };
  return current;
}

/** Ersätter hela Utkastet, t.ex. med en Ackordföljd som öppnas från Biblioteket. */
export function replaceProgressionDraft(draft: ProgressionDraft) {
  current = draft;
  saveProgressionDraft(browserStorage(), draft);
  listeners.forEach((listener) => listener());
}

/** Ändrar Ackordföljden i Utkastet. Vilken Ackordföljd i Biblioteket det är ändras inte. */
export function setDraftProgression(progression: Progression) {
  replaceProgressionDraft({ ...read(), progression });
}

/** Ändrar vilken Ackordföljd i Biblioteket Utkastet är, eller tar bort den ur Biblioteket. */
export function setDraftLibrary(library: LibraryRef | undefined) {
  const draft = read();
  const same =
    draft.library?.id === library?.id &&
    draft.library?.revision === library?.revision &&
    draft.library?.saved === library?.saved;
  if (!same) replaceProgressionDraft({ progression: draft.progression, ...(library && { library }) });
}

/** Utkastet, eller `null` på servern. */
export function useProgressionDraft(): ProgressionDraft | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
