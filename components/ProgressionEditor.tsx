"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import type { Messages } from "@/lib/messages";
import type { NoteNameMode } from "@/lib/noteNameMode";
import {
  chordAt,
  degreeChord,
  type Key,
  type KeyMode,
  keyChords,
  keyTonicName,
  MAX_TEMPO,
  MIN_TEMPO,
  move,
  type Position,
  type Progression,
  progressionChordName,
  pulsesPerBar,
  placeChord,
  recentTaps,
  removeChord,
  setKey,
  setTempo,
  setTimeSignature,
  tapTempo,
  TIME_SIGNATURES,
  type TimeSignature,
  withQuality,
} from "@/lib/progression";
import { type Instrument, INSTRUMENTS } from "@/lib/progressionPlayback";
import styles from "./ProgressionEditor.module.css";
import { useProgressionPlayback } from "./useProgressionPlayback";

interface Props {
  progression: Progression;
  onChange: (progression: Progression) => void;
  noteNames: NoteNameMode;
  messages: Messages;
}

const samePosition = (a: Position | null, b: Position) =>
  a !== null && a.section === b.section && a.bar === b.bar && a.pulse === b.pulse;

const positionKey = ({ section, bar, pulse }: Position) => `${section}:${bar}:${pulse}`;

/**
 * Editorn för en Ackordföljd: Tonart, taktart och tempo, och Delarnas Takter med ett Taktslag per
 * puls. Ett markerat Taktslag får Ackord från tonartens lista eller med tangentbordet.
 */
export function ProgressionEditor({ progression, onChange, noteNames, messages }: Props) {
  const [selected, setSelected] = useState<Position | null>(null);
  const playback = useProgressionPlayback(progression);
  const pulseRefs = useRef(new Map<string, HTMLButtonElement>());
  const { key, timeSignature } = progression;
  const pulses = pulsesPerBar(timeSignature);
  const name = (chord: Parameters<typeof progressionChordName>[0]) => progressionChordName(chord, key, noteNames);
  // En markering som inte längre finns, t.ex. efter att en Del har krympt, räknas som ingen.
  const selection = selected && positionExists(progression, selected) ? selected : null;

  // Tangentbordets markering följs av fokus, så att skärmläsare och Tab hittar rätt Taktslag.
  useEffect(() => {
    if (selection) pulseRefs.current.get(positionKey(selection))?.focus();
  }, [selection]);

  function onKeyDown(event: KeyboardEvent) {
    if (!selection) return;
    const next = move(progression, selection, event);
    if (next) {
      event.preventDefault();
      setSelected(next);
      return;
    }
    const current = chordAt(progression, selection);
    if (/^[1-7]$/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
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
      <Playback playback={playback} messages={messages} />
      <p className={styles.help}>{messages.progressionHelp}</p>
      <div onKeyDown={onKeyDown}>
        {progression.sections.map((section) => (
          <div key={section.id} className={styles.section}>
            <h3 className={styles.sectionName}>{section.name}</h3>
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
          </div>
        ))}
        {selection && (
          <div className={styles.chordList} role="group" aria-label={messages.keyChords}>
            <span className={styles.chordListLabel}>{messages.keyChords}</span>
            {keyChords(key).map(({ degree, chord }) => (
              <button
                key={degree}
                type="button"
                className={styles.chordChoice}
                onClick={() => onChange(placeChord(progression, selection, chord))}
              >
                <span className={styles.degree}>{degree}</span> {name(chord)}
              </button>
            ))}
            <button
              type="button"
              className={styles.chordChoice}
              disabled={!chordAt(progression, selection)}
              onClick={() => onChange(removeChord(progression, selection))}
            >
              {messages.removeChord}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/** Play och Stop, inräkningen och Instrumenten. */
function Playback({ playback, messages }: { playback: ReturnType<typeof useProgressionPlayback>; messages: Messages }) {
  const { state, countIn, setCountIn, muted, setMuted, play, stop } = playback;
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
