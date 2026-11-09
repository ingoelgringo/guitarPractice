"use client";

import { type KeyboardEvent, useId, useState } from "react";
import { chordSuggestions, parseChordText } from "@/lib/chordText";
import type { Messages } from "@/lib/messages";
import type { NoteNameMode } from "@/lib/noteNameMode";
import {
  CHORD_TYPES,
  type ChordType,
  EXTENSIONS,
  type Key,
  progressionChordName,
  type ProgressionChord,
  spellInKey,
  toggleExtension,
} from "@/lib/progression";
import styles from "./ProgressionEditor.module.css";

interface PickerProps {
  keyOfProgression: Key;
  noteNames: NoteNameMode;
  messages: Messages;
  onPlace: (chord: ProgressionChord) => void;
  onCancel: () => void;
}

function typeLabel(type: ChordType, messages: Messages): string {
  switch (type) {
    case "major":
      return messages.keyMajor;
    case "minor":
      return messages.keyMinor;
    case "diminished":
      return messages.chordDiminished;
    case "augmented":
      return messages.chordAugmented;
    default:
      return type;
  }
}

/** Escape avbryter, och inga tangenter når editorn, så att de inte flyttar markeringen eller ändrar Ackordet. */
function isolateKeys(event: KeyboardEvent, onCancel: () => void) {
  event.stopPropagation();
  if (event.key === "Escape") {
    event.preventDefault();
    onCancel();
  }
}

/**
 * Panelen "Annat ackord…": grundton, ackordtyp, tillägg som kan kombineras och Bas. Ackordet
 * placeras först när man trycker Placera.
 */
export function ChordBuilder({ initial, keyOfProgression: key, noteNames, messages, onPlace, onCancel }: PickerProps & { initial: ProgressionChord }) {
  const [chord, setChord] = useState(initial);
  const spell = (pitch: number) => spellInKey(pitch, key, noteNames);
  const pitches = Array.from({ length: 12 }, (_, pitch) => pitch);

  // Basen följer med när grundtonen byts, om den var grundtonen.
  const setRoot = (root: number) => setChord((c) => ({ ...c, root, bass: c.bass === c.root ? root : c.bass }));

  return (
    <div
      className={styles.picker}
      role="group"
      aria-label={messages.chordBuilder}
      onKeyDown={(event) => isolateKeys(event, onCancel)}
    >
      <div className={styles.pickerRow}>
        <label className={styles.setting}>
          {messages.chordRoot}
          <select autoFocus value={chord.root} onChange={(event) => setRoot(Number(event.target.value))}>
            {pitches.map((pitch) => (
              <option key={pitch} value={pitch}>
                {spell(pitch)}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.setting}>
          {messages.chordType}
          <select value={chord.type} onChange={(event) => setChord((c) => ({ ...c, type: event.target.value as ChordType }))}>
            {CHORD_TYPES.map((type) => (
              <option key={type} value={type}>
                {typeLabel(type, messages)}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.setting}>
          {messages.chordBass}
          <select value={chord.bass} onChange={(event) => setChord((c) => ({ ...c, bass: Number(event.target.value) }))}>
            {pitches.map((pitch) => (
              <option key={pitch} value={pitch}>
                {spell(pitch)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className={styles.extensions}>
        <legend className={styles.extensionsLegend}>{messages.chordExtensions}</legend>
        {EXTENSIONS.map((extension) => {
          const on = chord.extensions.includes(extension);
          return (
            <button
              key={extension}
              type="button"
              className={`${styles.extension} ${on ? styles.extensionOn : ""}`}
              aria-pressed={on}
              onClick={() => setChord((c) => toggleExtension(c, extension))}
            >
              {extension}
            </button>
          );
        })}
      </fieldset>
      <div className={styles.pickerRow}>
        <output className={styles.preview} aria-live="polite">
          {progressionChordName(chord, key, noteNames)}
        </output>
        <button type="button" className={styles.chordChoice} onClick={() => onPlace(chord)}>
          {messages.placeChord}
        </button>
        <button type="button" className={styles.chordChoice} onClick={onCancel}>
          {messages.cancel}
        </button>
      </div>
    </div>
  );
}

/**
 * Fältet som öppnas med en tonbokstav: man skriver t.ex. `F#m7/C` och trycker Enter. Förslagen har
 * tonartens ackord först och väljs med upp- och nedpil eller med ett klick.
 */
export function ChordTextField({
  initial,
  keyOfProgression: key,
  noteNames,
  messages,
  onPlace,
  onCancel,
  onDismiss,
}: PickerProps & { initial: string; /** När fältet tappar fokus, utan att fokus flyttas tillbaka. */ onDismiss: () => void }) {
  const [text, setText] = useState(initial);
  const [active, setActive] = useState(-1);
  const [invalid, setInvalid] = useState(false);
  const listId = useId();
  const helpId = useId();
  const suggestions = chordSuggestions(text, key, noteNames);
  const name = (chord: ProgressionChord) => progressionChordName(chord, key, noteNames);

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    isolateKeys(event, onCancel);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (suggestions.length === 0) return;
      // Från fältet (−1) genom förslagen och tillbaka till fältet.
      const step = event.key === "ArrowDown" ? 1 : -1;
      const places = suggestions.length + 1;
      setActive((a) => ((a + 1 + step + places) % places) - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const chord = suggestions[active] ?? parseChordText(text, noteNames);
      if (chord) onPlace(chord);
      else setInvalid(true);
    }
  }

  return (
    <div className={styles.picker}>
      <label className={styles.setting}>
        {messages.chordText}
        <input
          className={styles.chordTextInput}
          autoFocus
          role="combobox"
          aria-expanded={suggestions.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 && suggestions[active] ? `${listId}-${active}` : undefined}
          aria-invalid={invalid}
          aria-describedby={helpId}
          autoComplete="off"
          spellCheck={false}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setActive(-1);
            setInvalid(false);
          }}
          onKeyDown={onKeyDown}
          onBlur={onDismiss}
        />
      </label>
      <span id={helpId} className={invalid ? styles.error : styles.help} role={invalid ? "alert" : undefined}>
        {invalid ? messages.chordTextInvalid : messages.chordTextHelp}
      </span>
      {suggestions.length > 0 && (
        <ul id={listId} className={styles.suggestions} role="listbox" aria-label={messages.chordSuggestions}>
          {suggestions.map((chord, index) => (
            <li
              key={name(chord)}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              className={`${styles.chordChoice} ${styles.suggestion} ${index === active ? styles.suggestionActive : ""}`}
              // Klicket ska inte ta fokus från fältet, då stängs det innan valet hinner göras.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onPlace(chord)}
            >
              {name(chord)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
