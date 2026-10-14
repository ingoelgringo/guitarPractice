"use client";

import type { Box } from "./ScoreView";
import styles from "./TabEditor.module.css";

/** Hur länge (ms) notisen syns om ingen tangent trycks. */
export const NOTICE_MS = 4000;

/**
 * Tunt skal: en kort notis under markörens ruta som säger varför ett kommando inte gick. Den
 * tar inte fokus, och editorn tar bort den efter `NOTICE_MS` eller vid nästa tangenttryck.
 */
export function CursorNotice({ text, cursorBox }: { text: string; cursorBox: Box }) {
  return (
    <p className={styles.cursorNotice} role="status" style={{ left: cursorBox.left, top: cursorBox.top + cursorBox.height + 4 }}>
      {text}
    </p>
  );
}
