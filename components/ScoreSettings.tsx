"use client";

import { useState, type InputHTMLAttributes } from "react";
import type { Command, Cursor } from "@/lib/editor";
import {
  MAX_FRET,
  MAX_REPEAT_COUNT,
  MAX_TEMPO,
  MAX_TIME_SIGNATURE_BEATS,
  MIN_REPEAT_COUNT,
  MIN_TEMPO,
  MIN_TIME_SIGNATURE_BEATS,
  tempoAt,
  TIME_SIGNATURE_BEAT_VALUES,
  timeSignatureAt,
  type Duration,
  type Metadata,
  type Score,
  type TimeSignature,
} from "@/lib/score";
import { findTuningPreset, noteName, TUNING_PRESETS } from "@/lib/tuning";
import styles from "./TabEditor.module.css";

const METADATA_FIELDS: readonly { field: keyof Metadata; label: string }[] = [
  { field: "title", label: "Title" },
  { field: "subtitle", label: "Subtitle" },
  { field: "artist", label: "Artist" },
  { field: "tabbedBy", label: "Tabbed by" },
];

/** Tonhöjderna som går att välja per sträng i en egen Stämning: E1 till E5. */
const PITCHES = Array.from({ length: 49 }, (_, i) => 28 + i);

/**
 * Tunt skal: panel för metadata, Stämning, Capo, starttempo och starttaktart, samt byten och
 * repriser på markörens Takt. Varje ändring blir ett Editor-kommando och går därför att ångra.
 */
export function ScoreSettings({
  score,
  cursor,
  dispatch,
}: {
  score: Score;
  /** Markören: Stämning och Capo gäller dess Spår, och byten och repriser dess Takt. */
  cursor: Cursor;
  dispatch: (command: Command) => void;
}) {
  const track = score.tracks[cursor.track];
  const preset = findTuningPreset(track.tuning);

  function setString(index: number, pitch: number) {
    const tuning = [...track.tuning];
    tuning[index] = pitch;
    dispatch({ type: "setTuning", tuning });
  }

  return (
    <details className={styles.settings}>
      <summary>Score settings</summary>
      <div className={styles.settingsGrid}>
        {METADATA_FIELDS.map(({ field, label }) => (
          <label key={field}>
            <span>{label}</span>
            <CommitInput
              value={score.metadata[field]}
              onCommit={(value) => dispatch({ type: "setMetadata", metadata: { [field]: value } })}
            />
          </label>
        ))}

        <label>
          <span>Tuning</span>
          <select
            value={preset?.name ?? ""}
            onChange={(e) => {
              const chosen = TUNING_PRESETS.find((p) => p.name === e.target.value);
              if (chosen) dispatch({ type: "setTuning", tuning: [...chosen.tuning] });
            }}
          >
            {TUNING_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
            <option value="" disabled>
              Custom
            </option>
          </select>
        </label>
        <fieldset className={styles.strings}>
          <legend>Strings (1 = highest)</legend>
          {track.tuning.map((pitch, i) => (
            <label key={i}>
              <span>{i + 1}</span>
              <select value={pitch} onChange={(e) => setString(i, Number(e.target.value))}>
                {PITCHES.map((p) => (
                  <option key={p} value={p}>
                    {noteName(p)}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </fieldset>

        <label>
          <span>Capo</span>
          <NumberInput min={0} max={MAX_FRET} value={track.capo} onCommit={(capo) => dispatch({ type: "setCapo", capo })} />
        </label>
        <label>
          <span>Tempo (BPM)</span>
          <NumberInput
            min={MIN_TEMPO}
            max={MAX_TEMPO}
            value={score.tempo}
            onCommit={(tempo) => dispatch({ type: "setTempo", tempo })}
          />
        </label>
        <label>
          <span>Time signature</span>
          <TimeSignatureInput
            value={score.timeSignature}
            onChange={(timeSignature) => dispatch({ type: "setTimeSignature", timeSignature })}
          />
        </label>

        <BarSettings score={score} cursor={cursor} dispatch={dispatch} />
      </div>
    </details>
  );
}

/**
 * Taktart, tempo och repriser på markörens Takt. Fälten visar det som gäller i Takten, och en
 * ändring där blir ett byte från och med Takten.
 */
function BarSettings({ score, cursor, dispatch }: { score: Score; cursor: Cursor; dispatch: (command: Command) => void }) {
  const bar = score.tracks[cursor.track].bars[cursor.bar];

  return (
    <fieldset className={styles.bar}>
      <legend>Bar {cursor.bar + 1}</legend>
      <label>
        <span>Time signature from here</span>
        <span className={styles.barChange}>
          <TimeSignatureInput
            value={timeSignatureAt(score, cursor.track, cursor.bar)}
            onChange={(timeSignature) => dispatch({ type: "setBarTimeSignature", timeSignature })}
          />
          {bar.timeSignature && (
            <button type="button" onClick={() => dispatch({ type: "clearBarTimeSignature" })}>
              Remove change
            </button>
          )}
        </span>
      </label>
      <label>
        <span>Tempo from here (BPM)</span>
        <span className={styles.barChange}>
          <NumberInput
            min={MIN_TEMPO}
            max={MAX_TEMPO}
            value={tempoAt(score, cursor.track, cursor.bar)}
            onCommit={(tempo) => dispatch({ type: "setBarTempo", tempo })}
          />
          {bar.tempo !== undefined && (
            <button type="button" onClick={() => dispatch({ type: "clearBarTempo" })}>
              Remove change
            </button>
          )}
        </span>
      </label>
      <label className={styles.checkbox}>
        <input type="checkbox" checked={bar.repeatStart === true} onChange={() => dispatch({ type: "toggleRepeatStart" })} />
        Repeat start
      </label>
      <label className={styles.checkbox}>
        <input type="checkbox" checked={bar.repeatEnd !== undefined} onChange={() => dispatch({ type: "toggleRepeatEnd" })} />
        Repeat end
      </label>
      {bar.repeatEnd !== undefined && (
        <label>
          <span>Times played</span>
          <NumberInput
            min={MIN_REPEAT_COUNT}
            max={MAX_REPEAT_COUNT}
            value={bar.repeatEnd}
            onCommit={(count) => dispatch({ type: "setRepeatCount", count })}
          />
        </label>
      )}
    </fieldset>
  );
}

/** Antal slag och slagets Notvärde i en taktart. */
function TimeSignatureInput({ value, onChange }: { value: TimeSignature; onChange: (value: TimeSignature) => void }) {
  return (
    <span className={styles.timeSignature}>
      <NumberInput
        min={MIN_TIME_SIGNATURE_BEATS}
        max={MAX_TIME_SIGNATURE_BEATS}
        aria-label="Beats per bar"
        value={value.beats}
        onCommit={(beats) => onChange({ ...value, beats })}
      />
      /
      <select
        aria-label="Beat value"
        value={value.beatValue}
        onChange={(e) => onChange({ ...value, beatValue: Number(e.target.value) as Duration })}
      >
        {TIME_SIGNATURE_BEAT_VALUES.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </span>
  );
}

/**
 * Ett fält som skickar sitt värde först när man lämnar det eller trycker Enter, så att varje
 * tangenttryck inte blir ett eget steg att ångra. Avvisar Editorn värdet visas det gamla igen.
 */
function CommitInput({
  value,
  onCommit,
  ...props
}: { value: string; onCommit: (value: string) => void } & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  // Ändras värdet utifrån, t.ex. vid ångra, ersätter det utkastet
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  function commit() {
    if (draft !== value) onCommit(draft);
    setDraft(value);
  }

  return (
    <input
      {...props}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
      }}
    />
  );
}

/** Ett sifferfält som `CommitInput`. Ett tomt fält skickas inte, utan det gamla värdet visas igen. */
function NumberInput({
  value,
  onCommit,
  ...props
}: { value: number; onCommit: (value: number) => void } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
>) {
  return (
    <CommitInput
      {...props}
      type="number"
      value={String(value)}
      onCommit={(text) => {
        if (text.trim() !== "") onCommit(Number(text));
      }}
    />
  );
}
