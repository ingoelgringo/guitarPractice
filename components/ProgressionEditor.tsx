"use client";

import { type CSSProperties, type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { opensChordText } from "@/lib/chordText";
import type { Messages } from "@/lib/messages";
import type { NoteNameMode } from "@/lib/noteNameMode";
import {
  addSection,
  chordAt,
  degreeChord,
  type Key,
  type KeyMode,
  keyTonicName,
  MAX_BARS,
  MAX_TEMPO,
  MIN_TEMPO,
  move,
  type Placement,
  type Position,
  type Progression,
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
  SILENCE,
  tapTempo,
  TIME_SIGNATURES,
  type TimeSignature,
  withQuality,
} from "@/lib/progression";
import { type Instrument, INSTRUMENTS } from "@/lib/progressionPlayback";
import card from "./Card.module.css";
import { CardIcon } from "./CardIcon";
import { ChordEditor, type TextPicker } from "./ChordEditor";
import { EDITOR_ATTRIBUTE } from "./chordElement";
import styles from "./ProgressionEditor.module.css";
import { ProgressionFormRow } from "./ProgressionFormRow";
import type { ProgressionPlayback } from "./useProgressionPlayback";
import { useWheelNumber } from "./useWheelNumber";

interface Props {
  progression: Progression;
  /** Varje ändring går hit, och sidan lägger den i historiken. */
  onChange: (progression: Progression) => void;
  noteNames: NoteNameMode;
  messages: Messages;
}

interface EditorProps extends Props {
  /**
   * Det markerade Taktslaget, eller `null`. Sidan håller det, så att Tonnetzen och Kvintcirkeln kan
   * placera Ackord där, och ser till att det finns.
   */
  selection: Position | null;
  onSelect: (position: Position | null) => void;
  playback: ProgressionPlayback;
  /** Klasserna som placerar Ackordföljdens kort och Ackordeditorns kort på sidan. */
  className?: string;
  chordEditorClassName?: string;
}

const samePosition = (a: Position | null, b: Position) =>
  a !== null && a.section === b.section && a.bar === b.bar && a.pulse === b.pulse;

const positionKey = ({ section, bar, pulse }: Position) => `${section}:${bar}:${pulse}`;

/**
 * Den minsta bredden för en Takt: Taktslagens kort med mellanrum, i 6/8 och 12/8 mellanrummen
 * mellan grupperna, och Taktens egen kant. Takterna står fyra, två eller en per rad, så många som
 * får plats.
 */
const barMinWidth = (pulses: number) => `${pulses * 3.6 + (pulses > 4 ? (pulses / 3 - 1) * 0.5 : 0) + 1.25}em`;

/** Takterna två och två, så att raderna kan ha fyra, två eller en Takt. */
const barPairs = (bars: number) => Array.from({ length: Math.ceil(bars / 2) }, (_, i) => [2 * i, 2 * i + 1].filter((bar) => bar < bars));

/**
 * Editorn för en Ackordföljd, i två kort: Ackordföljden med Tonart, taktart och tempo och Delarnas
 * Takter med ett Taktslag per puls, och Ackordeditorn, där det markerade Taktslaget får Ackord.
 * Ackord kan också placeras med tangentbordet, och en tonbokstav öppnar ackordfältet i
 * Ackordeditorn. Båda korten är märkta som editorn, så att ett klick i dem inte släpper markeringen.
 */
export function ProgressionEditor({
  progression,
  onChange: change,
  selection,
  onSelect: setSelected,
  playback,
  noteNames,
  messages,
  className = "",
  chordEditorClassName,
}: EditorProps) {
  const [picker, setPicker] = useState<TextPicker | null>(null);
  const pulseRefs = useRef(new Map<string, HTMLButtonElement>());
  const { key, timeSignature } = progression;
  const pulses = pulsesPerBar(timeSignature);
  const name = (chord: Placement) => (chord === SILENCE ? messages.silence : progressionChordName(chord, key, noteNames));
  const label = (chord: Placement) => (chord === SILENCE ? messages.chordNone : name(chord));
  // Fältet hör till sitt Taktslag och försvinner när ett annat markeras.
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

  function placeFromPicker(chord: Placement) {
    if (selection) change(placeChord(progression, selection, chord));
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
      setPicker({ position: selection, initial: event.key.toUpperCase() });
    } else if (/^[1-7]$/.test(event.key) && !modified) {
      event.preventDefault();
      change(placeChord(progression, selection, degreeChord(key, Number(event.key))));
    } else if ((event.key === "+" || event.key === "-") && current && current !== SILENCE) {
      event.preventDefault();
      change(placeChord(progression, selection, withQuality(current, event.key === "+" ? "major" : "minor")));
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      change(removeChord(progression, selection));
    } else if (event.key === "Escape") {
      setSelected(null);
    }
  }

  return (
    <>
      <section
        className={`${card.card} ${styles.editor} ${className}`}
        aria-label={messages.progression}
        {...{ [EDITOR_ATTRIBUTE]: "" }}
      >
        <div className={card.header}>
          <h2 className={card.title}>
            <CardIcon name="progression" />
            {messages.progression}
          </h2>
          <div className={card.tools}>
            <Settings progression={progression} onChange={change} noteNames={noteNames} messages={messages} />
          </div>
        </div>
        <Playback playback={playback} sections={progression.sections} messages={messages} />
        <p className={styles.help}>{messages.progressionHelp}</p>
        <div onKeyDown={onKeyDown}>
          {progression.sections.map((section) => (
            <div key={section.id} className={styles.section}>
              <SectionHeader section={section} progression={progression} onChange={change} messages={messages} />
              <div
                className={styles.bars}
                style={{ "--bar-min": barMinWidth(pulses) } as CSSProperties}
                role="group"
                aria-label={`${section.name}: ${messages.bars}`}
              >
                {barPairs(section.bars).map((pair) => (
                  <div key={pair[0]} className={styles.barPair}>
                    {pair.map((bar) => (
                      <div key={bar} className={styles.bar}>
                        <span className={styles.barNumber} aria-hidden="true">
                          {bar + 1}
                        </span>
                        <div className={styles.pulses}>
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
                                aria-label={messages.pulseLabel(bar + 1, pulse + 1, chord && label(chord))}
                                onClick={() => setSelected(position)}
                                onFocus={() => setSelected(position)}
                              >
                                {chord ? name(chord) : ""}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className={styles.addSection}
          onClick={() => change(addSection(progression, messages.newSectionName))}
        >
          {messages.addSection}
        </button>
        <ProgressionFormRow progression={progression} onChange={change} messages={messages} />
      </section>
      <ChordEditor
        className={chordEditorClassName}
        selection={selection}
        progression={progression}
        onChange={change}
        picker={openPicker}
        onPlaceText={placeFromPicker}
        onCancel={closePicker}
        onDismiss={() => setPicker(null)}
        noteNames={noteNames}
        messages={messages}
      />
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
    <div className={`${styles.settings} ${styles.transport}`}>
      <button type="button" className={`${styles.play} ${active ? styles.stop : ""}`} onClick={active ? stop : play}>
        <svg className={styles.playIcon} viewBox="0 0 16 16" aria-hidden="true">
          {active ? <rect x="3" y="3" width="10" height="10" rx="1" /> : <path d="M4 2.5v11l9.5-5.5z" />}
        </svg>
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
      <label className={styles.toggle}>
        <input type="checkbox" checked={countIn} onChange={(event) => setCountIn(event.target.checked)} />
        {messages.countIn}
      </label>
      <fieldset className={styles.instruments}>
        <legend className={styles.visuallyHidden}>{messages.instruments}</legend>
        {INSTRUMENTS.map((instrument) => (
          <label key={instrument} className={styles.toggle}>
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

/** Tonart, taktart och tempo. */
function Settings({ progression, onChange, noteNames, messages }: Props) {
  const { key, tempo, timeSignature } = progression;
  const [tempoText, setTempoText] = useState<string | null>(null);
  const taps = useRef<number[]>([]);
  const tempoField = useRef<HTMLInputElement>(null);
  // Hjulet ändrar det sparade tempot direkt och släpper det man höll på att skriva.
  useWheelNumber(tempoField, (step) => {
    setTempoText(null);
    onChange(setTempo(progression, tempo + step));
  });

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
          ref={tempoField}
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
