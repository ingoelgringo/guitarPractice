"use client";

import { type MouseEvent, useState } from "react";
import { type Chord, chordName, clickedChord, shownChord } from "@/lib/chordProgressions";
import { MESSAGES } from "@/lib/messages";
import type { NoteNameMode } from "@/lib/noteNameMode";
import type { SiteLanguage } from "@/lib/siteLanguage";
import styles from "./ChordProgressions.module.css";
import { CHORD_ATTRIBUTE } from "./chordElement";
import { CircleOfFifths } from "./CircleOfFifths";
import { Tonnetz } from "./Tonnetz";
import { useNoteNameMode } from "./useNoteNameMode";

/**
 * Verktyget Ackordföljder. Markeringen har två nivåer: det låsta Ackordet och det hovrade. Fokus i
 * Kvintcirkeln räknas som hovring. Det som visas är det hovrade, annars det låsta.
 */
export function ChordProgressions({ language }: { language: SiteLanguage }) {
  const messages = MESSAGES[language];
  const [noteNames, setNoteNames] = useNoteNameMode();
  const [locked, setLocked] = useState<Chord | null>(null);
  const [hovered, setHovered] = useState<Chord | null>(null);
  const [focused, setFocused] = useState<Chord | null>(null);
  const shown = shownChord(locked, hovered ?? focused);

  const lock = (chord: Chord) => setLocked((current) => clickedChord(current, chord));

  /** Ett klick utanför Ackorden (segmenten och trianglarna) och dropdownen släpper låsningen. */
  function releaseOutside(event: MouseEvent) {
    const target = event.target as Element;
    if (!target.closest(`[${CHORD_ATTRIBUTE}], label, select`)) setLocked(null);
  }

  return (
    // Klicket fångas här bara för att släppa låsningen; tangentbordet släpper med Esc i Kvintcirkeln.
    <main className={styles.page} onClick={releaseOutside}>
      <div className={styles.header}>
        <h1>Chord Progressions</h1>
        <label className={styles.noteNames}>
          {messages.noteNames}{" "}
          <select value={noteNames} onChange={(event) => setNoteNames(event.target.value as NoteNameMode)}>
            <option value="english">{messages.noteNamesEnglish}</option>
            <option value="swedish">{messages.noteNamesSwedish}</option>
          </select>
        </label>
      </div>
      <p>{messages.chordProgressionsIntro}</p>
      <div className={styles.layout}>
        <section className={styles.tonnetz}>
          <Tonnetz noteNames={noteNames} shown={shown} label={messages.tonnetz} onHover={setHovered} onLock={lock} />
          <p className={styles.help}>{messages.tonnetzHelp}</p>
        </section>
        <section className={styles.circle}>
          <CircleOfFifths
            noteNames={noteNames}
            locked={locked}
            shown={shown}
            focused={focused}
            label={messages.circleOfFifths}
            onHover={setHovered}
            onFocusChord={setFocused}
            onLock={lock}
            onRelease={() => setLocked(null)}
          />
          <p className={styles.help}>{messages.circleOfFifthsHelp}</p>
        </section>
      </div>
      <p className={styles.visuallyHidden} aria-live="polite">
        {shown ? messages.highlightedChord(chordName(shown, noteNames)) : ""}
      </p>
    </main>
  );
}
