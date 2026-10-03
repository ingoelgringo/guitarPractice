"use client";

import { useRef } from "react";
import type { Side } from "@/lib/editor";
import { MAX_BEAT_TEXT_LENGTH, type BeatText } from "@/lib/score";
import type { Box } from "./ScoreView";
import styles from "./TabEditor.module.css";

const LABELS: Record<BeatText, string> = {
  chordName: "Chord name",
  annotation: "Annotation",
};

/**
 * Tunt skal: ett textfält för Ackordnamnet eller Anteckningen på slaget under markören.
 * Enter sparar och stänger, Esc stänger utan att spara, och Tab eller Shift+Tab sparar och går
 * vidare till nästa eller föregående slag. Att lämna fältet sparar också.
 */
export function BeatTextField({
  field,
  value,
  cursorBox,
  onCommit,
  onCancel,
}: {
  field: BeatText;
  value: string;
  /** Markörens ruta: Ackordnamnet skrivs ovanför den och Anteckningen under. */
  cursorBox: Box;
  /** Sparar texten och går vidare åt `move`, eller stänger fältet utan `move`. */
  onCommit: (text: string, move?: Side) => void;
  onCancel: () => void;
}) {
  // Fältet ska bara avslutas en gång, även om det tappar fokus när det tas bort
  const doneRef = useRef(false);

  function finish(action: () => void) {
    if (doneRef.current) return;
    doneRef.current = true;
    action();
  }

  return (
    <input
      className={styles.beatTextField}
      style={
        field === "chordName"
          ? { left: cursorBox.left, top: cursorBox.top, transform: "translateY(calc(-100% - 4px))" }
          : { left: cursorBox.left, top: cursorBox.top + cursorBox.height + 4 }
      }
      aria-label={LABELS[field]}
      placeholder={LABELS[field]}
      defaultValue={value}
      maxLength={MAX_BEAT_TEXT_LENGTH[field]}
      autoFocus
      onFocus={(e) => e.currentTarget.select()}
      // Ett klick i fältet ska inte flytta markören i notbilden under det
      onClick={(e) => e.stopPropagation()}
      onBlur={(e) => finish(() => onCommit(e.currentTarget.value))}
      onKeyDown={(e) => {
        const text = e.currentTarget.value;
        if (e.key === "Enter") finish(() => onCommit(text));
        else if (e.key === "Escape") finish(onCancel);
        else if (e.key === "Tab") finish(() => onCommit(text, e.shiftKey ? "left" : "right"));
        else return;
        e.preventDefault();
      }}
    />
  );
}
