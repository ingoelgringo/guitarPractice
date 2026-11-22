"use client";

import type { Messages } from "@/lib/messages";
import type { NoteNameMode } from "@/lib/noteNameMode";
import {
  chordAt,
  keyChords,
  type Placement,
  type Position,
  type Progression,
  progressionChordName,
  placeChord,
  removeChord,
  shownChordAt,
} from "@/lib/progression";
import card from "./Card.module.css";
import { CardIcon } from "./CardIcon";
import { EDITOR_ATTRIBUTE } from "./chordElement";
import { ChordBuilder, ChordTextField } from "./ChordPicker";
import styles from "./ProgressionEditor.module.css";

/** Ackordfältet, öppet vid ett Taktslag med texten man började skriva. */
export type TextPicker = { position: Position; initial: string };

/**
 * Ackordeditorn: ett eget kort med tonartens ackord, "Ta bort", ackordrutan och vid behov
 * ackordfältet, för det markerade Taktslaget. Kortet syns alltid och är inaktiverat när inget
 * Taktslag är markerat. Det är märkt som en del av editorn, så att ett klick i det inte släpper
 * markeringen.
 */
export function ChordEditor({
  className = "",
  selection,
  progression,
  onChange,
  picker,
  onPlaceText,
  onCancel,
  onDismiss,
  noteNames,
  messages,
}: {
  className?: string;
  selection: Position | null;
  progression: Progression;
  onChange: (progression: Progression) => void;
  /** Ackordfältet, om det är öppet vid det markerade Taktslaget. */
  picker: TextPicker | null;
  onPlaceText: (chord: Placement) => void;
  /** Esc: stänger ackordfältet och lämnar fokus på Taktslaget. */
  onCancel: () => void;
  /** När ackordfältet tappar fokus. */
  onDismiss: () => void;
  noteNames: NoteNameMode;
  messages: Messages;
}) {
  const { key } = progression;
  const current = selection && chordAt(progression, selection);
  const place = (chord: Placement) => selection && onChange(placeChord(progression, selection, chord));
  const pickerProps = { keyOfProgression: key, noteNames, messages, onCancel };
  return (
    <section
      className={`${card.card} ${styles.editor} ${className}`}
      aria-labelledby="chord-editor-heading"
      {...{ [EDITOR_ATTRIBUTE]: "" }}
    >
      <h2 id="chord-editor-heading" className={`${card.header} ${card.title}`}>
        <CardIcon name="editor" />
        {messages.chordEditor}
      </h2>
      {!selection && <p className={card.help}>{messages.chordEditorHint}</p>}
      <fieldset className={styles.chordEditorBody} disabled={!selection}>
        <div className={styles.chordList} role="group" aria-label={messages.keyChords}>
          <span className={styles.chordListLabel}>{messages.keyChords}</span>
          {keyChords(key).map(({ degree, chord }) => (
            <button key={degree} type="button" className={styles.chordChoice} onClick={() => place(chord)}>
              <span className={styles.degree}>{degree}</span> {progressionChordName(chord, key, noteNames)}
            </button>
          ))}
          <button
            type="button"
            className={styles.chordChoice}
            disabled={!current}
            onClick={() => selection && onChange(removeChord(progression, selection))}
          >
            {messages.removeChord}
          </button>
        </div>
        <ChordBuilder shown={selection && shownChordAt(progression, selection)} onPlace={place} {...pickerProps} />
        {selection && picker && (
          <ChordTextField
            key={`${selection.section}:${selection.bar}:${selection.pulse}`}
            initial={picker.initial}
            onDismiss={onDismiss}
            onPlace={onPlaceText}
            {...pickerProps}
          />
        )}
      </fieldset>
    </section>
  );
}
