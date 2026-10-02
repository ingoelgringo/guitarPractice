"use client";

import type { Command } from "@/lib/editor";
import { VIEW_MODES, type ViewMode } from "@/lib/score";
import styles from "./TabEditor.module.css";

const LABELS: Record<ViewMode, string> = {
  scoreAndTab: "Notation + tab",
  scoreOnly: "Notation only",
  rhythmTab: "Rhythm tab",
};

/**
 * Tunt skal: väljer Partiturets Vy-läge med ett Editor-kommando, så att bytet går att ångra.
 * Knappar i stället för radioknappar, så att tangentbordet fortsätter att styra editorn.
 */
export function ViewModePicker({ viewMode, dispatch }: { viewMode: ViewMode; dispatch: (command: Command) => void }) {
  return (
    <div className={styles.buttonGroup} role="group" aria-label="View mode">
      {VIEW_MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          aria-pressed={mode === viewMode}
          onClick={() => dispatch({ type: "setViewMode", viewMode: mode })}
        >
          {LABELS[mode]}
        </button>
      ))}
    </div>
  );
}
