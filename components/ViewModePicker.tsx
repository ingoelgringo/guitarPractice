"use client";

import type { Command } from "@/lib/editor";
import { VIEW_MODES, type ViewMode } from "@/lib/score";

const LABELS: Record<ViewMode, string> = {
  scoreAndTab: "Notation + tab",
  scoreOnly: "Notation only",
  rhythmTab: "Rhythm tab",
};

/**
 * Tunt skal: väljer Partiturets Vy-läge med ett Editor-kommando, så att bytet går att ångra.
 * Väljaren lämnar fokus efter valet, så att piltangenterna sedan styr editorn och inte byter läge.
 */
export function ViewModePicker({ viewMode, dispatch }: { viewMode: ViewMode; dispatch: (command: Command) => void }) {
  return (
    <label>
      <span>View</span>
      <select
        value={viewMode}
        onChange={(e) => {
          dispatch({ type: "setViewMode", viewMode: e.target.value as ViewMode });
          e.currentTarget.blur();
        }}
      >
        {VIEW_MODES.map((mode) => (
          <option key={mode} value={mode}>
            {LABELS[mode]}
          </option>
        ))}
      </select>
    </label>
  );
}
