"use client";

import { type KeyboardEvent, type PointerEvent, useId, useRef, useState } from "react";
import type { Messages } from "@/lib/messages";
import { addToForm, moveInForm, type Progression, removeFromForm } from "@/lib/progression";
import styles from "./ProgressionEditor.module.css";

interface Props {
  progression: Progression;
  onChange: (progression: Progression) => void;
  messages: Messages;
}

interface Drag {
  from: number;
  to: number;
  pointer: number;
}

/**
 * Formen som en rad med Delarnas namn. En Del läggs till sist, dras till en ny plats (med mus eller
 * finger, eller med Alt+←/→) och tas bort med ett kryss.
 */
export function ProgressionFormRow({ progression, onChange, messages }: Props) {
  const { form, sections } = progression;
  const [drag, setDrag] = useState<Drag | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const helpId = useId();
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const handles = useRef<(HTMLSpanElement | null)[]>([]);
  const nameOf = (id: string) => sections.find((s) => s.id === id)?.name ?? "";
  const toAdd = adding && sections.some((s) => s.id === adding) ? adding : sections[0].id;

  // Under dragningen visas Formen som den blir när man släpper.
  const shown = form.map((_, index) => index);
  if (drag) shown.splice(drag.to, 0, ...shown.splice(drag.from, 1));

  /** Den nya platsen för Delen som dras: hur många av de andra platserna som ligger före pekaren. */
  function targetAt(from: number, x: number, y: number): number {
    return form.filter((_, index) => {
      const rect = index !== from && items.current[index]?.getBoundingClientRect();
      return !!rect && (y > rect.bottom || (y >= rect.top && x > rect.left + rect.width / 2));
    }).length;
  }

  function onPointerDown(event: PointerEvent<HTMLSpanElement>, index: number) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ from: index, to: index, pointer: event.pointerId });
  }

  function onPointerMove(event: PointerEvent<HTMLSpanElement>) {
    if (!drag || event.pointerId !== drag.pointer) return;
    const to = targetAt(drag.from, event.clientX, event.clientY);
    if (to !== drag.to) setDrag({ ...drag, to });
  }

  function onPointerUp(event: PointerEvent<HTMLSpanElement>) {
    if (!drag || event.pointerId !== drag.pointer) return;
    setDrag(null);
    if (event.type === "pointerup" && drag.from !== drag.to) onChange(moveInForm(progression, drag.from, drag.to));
  }

  function onKeyDown(event: KeyboardEvent<HTMLSpanElement>, index: number) {
    if (!event.altKey || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    event.preventDefault();
    const to = index + (event.key === "ArrowRight" ? 1 : -1);
    if (to < 0 || to >= form.length) return;
    onChange(moveInForm(progression, index, to));
    // Fokus följer med Delen till dess nya plats.
    requestAnimationFrame(() => handles.current[to]?.focus());
  }

  return (
    <div className={styles.form} role="group" aria-label={messages.form}>
      <h3 className={styles.formHeading}>{messages.form}</h3>
      {form.length === 0 ? (
        <p className={styles.help}>{messages.formEmpty}</p>
      ) : (
        <ol className={styles.formItems}>
          {shown.map((index) => {
            const name = nameOf(form[index]);
            return (
              <li
                key={`${index}:${form[index]}`}
                ref={(element) => {
                  items.current[index] = element;
                }}
                className={[styles.formItem, drag?.from === index ? styles.dragging : ""].join(" ")}
              >
                <span
                  ref={(element) => {
                    handles.current[index] = element;
                  }}
                  className={styles.formHandle}
                  tabIndex={0}
                  aria-describedby={helpId}
                  onPointerDown={(event) => onPointerDown(event, index)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onKeyDown={(event) => onKeyDown(event, index)}
                >
                  {name}
                </span>
                <button
                  type="button"
                  className={styles.formRemove}
                  aria-label={messages.removeFromForm(name)}
                  onClick={() => onChange(removeFromForm(progression, index))}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ol>
      )}
      <div className={styles.settings}>
        <select aria-label={messages.sections} value={toAdd} onChange={(event) => setAdding(event.target.value)}>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.name}
            </option>
          ))}
        </select>
        <button type="button" className={styles.addToForm} onClick={() => onChange(addToForm(progression, toAdd))}>
          {messages.addToForm}
        </button>
      </div>
      <p id={helpId} className={styles.help} hidden={form.length < 2}>
        {messages.formHelp}
      </p>
    </div>
  );
}
