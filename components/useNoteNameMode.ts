"use client";

import { useSyncExternalStore } from "react";
import { browserStorage } from "@/lib/draft";
import { DEFAULT_NOTE_NAME_MODE, type NoteNameMode, readNoteNameMode, saveNoteNameMode } from "@/lib/noteNameMode";

// Notnamnsläget gäller hela sajten. Ändras det i en flik får de andra flikarna veta det via `storage`.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

const read = () => readNoteNameMode(browserStorage());

/** Notnamnsläget och en funktion som byter det. Servern renderar förvalet. */
export function useNoteNameMode(): [NoteNameMode, (mode: NoteNameMode) => void] {
  const mode = useSyncExternalStore(subscribe, read, () => DEFAULT_NOTE_NAME_MODE);
  return [mode, setNoteNameMode];
}

function setNoteNameMode(mode: NoteNameMode) {
  saveNoteNameMode(browserStorage(), mode);
  listeners.forEach((listener) => listener());
}
