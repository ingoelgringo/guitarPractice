"use client";

import { useEffect, useMemo, useReducer } from "react";
import { apply, createEditor } from "@/lib/editor";
import { keyToCommand, SHORTCUTS } from "@/lib/keyboard";
import { invalidBars } from "@/lib/validation";
import { ScoreSettings } from "./ScoreSettings";
import { ScoreView } from "./ScoreView";
import styles from "./TabEditor.module.css";
import { ViewModePicker } from "./ViewModePicker";

export function TabEditor() {
  const [state, dispatch] = useReducer(apply, undefined, createEditor);
  const barProblems = useMemo(() => invalidBars(state.score), [state.score]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target instanceof HTMLElement ? event.target : null;
      // Textfält har sin egen inmatning och sitt eget ångra
      if (target?.closest("input, textarea, [contenteditable]")) return;
      const command = keyToCommand(event);
      if (!command) return;
      // I en rullgardin styr tangenterna rullgardinen, men ångra och gör om gäller Partituret
      if (target?.closest("select") && command.type !== "undo" && command.type !== "redo") return;
      event.preventDefault();
      dispatch(command);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className={styles.editor}>
      <ScoreSettings score={state.score} trackIndex={state.cursor.track} dispatch={dispatch} />
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
      <ViewModePicker viewMode={state.score.viewMode} dispatch={dispatch} />
      <ScoreView score={state.score} cursor={state.cursor} invalidBars={barProblems} />
    </div>
  );
}
