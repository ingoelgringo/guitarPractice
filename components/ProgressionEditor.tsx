"use client";

import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { opensChordText } from "@/lib/chordText";
import type { Messages } from "@/lib/messages";
import type { NoteNameMode } from "@/lib/noteNameMode";
import {
  addSection,
  chordAt,
  degreeChord,
  type Key,
  type KeyMode,
  keyChords,
  keyTonicName,
  MAX_BARS,
  MAX_TEMPO,
  MIN_TEMPO,
  move,
  type Position,
  type Progression,
  type ProgressionChord,
  progressionChordName,
  pulsesPerBar,
  placeChord,
  recentTaps,
  removeChord,
  removeSection,
  renameSection,
  type Section,
  sectionNameError,
  setKey,
  setSectionBars,
  setTempo,
  setTimeSignature,
  tapTempo,
  TIME_SIGNATURES,
  type TimeSignature,
  withQuality,
} from "@/lib/progression";
import { type Instrument, INSTRUMENTS } from "@/lib/progressionPlayback";
import { ChordBuilder, ChordTextField } from "./ChordPicker";
import styles from "./ProgressionEditor.module.css";
import { ProgressionFormRow } from "./ProgressionFormRow";
import { type ProgressionPlayback, useProgressionPlayback } from "./useProgressionPlayback";

interface Props {
  progression: Progression;
  onChange: (progression: Progression) => void;
  noteNames: NoteNameMode;
  messages: Messages;
}

const samePosition = (a: Position | null, b: Position) =>
  a !== null && a.section === b.section && a.bar === b.bar && a.pulse === b.pulse;

const positionKey = ({ section, bar, pulse }: Position) => `${section}:${bar}:${pulse}`;

/** Panelen "Annat ackord…" eller ackordfältet, öppen vid ett Taktslag. */
type Picker = { position: Position } & ({ kind: "builder" } | { kind: "text"; initial: string });

/**
 * Editorn för en Ackordföljd: Tonart, taktart och tempo, och Delarnas Takter med ett Taktslag per
 * puls. Ett markerat Taktslag får Ackord från tonartens lista eller med tangentbordet.
 */
export function ProgressionEditor({ progression, onChange, noteNames, messages }: Props) {
  const [selected, setSelected] = useState<Position | null>(null);
  const [picker, setPicker] = useState<Picker | null>(null);
  const playback = useProgressionPlayback(progression);
  const pulseRefs = useRef(new Map<string, HTMLButtonElement>());
  const { key, timeSignature } = progression;
  const pulses = pulsesPerBar(timeSignature);
  const name = (chord: Parameters<typeof progressionChordName>[0]) => progressionChordName(chord, key, noteNames);
  // En markering som inte längre finns, t.ex. efter att en Del har krympt, räknas som ingen.
  const selection = selected && positionExists(progression, selected) ? selected : null;

  // Panelen och fältet hör till sitt Taktslag och försvinner när ett annat markeras.
  const openPicker = picker && selection && samePosition(selection, picker.position) ? picker : null;

  const focusPulse = (position: Position) => pulseRefs.current.get(positionKey(position))?.focus();

  // Tangentbordets markering följs av fokus, så att skärmläsare och Tab hittar rätt Taktslag.
  useEffect(() => {
    if (selection) focusPulse(selection);
  }, [selection]);

  function closePicker() {
    setPicker(null);
    if (selection) focusPulse(selection);
  }

  function placeFromPicker(chord: ProgressionChord) {
    if (selection) onChange(placeChord(progression, selection, chord));
    closePicker();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!selection) return;
    const next = move(progression, selection, event);
    if (next) {
      event.preventDefault();
      setSelected(next);
      return;
    }
    const current = chordAt(progression, selection);
    const modified = event.ctrlKey || event.metaKey || event.altKey;
    if (opensChordText(event.key, noteNames) && !modified) {
      event.preventDefault();
      setPicker({ position: selection, kind: "text", initial: event.key.toUpperCase() });
    } else if (/^[1-7]$/.test(event.key) && !modified) {
      event.preventDefault();
      onChange(placeChord(progression, selection, degreeChord(key, Number(event.key))));
    } else if ((event.key === "+" || event.key === "-") && current) {
      event.preventDefault();
      onChange(placeChord(progression, selection, withQuality(current, event.key === "+" ? "major" : "minor")));
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      onChange(removeChord(progression, selection));
    } else if (event.key === "Escape") {
      setSelected(null);
    }
  }

  return (
    <section className={styles.editor} aria-label={messages.progression}>
      <h2 className={styles.heading}>{messages.progression}</h2>
      <Settings progression={progression} onChange={onChange} noteNames={noteNames} messages={messages} />
      <Playback playback={playback} sections={progression.sections} messages={messages} />
      <p className={styles.help}>{messages.progressionHelp}</p>
      <div onKeyDown={onKeyDown}>
        {progression.sections.map((section) => (
          <div key={section.id} className={styles.section}>
            <SectionHeader section={section} progression={progression} onChange={onChange} messages={messages} />
            <div className={styles.bars} role="group" aria-label={`${section.name}: ${messages.bars}`}>
              {Array.from({ length: section.bars }, (_, bar) => (
                <div key={bar} className={styles.bar}>
                  {Array.from({ length: pulses }, (_, pulse) => {
                    const position = { section: section.id, bar, pulse };
                    const chord = chordAt(progression, position);
                    const isSelected = samePosition(selection, position);
                    const isSounding = samePosition(playback.sounding, position);
                    const first = bar === 0 && pulse === 0 && section === progression.sections[0];
                    const groupStart = pulses > 4 && pulse > 0 && pulse % 3 === 0;
                    return (
                      <button
                        key={pulse}
                        type="button"
                        ref={(element) => {
                          const k = positionKey(position);
                          if (element) pulseRefs.current.set(k, element);
                          else pulseRefs.current.delete(k);
                        }}
                        className={[
                          styles.pulse,
                          isSelected ? styles.selected : "",
                          isSounding ? styles.sounding : "",
                          groupStart ? styles.groupStart : "",
                        ].join(" ")}
                        tabIndex={isSelected || (!selection && first) ? 0 : -1}
                        aria-pressed={isSelected}
                        aria-label={messages.pulseLabel(bar + 1, pulse + 1, chord && name(chord))}
                        onClick={() => setSelected(position)}
                        onFocus={() => setSelected(position)}
                      >
                        {chord ? name(chord) : ""}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            {selection?.section === section.id && (
              <ChordChoices
                selection={selection}
                progression={progression}
                onChange={onChange}
                picker={openPicker}
                onOpenBuilder={() => setPicker({ position: selection, kind: "builder" })}
                onPlace={placeFromPicker}
                onCancel={closePicker}
                onDismiss={() => setPicker(null)}
                noteNames={noteNames}
                messages={messages}
              />
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        className={styles.addSection}
        onClick={() => onChange(addSection(progression, messages.newSectionName))}
      >
        {messages.addSection}
      </button>
      <ProgressionFormRow progression={progression} onChange={onChange} messages={messages} />
    </section>
  );
}

/** Tonartens ackord vid den markerade Delen, "Annat ackord…" och panelen eller ackordfältet. */
function ChordChoices({
  selection,
  progression,
  onChange,
  picker,
  onOpenBuilder,
  onPlace,
  onCancel,
  onDismiss,
  noteNames,
  messages,
}: {
  selection: Position;
  progression: Progression;
  onChange: (progression: Progression) => void;
  picker: Picker | null;
  onOpenBuilder: () => void;
  onPlace: (chord: ProgressionChord) => void;
  onCancel: () => void;
  onDismiss: () => void;
  noteNames: NoteNameMode;
  messages: Messages;
}) {
  const { key } = progression;
  const current = chordAt(progression, selection);
  const pickerProps = { keyOfProgression: key, noteNames, messages, onPlace, onCancel };
  return (
    <>
      <div className={styles.chordList} role="group" aria-label={messages.keyChords}>
        <span className={styles.chordListLabel}>{messages.keyChords}</span>
        {keyChords(key).map(({ degree, chord }) => (
          <button
            key={degree}
            type="button"
            className={styles.chordChoice}
            onClick={() => onChange(placeChord(progression, selection, chord))}
          >
            <span className={styles.degree}>{degree}</span> {progressionChordName(chord, key, noteNames)}
          </button>
        ))}
        <button
          type="button"
          className={styles.chordChoice}
          aria-expanded={picker?.kind === "builder"}
          onClick={onOpenBuilder}
        >
          {messages.otherChord}
        </button>
        <button
          type="button"
          className={styles.chordChoice}
          disabled={!current}
          onClick={() => onChange(removeChord(progression, selection))}
        >
          {messages.removeChord}
        </button>
      </div>
      {picker?.kind === "builder" && (
        <ChordBuilder key={positionKey(selection)} initial={current ?? degreeChord(key, 1)} {...pickerProps} />
      )}
      {picker?.kind === "text" && (
        <ChordTextField key={positionKey(selection)} initial={picker.initial} onDismiss={onDismiss} {...pickerProps} />
      )}
    </>
  );
}

/** Delens namn och antal Takter, och en knapp som tar bort Delen. */
function SectionHeader({
  section,
  progression,
  onChange,
  messages,
}: {
  section: Section;
  progression: Progression;
  onChange: (progression: Progression) => void;
  messages: Messages;
}) {
  const [nameText, setNameText] = useState<string | null>(null);
  const [barsText, setBarsText] = useState<string | null>(null);
  const errorId = useId();
  const error = nameText === null ? null : sectionNameError(progression, section.id, nameText);

  const commitName = () => {
    if (nameText !== null) onChange(renameSection(progression, section.id, nameText));
    setNameText(null);
  };
  // Ett tomt fält ändrar inget, så att Ackorden inte försvinner när man suddar för att skriva om.
  const commitBars = () => {
    if (barsText !== null && barsText.trim() !== "") onChange(setSectionBars(progression, section.id, Number(barsText)));
    setBarsText(null);
  };
  const commitOnEnter = (event: KeyboardEvent, commit: () => void, revert: () => void) => {
    if (event.key === "Enter") commit();
    else if (event.key === "Escape") revert();
  };

  return (
    // Tangenterna i Delens rubrik ska inte flytta markeringen eller ändra Ackorden i Takterna.
    <div className={styles.sectionHeader} onKeyDown={(event) => event.stopPropagation()}>
      <input
        className={styles.sectionNameInput}
        aria-label={messages.sectionName}
        aria-invalid={error !== null}
        aria-describedby={error ? errorId : undefined}
        value={nameText ?? section.name}
        onChange={(event) => setNameText(event.target.value)}
        onBlur={commitName}
        onKeyDown={(event) => commitOnEnter(event, commitName, () => setNameText(null))}
      />
      <label className={styles.setting}>
        <input
          className={styles.barsInput}
          type="number"
          min={1}
          max={MAX_BARS}
          value={barsText ?? section.bars}
          onChange={(event) => setBarsText(event.target.value)}
          onBlur={commitBars}
          onKeyDown={(event) => commitOnEnter(event, commitBars, () => setBarsText(null))}
        />
        {messages.bars}
      </label>
      {progression.sections.length > 1 && (
        <button
          type="button"
          className={styles.removeSection}
          aria-label={messages.removeSection(section.name)}
          onClick={() => onChange(removeSection(progression, section.id))}
        >
          ×
        </button>
      )}
      {error && (
        <span id={errorId} className={styles.error} role="alert">
          {error === "empty" ? messages.sectionNameEmpty : messages.sectionNameTaken}
        </span>
      )}
    </div>
  );
}

/** Play och Stop, Delen som loopas, inräkningen och Instrumenten. */
function Playback({
  playback,
  sections,
  messages,
}: {
  playback: ProgressionPlayback;
  sections: readonly Section[];
  messages: Messages;
}) {
  const { state, countIn, setCountIn, muted, setMuted, loop, setLoop, play, stop } = playback;
  const looped = loop !== null && sections.some((s) => s.id === loop) ? loop : "";
  const active = state === "playing" || state === "loading";
  const names: Record<Instrument, string> = {
    drums: messages.drums,
    bass: messages.bass,
    piano: messages.electricPiano,
    pad: messages.synthPad,
  };
  return (
    <div className={styles.settings}>
      <button type="button" className={styles.play} onClick={active ? stop : play}>
        {active ? messages.stop : messages.play}
      </button>
      <label className={styles.setting}>
        {messages.loop}
        <select value={looped} onChange={(event) => setLoop(event.target.value || null)}>
          <option value="">{messages.wholeForm}</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.name}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.setting}>
        <input type="checkbox" checked={countIn} onChange={(event) => setCountIn(event.target.checked)} />
        {messages.countIn}
      </label>
      <fieldset className={styles.instruments}>
        <legend className={styles.visuallyHidden}>{messages.instruments}</legend>
        {INSTRUMENTS.map((instrument) => (
          <label key={instrument} className={styles.setting}>
            <input
              type="checkbox"
              checked={!muted[instrument]}
              onChange={(event) => setMuted(instrument, !event.target.checked)}
            />
            {names[instrument]}
          </label>
        ))}
      </fieldset>
      <span className={styles.help} role="status">
        {state === "loading" ? messages.loadingSounds : state === "failed" ? messages.soundFailed : ""}
      </span>
    </div>
  );
}

function positionExists(progression: Progression, position: Position): boolean {
  const section = progression.sections.find((s) => s.id === position.section);
  return !!section && position.bar < section.bars && position.pulse < pulsesPerBar(progression.timeSignature);
}

/** Tonart, taktart och tempo. */
function Settings({ progression, onChange, noteNames, messages }: Props) {
  const { key, tempo, timeSignature } = progression;
  const [tempoText, setTempoText] = useState<string | null>(null);
  const taps = useRef<number[]>([]);

  const changeKey = (next: Key) => onChange(setKey(progression, next));
  const commitTempo = () => {
    if (tempoText !== null) onChange(setTempo(progression, Number(tempoText)));
    setTempoText(null);
  };

  function tap() {
    taps.current = recentTaps(taps.current, performance.now());
    const bpm = tapTempo(taps.current);
    if (bpm !== null) onChange(setTempo(progression, bpm));
  }

  return (
    <div className={styles.settings}>
      <label className={styles.setting}>
        {messages.key}
        <select value={key.tonic} onChange={(event) => changeKey({ ...key, tonic: Number(event.target.value) })}>
          {Array.from({ length: 12 }, (_, tonic) => (
            <option key={tonic} value={tonic}>
              {keyTonicName({ tonic, mode: key.mode }, noteNames)}
            </option>
          ))}
        </select>
        <select
          aria-label={`${messages.key}: ${messages.keyMajor}/${messages.keyMinor}`}
          value={key.mode}
          onChange={(event) => changeKey({ ...key, mode: event.target.value as KeyMode })}
        >
          <option value="major">{messages.keyMajor}</option>
          <option value="minor">{messages.keyMinor}</option>
        </select>
      </label>
      <label className={styles.setting}>
        {messages.timeSignature}
        <select
          value={timeSignature}
          onChange={(event) => onChange(setTimeSignature(progression, event.target.value as TimeSignature))}
        >
          {TIME_SIGNATURES.map((signature) => (
            <option key={signature} value={signature}>
              {signature}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.setting}>
        {messages.tempo}
        <input
          className={styles.tempo}
          type="number"
          min={MIN_TEMPO}
          max={MAX_TEMPO}
          value={tempoText ?? tempo}
          onChange={(event) => setTempoText(event.target.value)}
          onBlur={commitTempo}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitTempo();
          }}
        />
        bpm
      </label>
      <button type="button" className={styles.tap} onClick={tap}>
        {messages.tapTempo}
      </button>
    </div>
  );
}
