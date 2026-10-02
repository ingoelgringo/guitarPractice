"use client";

import { useEffect, useMemo, useReducer } from "react";
import { apply, createEditor } from "@/lib/editor";
import { keyToCommand, SHORTCUTS } from "@/lib/keyboard";
import { invalidBars } from "@/lib/validation";
import { ScoreView } from "./ScoreView";
import styles from "./TabEditor.module.css";

export function TabEditor() {
  const [state, dispatch] = useReducer(apply, undefined, createEditor);
  const barProblems = useMemo(() => invalidBars(state.score), [state.score]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable]")) return;
      const command = keyToCommand(event);
      if (!command) return;
      event.preventDefault();
      dispatch(command);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className={styles.editor}>
      <details className={styles.help}>
        <summary>Keyboard shortcuts</summary>
        <table>
          <tbody>
            {SHORTCUTS.map(({ keys, action }) => (
              <tr key={keys}>
                <td>
                  <kbd>{keys}</kbd>
                </td>
                <td>{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <ScoreView score={state.score} cursor={state.cursor} invalidBars={barProblems} />
    </div>
  );
}
