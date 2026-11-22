"use client";

import { type MouseEvent, useState } from "react";
import { type Chord, chordName, clickedChord, progressionTriad, shownChord } from "@/lib/chordProgressions";
import { MESSAGES } from "@/lib/messages";
import type { NoteNameMode } from "@/lib/noteNameMode";
import type { ProgressionListEntry } from "@/lib/progressionLibraryClient";
import { chordAt, placeChord, type Position, positionExists, SILENCE, triad } from "@/lib/progression";
import type { SiteLanguage } from "@/lib/siteLanguage";
import card from "./Card.module.css";
import { CardIcon } from "./CardIcon";
import styles from "./ChordProgressions.module.css";
import { CHORD_ATTRIBUTE, EDITOR_ATTRIBUTE } from "./chordElement";
import { CircleOfFifths } from "./CircleOfFifths";
import { Tonnetz } from "./Tonnetz";
import { ProgressionEditor } from "./ProgressionEditor";
import { ProgressionLibrary } from "./ProgressionLibrary";
import { useNoteNameMode } from "./useNoteNameMode";
import { setDraftProgression, useProgressionDraft } from "./useProgressionDraft";
import { useProgressionHistory } from "./useProgressionHistory";
import { useProgressionPlayback } from "./useProgressionPlayback";

/**
 * Verktyget Ackordföljder. Markeringen har två nivåer: det låsta Ackordet och det hovrade. Fokus i
 * Kvintcirkeln räknas som hovring. Det som visas är det hovrade, annars det klingande Ackordets
 * treklang under uppspelning och sist det låsta. När ett Taktslag är markerat placerar ett klick på
 * ett Ackord i Tonnetzen eller Kvintcirkeln treklangen där i stället för att låsa den. Ägaren har
 * sina Ackordföljder i Biblioteket bredvid Ackordeditorn; en Gäst har bara sitt Utkast, och då tar
 * Ackordeditorn hela den nedre raden.
 */
export function ChordProgressions({
  language,
  library,
}: {
  language: SiteLanguage;
  /** Listan med Ackordföljder i Biblioteket för Ägaren, eller null för en Gäst. */
  library: ProgressionListEntry[] | null;
}) {
  const messages = MESSAGES[language];
  const [noteNames, setNoteNames] = useNoteNameMode();
  const draft = useProgressionDraft();
  const progression = draft?.progression ?? null;
  const change = useProgressionHistory(progression, setDraftProgression);

  const playback = useProgressionPlayback(progression);
  const [selected, setSelected] = useState<Position | null>(null);
  const [locked, setLocked] = useState<Chord | null>(null);
  const [hovered, setHovered] = useState<Chord | null>(null);
  const [focused, setFocused] = useState<Chord | null>(null);
  // En markering som inte längre finns, t.ex. efter att en Del har krympt, räknas som ingen.
  const selection = progression && selected && positionExists(progression, selected) ? selected : null;
  const soundingChord = progression && playback.sounding && chordAt(progression, playback.sounding);
  const sounding = soundingChord && soundingChord !== SILENCE ? progressionTriad(soundingChord) : undefined;
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
        <div>
          <h1 className={styles.title}>Chord Progressions</h1>
          <p className={styles.intro}>{messages.chordProgressionsIntro}</p>
        </div>
        <label className={styles.noteNames}>
          <span className={styles.noteNamesLabel}>{messages.noteNames}</span>
          <select value={noteNames} onChange={(event) => setNoteNames(event.target.value as NoteNameMode)}>
            <option value="english">{messages.noteNamesEnglish}</option>
            <option value="swedish">{messages.noteNamesSwedish}</option>
          </select>
        </label>
      </div>
      <div className={styles.layout}>
        <section className={card.card} aria-labelledby="tonnetz-heading">
          <h2 id="tonnetz-heading" className={`${card.header} ${card.title}`}>
            <CardIcon name="tonnetz" />
            {messages.tonnetz}
          </h2>
          <Tonnetz noteNames={noteNames} shown={shown} label={messages.tonnetz} onHover={setHovered} onLock={lock} />
          <p className={card.help}>{messages.tonnetzHelp}</p>
        </section>
        <section className={card.card} aria-labelledby="circle-heading">
          <h2 id="circle-heading" className={`${card.header} ${card.title}`}>
            <CardIcon name="circle" />
            {messages.circleOfFifths}
          </h2>
          <div className={styles.circleBox}>
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
          </div>
          <p className={card.help}>{messages.circleOfFifthsHelp}</p>
        </section>
        {progression && (
          <ProgressionEditor
            className={styles.wide}
            chordEditorClassName={library === null ? styles.wide : undefined}
            progression={progression}
            onChange={change}
            selection={selection}
            onSelect={setSelected}
            playback={playback}
            noteNames={noteNames}
            messages={messages}
          />
        )}
        {draft && <ProgressionLibrary draft={draft} library={library} messages={messages} />}
      </div>
      <p className={styles.visuallyHidden} aria-live="polite">
        {announced ? messages.highlightedChord(chordName(announced, noteNames)) : ""}
      </p>
    </main>
  );
}
