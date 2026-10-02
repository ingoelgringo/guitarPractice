"use client";

import { useEffect, useReducer } from "react";
import { apply, createEditor } from "@/lib/editor";
import { keyToCommand } from "@/lib/keyboard";
import { ScoreView } from "./ScoreView";
import styles from "./TabEditor.module.css";

export function TabEditor() {
  const [state, dispatch] = useReducer(apply, undefined, createEditor);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable]")) return;
      const command = keyToCommand(event.key);
      if (!command) return;
      event.preventDefault();
      dispatch(command);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className={styles.editor}>
      <ScoreView score={state.score} cursor={state.cursor} />
    </div>
  );
}
