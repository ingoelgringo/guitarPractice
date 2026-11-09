"use client";

import { useEffect, useState } from "react";
import type { Progression } from "@/lib/progression";
import { EMPTY_HISTORY, historyKey, record, redo, undo } from "@/lib/progressionHistory";

/**
 * Ångra och gör om för Ackordföljden. Ger den funktion som alla ändringar går genom, och lyssnar
 * på Ctrl+Z, Ctrl+Y och Ctrl+Shift+Z på hela sidan.
 */
export function useProgressionHistory(progression: Progression | null, onChange: (progression: Progression) => void) {
  // Historiken hör till den Ackordföljd den byggdes för. Byts Ackordföljden ut utifrån börjar den om.
  const [tracked, setTracked] = useState({ progression, history: EMPTY_HISTORY });
  const history = tracked.progression === progression ? tracked.history : EMPTY_HISTORY;

  /** Ändrar Ackordföljden och lägger ändringen i historiken. */
  function change(next: Progression) {
    if (progression) setTracked({ progression: next, history: record(history, progression, next) });
    onChange(next);
  }

  // Tangenterna gäller hela sidan, så att de fungerar även när fokus har försvunnit med ett
  // Taktslag eller en Del som ångrades bort. Lyssnaren fångar tangenten på vägen ner, innan Delarnas
  // rubriker och ackordväljaren stoppar den.
  useEffect(() => {
    if (!progression) return;
    const current = progression;
    function onWindowKeyDown(event: globalThis.KeyboardEvent) {
      const action = historyKey(event);
      if (!action) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      // Textfält har sin egen inmatning och sitt eget ångra
      if (target?.closest("input, textarea, [contenteditable]")) return;
      if (document.querySelector("dialog[open]")) return;
      event.preventDefault();
      const step = (action === "undo" ? undo : redo)(history, current);
      if (!step) return;
      setTracked(step);
      onChange(step.progression);
    }
    window.addEventListener("keydown", onWindowKeyDown, true);
    return () => window.removeEventListener("keydown", onWindowKeyDown, true);
  }, [history, progression, onChange]);

  return change;
}
