"use client";

import type { Command } from "@/lib/editor";
import styles from "./TabEditor.module.css";

const ACTIONS: readonly { command: Extract<Command["type"], "insertBarBefore" | "insertBarAfter" | "deleteBar">; label: string }[] = [
  { command: "insertBarBefore", label: "Insert bar before" },
  { command: "insertBarAfter", label: "Insert bar after" },
  { command: "deleteBar", label: "Delete bar" },
];

/** Tunt skal: infogar och tar bort Takter vid markören med Editor-kommandon, så att det går att ångra. */
export function BarButtons({ dispatch }: { dispatch: (command: Command) => void }) {
  return (
    <div className={styles.buttonGroup} role="group" aria-label="Bar">
      {ACTIONS.map(({ command, label }) => (
        <button key={command} type="button" onClick={() => dispatch({ type: command })}>
          {label}
        </button>
      ))}
    </div>
  );
}
