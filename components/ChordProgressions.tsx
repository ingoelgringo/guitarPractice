"use client";

import { type MouseEvent, useState } from "react";
import { type Chord, chordName, clickedChord, progressionTriad, shownChord } from "@/lib/chordProgressions";
import { MESSAGES } from "@/lib/messages";
import type { NoteNameMode } from "@/lib/noteNameMode";
import { chordAt, placeChord, type Position, positionExists, triad } from "@/lib/progression";
import type { SiteLanguage } from "@/lib/siteLanguage";
import styles from "./ChordProgressions.module.css";
import { CHORD_ATTRIBUTE } from "./chordElement";
import { CircleOfFifths } from "./CircleOfFifths";
import { Tonnetz } from "./Tonnetz";
import { ProgressionEditor } from "./ProgressionEditor";
import { useNoteNameMode } from "./useNoteNameMode";
import { useProgressionDraft } from "./useProgressionDraft";
import { useProgressionHistory } from "./useProgressionHistory";
import { useProgressionPlayback } from "./useProgressionPlayback";

/** Märker editorn, så att ett klick i den inte släpper det markerade Taktslaget. */
const EDITOR_ATTRIBUTE = "data-progression-editor";

/**
 * Verktyget Ackordföljder. Markeringen har två nivåer: det låsta Ackordet och det hovrade. Fokus i
 * Kvintcirkeln räknas som hovring. Det som visas är det hovrade, annars det klingande Ackordets
 * treklang under uppspelning och sist det låsta. När ett Taktslag är markerat placerar ett klick på
 * ett Ackord i Tonnetzen eller Kvintcirkeln treklangen där i stället för att låsa den.
 */
export function ChordProgressions({ language }: { language: SiteLanguage }) {
  const messages = MESSAGES[language];
  const [noteNames, setNoteNames] = useNoteNameMode();
  const [progression, setProgression] = useProgressionDraft();
  const change = useProgressionHistory(progression, setProgression);
  const playback = useProgressionPlayback(progression);
  const [selected, setSelected] = useState<Position | null>(null);
  const [locked, setLocked] = useState<Chord | null>(null);
  const [hovered, setHovered] = useState<Chord | null>(null);
  const [focused, setFocused] = useState<Chord | null>(null);
  // En markering som inte längre finns, t.ex. efter att en Del har krympt, räknas som ingen.
  const selection = progression && selected && positionExists(progression, selected) ? selected : null;
  const soundingChord = progression && playback.sounding && chordAt(progression, playback.sounding);
  const sounding = soundingChord ? progressionTriad(soundingChord) : undefined;
  // Det klingande Ackordet läses inte upp, så att skärmläsaren inte pratar i takt med musiken.
  const announced = shownChord(locked, hovered ?? focused);
  const shown = shownChord(locked, hovered ?? focused, sounding);

  function lock(chord: Chord) {
    if (progression && selection) change(placeChord(progression, selection, triad(chord.root, chord.quality)));
    else setLocked((current) => clickedChord(current, chord));
  }

  /**
   * Ett klick utanför Ackorden (segmenten och trianglarna) och dropdownen släpper låsningen, och
   * utanför Ackorden och editorn släpper det markerade Taktslaget, så att nästa klick låser igen.
   */
  function releaseOutside(event: MouseEvent) {
    const target = event.target as Element;
    if (target.closest(`[${CHORD_ATTRIBUTE}]`)) return;
    if (!target.closest(`[${EDITOR_ATTRIBUTE}]`)) setSelected(null);
    if (!target.closest("label, select")) setLocked(null);
  }

  /** Esc i Kvintcirkeln släpper både låsningen och det markerade Taktslaget. */
  function release() {
    setLocked(null);
    setSelected(null);
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
            tonic={progression && { root: progression.key.tonic, quality: progression.key.mode }}
            locked={locked}
            shown={shown}
            focused={focused}
            label={messages.circleOfFifths}
            onHover={setHovered}
            onFocusChord={setFocused}
            onLock={lock}
            onRelease={release}
          />
          <p className={styles.help}>{messages.circleOfFifthsHelp}</p>
        </section>
      </div>
      {progression && (
        <div {...{ [EDITOR_ATTRIBUTE]: "" }}>
          <ProgressionEditor
            progression={progression}
            onChange={change}
            selection={selection}
            onSelect={setSelected}
            playback={playback}
            noteNames={noteNames}
            messages={messages}
          />
        </div>
      )}
      <p className={styles.visuallyHidden} aria-live="polite">
        {announced ? messages.highlightedChord(chordName(announced, noteNames)) : ""}
      </p>
    </main>
  );
}
