"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteCustomTuning,
  MAX_TUNING_NAME_LENGTH,
  pitchRange,
  putCustomTuning,
  stepString,
  tuningsFor,
  type CustomTuningError,
  type TunerTuning,
} from "@/lib/customTunings";
import { MESSAGES, type Messages } from "@/lib/messages";
import type { NoteNameMode } from "@/lib/noteNameMode";
import type { SiteLanguage } from "@/lib/siteLanguage";
import {
  initialTunerState,
  tunerNoteName,
  tunerStep,
  tunerStrings,
  type TunerState,
  type TunerString,
} from "@/lib/tuner";
import { MAX_A4, MIN_A4, type TunerDisplay, type TunerSettings } from "@/lib/tunerSettings";
import {
  displayCourses,
  STRING_INSTRUMENTS,
  stringInstrument,
  type StringInstrument,
  type StringInstrumentId,
} from "@/lib/tuning";
import card from "./Card.module.css";
import styles from "./Tuner.module.css";
import { useCustomTunings } from "./useCustomTunings";
import { useMicrophonePitch } from "./useMicrophonePitch";
import { useNoteNameMode } from "./useNoteNameMode";
import { useTunerSettings } from "./useTunerSettings";

/** Visarens omfång åt varje håll, i cent. */
const METER_RANGE = 50;
/** Inom så här många cent är visaren grön. Samma tolerans som bocken i lib/tuner.ts. */
const IN_TUNE = 3;

/**
 * Stämmaren. Öppen för alla. Inställningarna sparas i webbläsaren, och mikrofonen startar bara
 * med Starta-knappen.
 */
export function Tuner({ language }: { language: SiteLanguage }) {
  const messages = MESSAGES[language];
  const [noteNames, setNoteNames] = useNoteNameMode();
  const [settings, update] = useTunerSettings();
  const [lockedString, setLockedString] = useState<number | null>(null);
  const [tuner, setTuner] = useState<TunerState>(initialTunerState);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [customs, setCustoms] = useCustomTunings();
  const [editing, setEditing] = useState<TuningDraft | null>(null);

  const instrument = stringInstrument(settings.instrument);
  const tunings = useMemo(() => tuningsFor(instrument.id, customs), [instrument, customs]);
  const tuning = tunings.find((t) => t.name === settings.tuning) ?? tunings[0];
  const strings = useMemo(() => tunerStrings(instrument, tuning.tuning), [instrument, tuning]);

  const configRef = useRef({ strings: strings.map((s) => s.pitch), a4: settings.a4, lockedString });
  useEffect(() => {
    configRef.current = { strings: strings.map((s) => s.pitch), a4: settings.a4, lockedString };
  }, [strings, settings.a4, lockedString]);

  const onPitch = useCallback((next: number | null, timeMs: number) => {
    setTuner((state) => tunerStep(state, { frequency: next, timeMs }, configRef.current));
    setFrequency(next);
  }, []);
  const microphone = useMicrophonePitch(onPitch);

  /** Ny Stämning eller nytt Stränginstrument: bockarna och den låsta strängen nollställs. */
  function changeTuning(next: TunerSettings) {
    update(next);
    setLockedString(null);
    setTuner(initialTunerState());
  }

  /** Sparar den nya eller ändrade egna stämningen och väljer den. */
  function saveDraft(draft: TuningDraft): CustomTuningError | null {
    const result = putCustomTuning(
      customs,
      { instrument: instrument.id, name: draft.name, tuning: draft.tuning },
      draft.previousName,
    );
    if ("error" in result) return result.error;
    setCustoms(result.tunings);
    changeTuning({ ...settings, tuning: draft.name.trim() });
    setEditing(null);
    return null;
  }

  function deleteSelected() {
    if (!confirm(messages.tunerConfirmDelete(tuning.name))) return;
    setCustoms(deleteCustomTuning(customs, instrument.id, tuning.name));
    changeTuning({ ...settings, tuning: instrument.tunings[0].name });
    setEditing(null);
  }

  const target = tuner.target;
  const shownString = target?.kind === "string" ? strings[target.string - 1] : undefined;
  const note = target
    ? tunerNoteName(target.kind === "string" ? (shownString?.pitch ?? 0) : target.midi, noteNames)
    : "–";
  const cents = target?.cents ?? null;
  const inTune = target?.kind === "string" && cents !== null && Math.abs(cents) <= IN_TUNE;
  const sounding = frequency !== null;

  const statusText = {
    idle: messages.tunerIdle,
    starting: messages.tunerStarting,
    listening: messages.tunerListening,
    denied: messages.tunerDenied,
    unavailable: messages.tunerUnavailable,
  }[microphone.status];
  const listening = microphone.status === "listening" || microphone.status === "starting";

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tuner</h1>
          <p className={styles.intro}>{messages.tunerIntro}</p>
        </div>
        <label className={styles.pill}>
          <span className={styles.pillLabel}>{messages.noteNames}</span>
          <select value={noteNames} onChange={(event) => setNoteNames(event.target.value as NoteNameMode)}>
            <option value="english">{messages.noteNamesEnglish}</option>
            <option value="swedish">{messages.noteNamesSwedish}</option>
          </select>
        </label>
      </div>

      <section className={`${card.card} ${styles.meterCard}`} aria-label="Tuner">
        <div className={`${styles.reading} ${sounding ? "" : styles.silent} ${inTune ? styles.inTune : ""}`}>
          <p className={styles.note}>{note}</p>
          <p className={styles.detail}>
            {shownString ? <span>{messages.tunerString(shownString.course, note)}</span> : null}
            <span>{formatCents(cents)}</span>
            <span>{frequency === null ? "– Hz" : `${frequency.toFixed(1)} Hz`}</span>
          </p>
        </div>
        {settings.display === "bar" ? (
          <BarMeter cents={cents} inTune={inTune} dim={!sounding} flat={messages.tunerFlat} sharp={messages.tunerSharp} />
        ) : (
          <NeedleMeter cents={cents} inTune={inTune} dim={!sounding} flat={messages.tunerFlat} sharp={messages.tunerSharp} />
        )}
        <div className={styles.controls}>
          <button
            type="button"
            className={listening ? styles.stopButton : styles.startButton}
            onClick={() => (listening ? microphone.stop() : void microphone.start())}
          >
            {listening ? messages.tunerStop : messages.tunerStart}
          </button>
          <p className={styles.status} role="status">
            {statusText}
          </p>
        </div>
      </section>

      <section className={card.card} aria-labelledby="tuner-strings-heading">
        <h2 id="tuner-strings-heading" className={`${card.header} ${card.title}`}>
          {messages.tunerStrings}
        </h2>
        <StringButtons
          strings={strings}
          noteNames={noteNames}
          active={target?.kind === "string" ? target.string : null}
          locked={lockedString}
          tuned={tuner.tuned}
          label={messages.tunerString}
          tunedLabel={messages.tunerTuned}
          onToggle={(number) => setLockedString((current) => (current === number ? null : number))}
        />
        <p className={card.help}>{messages.tunerStringsHelp}</p>
      </section>

      <section className={`${card.card} ${styles.settings}`} aria-label={messages.tuning}>
        <label className={styles.field}>
          <span>{messages.instrument}</span>
          <select
            value={instrument.id}
            onChange={(event) => {
              const next = stringInstrument(event.target.value as StringInstrumentId);
              setEditing(null);
              changeTuning({ ...settings, instrument: next.id, tuning: next.tunings[0].name });
            }}
          >
            {STRING_INSTRUMENTS.map((i) => (
              <option key={i.id} value={i.id}>
                {instrumentName(messages, i.id)}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.tuningField}>
          <label className={styles.field}>
            <span>{messages.tuning}</span>
            <select
              value={tuning.name}
              onChange={(event) => {
                setEditing(null);
                changeTuning({ ...settings, tuning: event.target.value });
              }}
            >
              {tunings.some((t) => t.custom) ? (
                <>
                  <optgroup label={messages.tunerPresetTunings}>
                    {tuningOptions(tunings.filter((t) => !t.custom), noteNames)}
                  </optgroup>
                  <optgroup label={messages.tunerCustomTunings}>
                    {tuningOptions(tunings.filter((t) => t.custom), noteNames)}
                  </optgroup>
                </>
              ) : (
                tuningOptions(tunings, noteNames)
              )}
            </select>
          </label>
          <div className={styles.tuningActions}>
            <button type="button" onClick={() => setEditing({ from: tuning.name, name: "", tuning: [...tuning.tuning] })}>
              {messages.tunerNewTuning}
            </button>
            {tuning.custom ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setEditing({
                      from: tuning.name,
                      previousName: tuning.name,
                      name: tuning.name,
                      tuning: [...tuning.tuning],
                    })
                  }
                >
                  {messages.tunerEditTuning}
                </button>
                <button type="button" onClick={deleteSelected}>
                  {messages.tunerDeleteTuning}
                </button>
              </>
            ) : null}
          </div>
        </div>
        <fieldset className={styles.field}>
          <legend>{messages.tunerDisplay}</legend>
          <div className={styles.segmented}>
            {(["bar", "needle"] as const satisfies readonly TunerDisplay[]).map((display) => (
              <button
                key={display}
                type="button"
                aria-pressed={settings.display === display}
                onClick={() => update({ ...settings, display })}
              >
                {display === "bar" ? messages.tunerBar : messages.tunerNeedle}
              </button>
            ))}
          </div>
        </fieldset>
        <div className={styles.field}>
          <span id="tuner-a4-label">{messages.tunerA4}</span>
          <div className={styles.stepper} role="group" aria-labelledby="tuner-a4-label">
            <button
              type="button"
              aria-label={messages.tunerLower}
              disabled={settings.a4 <= MIN_A4}
              onClick={() => update({ ...settings, a4: Math.max(MIN_A4, settings.a4 - 1) })}
            >
              −
            </button>
            <output aria-live="polite">{settings.a4} Hz</output>
            <button
              type="button"
              aria-label={messages.tunerHigher}
              disabled={settings.a4 >= MAX_A4}
              onClick={() => update({ ...settings, a4: Math.min(MAX_A4, settings.a4 + 1) })}
            >
              +
            </button>
          </div>
        </div>
      </section>

      {editing ? (
        <TuningEditor
          key={`${instrument.id}:${editing.previousName ?? ""}:${editing.from}`}
          instrument={instrument}
          initial={editing}
          noteNames={noteNames}
          messages={messages}
          onSave={saveDraft}
          onCancel={() => setEditing(null)}
        />
      ) : null}
    </main>
  );
}

/** En egen stämning som skapas eller ändras. */
interface TuningDraft {
  /** Stämningen man utgår från. */
  from: string;
  /** Namnet på den egna stämningen som ändras, eller inget för en ny. */
  previousName?: string;
  name: string;
  tuning: number[];
}

function tuningOptions(tunings: readonly TunerTuning[], mode: NoteNameMode) {
  return tunings.map((t) => (
    <option key={t.name} value={t.name}>
      {t.name} ({instrumentCourseNames(t.tuning, mode)})
    </option>
  ));
}

function errorMessage(messages: Messages, error: CustomTuningError): string {
  return {
    empty: messages.tunerNameEmpty,
    tooLong: messages.tunerNameTooLong(MAX_TUNING_NAME_LENGTH),
    taken: messages.tunerNameTaken,
    invalid: messages.tunerTuningInvalid,
  }[error];
}

/** Namn och halvtonssteg per sträng eller Strängpar, i samma ordning som strängknapparna. */
function TuningEditor({
  instrument,
  initial,
  noteNames,
  messages,
  onSave,
  onCancel,
}: {
  instrument: StringInstrument;
  initial: TuningDraft;
  noteNames: NoteNameMode;
  messages: Messages;
  onSave: (draft: TuningDraft) => CustomTuningError | null;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<CustomTuningError | null>(null);
  const heading =
    initial.previousName === undefined
      ? messages.tunerNewTuningHeading
      : messages.tunerEditTuningHeading(initial.previousName);

  return (
    <section className={`${card.card} ${styles.editor}`} aria-labelledby="tuner-editor-heading">
      <h2 id="tuner-editor-heading" className={`${card.header} ${card.title}`}>
        {heading}
      </h2>
      <p className={card.help}>{messages.tunerEditorHelp(initial.from)}</p>
      <form
        className={styles.editorForm}
        onSubmit={(event) => {
          event.preventDefault();
          setError(onSave(draft));
        }}
      >
        <label className={styles.field}>
          <span>{messages.tunerTuningName}</span>
          <input
            type="text"
            value={draft.name}
            maxLength={MAX_TUNING_NAME_LENGTH}
            autoFocus
            aria-invalid={error !== null && error !== "invalid"}
            aria-describedby={error ? "tuner-editor-error" : undefined}
            onChange={(event) => {
              setDraft({ ...draft, name: event.target.value });
              setError(null);
            }}
          />
        </label>
        <ul className={styles.editorStrings}>
          {displayCourses(instrument, draft.tuning).map(({ course, pitches }) => {
            const index = course - 1;
            const { min, max } = pitchRange(instrument, index);
            const pitch = draft.tuning[index];
            const notes = pitches.map((p) => tunerNoteName(p, noteNames)).join(" · ");
            const step = (steps: number) =>
              setDraft({ ...draft, tuning: stepString(instrument, draft.tuning, index, steps) });
            return (
              <li key={course} className={styles.stepper}>
                <button
                  type="button"
                  aria-label={messages.tunerStepDown(course)}
                  disabled={pitch <= min}
                  onClick={() => step(-1)}
                >
                  −
                </button>
                <output aria-live="polite">
                  <span className={styles.editorCourse}>{course}</span>
                  <span>{notes}</span>
                </output>
                <button
                  type="button"
                  aria-label={messages.tunerStepUp(course)}
                  disabled={pitch >= max}
                  onClick={() => step(1)}
                >
                  +
                </button>
              </li>
            );
          })}
        </ul>
        {error ? (
          <p id="tuner-editor-error" className={styles.editorError} role="alert">
            {errorMessage(messages, error)}
          </p>
        ) : null}
        <div className={styles.editorButtons}>
          <button type="submit" className={styles.startButton}>
            {messages.tunerSaveTuning}
          </button>
          <button type="button" className={styles.stopButton} onClick={onCancel}>
            {messages.tunerCancel}
          </button>
        </div>
      </form>
    </section>
  );
}

/** Avvikelsen med tecken, t.ex. "+12 cent", "−3 cent" eller "±0 cent". */
function formatCents(cents: number | null): string {
  if (cents === null) return "– cent";
  const rounded = Math.round(cents);
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "±";
  return `${sign}${Math.abs(rounded)} cent`;
}

/** Stränginstrumentets namn på Sajtspråket. */
function instrumentName(messages: Messages, id: StringInstrumentId): string {
  return {
    guitar6: messages.instrumentGuitar6,
    guitar7: messages.instrumentGuitar7,
    guitar12: messages.instrumentGuitar12,
    bass4: messages.instrumentBass4,
    bass5: messages.instrumentBass5,
    ukulele: messages.instrumentUkulele,
    mandolin: messages.instrumentMandolin,
  }[id];
}

/** Stämningens tonnamn från grövsta till ljusaste strängen, t.ex. "E A D G B E". */
function instrumentCourseNames(tuning: readonly number[], mode: NoteNameMode): string {
  return [...tuning]
    .reverse()
    .map((pitch) => tunerNoteName(pitch, mode).replace(/-?\d+$/, ""))
    .join(" ");
}

/** Strängknapparna från den grövsta till vänster, med ett Strängpar med oktavsträng som en grupp. */
function StringButtons({
  strings,
  noteNames,
  active,
  locked,
  tuned,
  label,
  tunedLabel,
  onToggle,
}: {
  strings: TunerString[];
  noteNames: NoteNameMode;
  active: number | null;
  locked: number | null;
  tuned: readonly number[];
  label: (number: number, note: string) => string;
  tunedLabel: string;
  onToggle: (number: number) => void;
}) {
  const courses = new Map<number, TunerString[]>();
  for (const s of strings) courses.set(s.course, [...(courses.get(s.course) ?? []), s]);
  const groups = [...courses.entries()].sort(([a], [b]) => b - a);

  return (
    <ul className={styles.strings}>
      {groups.map(([course, members]) => (
        <li key={course} className={members.length > 1 ? styles.course : undefined}>
          {members.map((s) => {
            const note = tunerNoteName(s.pitch, noteNames);
            const isTuned = tuned.includes(s.number);
            return (
              <button
                key={s.number}
                type="button"
                className={`${styles.string} ${active === s.number ? styles.activeString : ""} ${isTuned ? styles.tunedString : ""}`}
                aria-pressed={locked === s.number}
                aria-label={`${label(course, note)}${isTuned ? `, ${tunedLabel}` : ""}`}
                onClick={() => onToggle(s.number)}
              >
                <span className={styles.stringNote}>{note}</span>
                <span className={styles.stringCheck} aria-hidden="true">
                  {isTuned ? "✓" : course}
                </span>
              </button>
            );
          })}
        </li>
      ))}
    </ul>
  );
}

interface MeterProps {
  cents: number | null;
  inTune: boolean;
  dim: boolean;
  flat: string;
  sharp: string;
}

const clamp = (cents: number) => Math.max(-METER_RANGE, Math.min(METER_RANGE, cents));

/** En vågrät stapel från −50 till +50 cent med rätt ton i mitten. */
function BarMeter({ cents, inTune, dim, flat, sharp }: MeterProps) {
  const position = cents === null ? null : 50 + (clamp(cents) / METER_RANGE) * 50;
  return (
    <div className={`${styles.bar} ${inTune ? styles.inTune : ""} ${dim ? styles.dim : ""}`} aria-hidden="true">
      <div className={styles.barTrack}>
        {[-40, -30, -20, -10, 0, 10, 20, 30, 40].map((tick) => (
          <span key={tick} className={tick === 0 ? styles.barCenter : styles.barTick} style={{ left: `${50 + tick}%` }} />
        ))}
        {position !== null ? (
          <>
            <span
              className={styles.barFill}
              style={{ left: `${Math.min(50, position)}%`, width: `${Math.abs(position - 50)}%` }}
            />
            <span className={styles.barMarker} style={{ left: `${position}%` }} />
          </>
        ) : null}
      </div>
      <div className={styles.meterLabels}>
        <span>−50 · {flat}</span>
        <span>0</span>
        <span>{sharp} · +50</span>
      </div>
    </div>
  );
}

/** Största utslaget åt varje håll, i grader från lodrätt. */
const NEEDLE_ANGLE = 80;

/** En halvcirkel med en nål som pekar rakt upp när tonen är rätt. */
function NeedleMeter({ cents, inTune, dim, flat, sharp }: MeterProps) {
  const angle = cents === null ? 0 : (clamp(cents) / METER_RANGE) * NEEDLE_ANGLE;
  const ticks = [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50];
  return (
    <div className={`${styles.needle} ${inTune ? styles.inTune : ""} ${dim ? styles.dim : ""}`} aria-hidden="true">
      <svg viewBox="0 0 200 116">
        <path className={styles.needleArc} d={arcPath(-NEEDLE_ANGLE, NEEDLE_ANGLE, 90)} />
        <path className={styles.needleZone} d={arcPath(-(IN_TUNE / METER_RANGE) * NEEDLE_ANGLE, (IN_TUNE / METER_RANGE) * NEEDLE_ANGLE, 90)} />
        {ticks.map((tick) => {
          const a = (tick / METER_RANGE) * NEEDLE_ANGLE;
          const inner = polar(a, tick % 50 === 0 || tick === 0 ? 74 : 80);
          const outer = polar(a, 90);
          return (
            <line
              key={tick}
              className={tick === 0 ? styles.needleCenterTick : styles.needleTick}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
            />
          );
        })}
        <text className={styles.needleText} x={polar(-NEEDLE_ANGLE, 62).x} y="108" textAnchor="start">
          {flat}
        </text>
        <text className={styles.needleText} x={polar(NEEDLE_ANGLE, 62).x} y="108" textAnchor="end">
          {sharp}
        </text>
        {cents !== null ? (
          <g className={styles.needleHand} style={{ transform: `rotate(${angle}deg)` }}>
            <line x1="100" y1="104" x2="100" y2="22" />
          </g>
        ) : null}
        <circle className={styles.needleHub} cx="100" cy="104" r="5" />
      </svg>
    </div>
  );
}

/** En punkt på cirkeln runt (100, 104), `angle` grader från lodrätt medurs. */
function polar(angle: number, radius: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: 100 + radius * Math.sin(rad), y: 104 - radius * Math.cos(rad) };
}

function arcPath(from: number, to: number, radius: number): string {
  const start = polar(from, radius);
  const end = polar(to, radius);
  const large = to - from > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`;
}
