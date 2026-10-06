"use client";

import Link from "next/link";
import { type KeyboardEvent, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { browserStorage } from "@/lib/draft";
import { type CagedShape, DEFAULT_NOTE_NAME_MODE, FRET_COUNT, type FretboardTab, fretboardView, INLAY_FRETS, type Inversion, type LabelMode, type NoteNameMode, type RootRole, SCALES, type ScaleId, type StringSet } from "@/lib/fretboard";
import { choiceToParams, type FretboardChoice, restoredChoice } from "@/lib/fretboardParams";
import { stepAround } from "@/lib/tableNavigation";
import { STANDARD_TUNING } from "@/lib/score";
import styles from "./Fretboard.module.css";

/** Det man väljer i Flikens tabell: en cell, ett Ackord, ett Intervall eller en Box. */
type TableChoice = Pick<FretboardChoice, "chord" | "box" | "caged" | "interval">;

/** Inget Ackord, ingen Box, ingen CAGED-form och inget Intervall: bara Skalan. */
const CLEARED: TableChoice = { chord: undefined, box: undefined, caged: undefined, interval: undefined };

/** Flikarna i panelen, i den ordning de visas. */
const TABS: readonly { id: FretboardTab; name: string }[] = [
  { id: "caged", name: "CAGED" },
  { id: "penta", name: "Penta" },
  { id: "triads", name: "Triads" },
  { id: "intervals", name: "Intervals" },
];

/** Radrubrikerna i Intervalltabellen. */
const INTERVAL_NAMES: Record<number, string> = { 2: "2nd", 3: "3rd", 4: "4th", 5: "5th", 6: "6th", 7: "7th", 8: "Octave" };

/** Det skärmläsare får höra för en Omvändning. */
const INVERSION_NAMES: Record<Inversion, string> = { R: "root position", "3": "first inversion", "5": "second inversion" };

/** Ett Strängset i dropdownen, t.ex. "6-4-3". */
const stringSetName = (strings: StringSet) => [...strings].join("-");

/** En rad i Flikens tabell: ett Ackord (eller Intervall) och en cell per Box med det cellen visar. */
interface TableRow {
  /** Det radrubriken väljer: Ackordet eller Intervallet. */
  row: Pick<TableChoice, "chord" | "interval">;
  /** Radrubrikens text, t.ex. "ii – Dm" eller "6th". */
  header: string;
  /** Om radrubriken går att välja. Ett Intervall utan Box visar inget. */
  headerSelects: boolean;
  cells: {
    box: number;
    /** Cellens text, `null` för ett förminskat Ackord. */
    text: string | null;
    /** Det skärmläsare får höra efter Ackord och Box, t.ex. ", E shape". */
    description: string;
    /** Formen som cellen väljer. Bara i CAGED-fliken. */
    caged?: CagedShape;
  }[];
}

// Halsens mått i SVG-enheter
/** Kolumnen längst till vänster med × för strängar som CAGED-greppet dämpar. */
const MUTE_WIDTH = 20;
const OPEN_WIDTH = 44;
const NUT_X = MUTE_WIDTH + OPEN_WIDTH;
const FRET_WIDTH = 64;
const STRING_GAP = 32;
/** Utrymmet ovanför halsen, där Ackordets namn står över Boxen. */
const TOP = 48;
const CHORD_LABEL_Y = 18;
const BOTTOM = 32;
const DOT_RADIUS = 13;
const INLAY_RADIUS = 6;
const END_MARGIN = 8;

const STRING_COUNT = STANDARD_TUNING.length;
const NECK_HEIGHT = (STRING_COUNT - 1) * STRING_GAP;
const WIDTH = NUT_X + FRET_COUNT * FRET_WIDTH + END_MARGIN;
const HEIGHT = TOP + NECK_HEIGHT + BOTTOM;
/** Halsen skalas med tillgänglig bredd, men inte mindre än så här. Därunder skrollar den i sidled. */
const MIN_SCALE = 0.7;

// Notnamnsläget sparas per webbläsare, med svenskt som standard. Det ligger inte i adressen.
const NOTE_NAME_KEY = "guitarPractice.fretboard.noteNames";
const noteNameListeners = new Set<() => void>();

function readNoteNameMode(): NoteNameMode {
  try {
    return browserStorage()?.getItem(NOTE_NAME_KEY) === "english" ? "english" : DEFAULT_NOTE_NAME_MODE;
  } catch {
    return DEFAULT_NOTE_NAME_MODE;
  }
}

function saveNoteNameMode(mode: NoteNameMode) {
  try {
    browserStorage()?.setItem(NOTE_NAME_KEY, mode);
  } catch {
    // Utan lagring gäller valet bara tills sidan laddas om
  }
  noteNameListeners.forEach((listener) => listener());
}

function subscribeNoteNameMode(listener: () => void) {
  noteNameListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    noteNameListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

// Det senaste valet sparas per webbläsare, så att sidan utan val i adressen börjar där man slutade
const CHOICE_KEY = "guitarPractice.fretboard.choice";

function readStoredChoice(): string | null {
  try {
    return browserStorage()?.getItem(CHOICE_KEY) ?? null;
  } catch {
    return null;
  }
}

function saveChoice(params: URLSearchParams) {
  try {
    browserStorage()?.setItem(CHOICE_KEY, params.toString());
  } catch {
    // Utan lagring börjar sidan med standardvalet nästa gång
  }
}

/** Kantlinjen för en Prick efter vilken grundton den är. */
const ROOT_CLASSES: Record<RootRole, string | undefined> = {
  scale: styles.scaleRoot,
  chord: styles.chordRoot,
  none: undefined,
};

/** x-mitten för ett band: lös sträng till vänster om sadeln, övriga mitt mellan bandstavarna. */
function fretCenter(fret: number): number {
  return fret === 0 ? MUTE_WIDTH + OPEN_WIDTH / 2 : NUT_X + (fret - 0.5) * FRET_WIDTH;
}

/** y för en sträng. Sträng 1 (ljusa e) överst, som i tabulatur. */
function stringY(string: number): number {
  return TOP + (string - 1) * STRING_GAP;
}

export function Fretboard({ initialChoice }: { initialChoice: FretboardChoice }) {
  const [choice, setChoice] = useState(initialChoice);
  /** Urvalet som musen står över i Flikens tabell. Det förhandsvisas på halsen men skrivs inte i adressen. */
  const [hovered, setHovered] = useState<TableChoice | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const noteNames = useSyncExternalStore(subscribeNoteNameMode, readNoteNameMode, () => DEFAULT_NOTE_NAME_MODE);
  const { root, scale, labels } = choice;
  const { selection, options, intervalPair } = fretboardView({ ...choice, noteNames, tuning: STANDARD_TUNING });
  /** Halsen visar det hovrade urvalet (med dess första Tonpar), och annars det valda. */
  const preview = fretboardView({
    ...choice,
    ...hovered,
    ...(hovered && { intervalStep: undefined }),
    noteNames,
    tuning: STANDARD_TUNING,
  });
  const { dots, mutedStrings, chordLabels } = preview;
  const { chord, box, interval, tab = "caged", strings } = selection;
  const chordRow = ({ degree, numeral, name }: { degree: number; numeral: string; name: string }) => ({
    row: { chord: degree },
    header: `${numeral} – ${name}`,
    headerSelects: true,
  });
  const tableRows: TableRow[] =
    tab === "intervals"
      ? options.intervalTable.map(({ interval: rowInterval, cells }) => ({
          row: { interval: rowInterval },
          header: INTERVAL_NAMES[rowInterval],
          headerSelects: false,
          cells: cells.map(({ box: boxNumber, quality }) => ({ box: boxNumber, text: quality, description: "" })),
        }))
      : tab === "triads"
      ? options.triadTable.map((row) => ({
          ...chordRow(row),
          cells: row.cells.map(({ box: boxNumber, inversion }) => ({
            box: boxNumber,
            text: inversion,
            description: `, ${INVERSION_NAMES[inversion]}`,
          })),
        }))
      : tab === "penta"
      ? options.pentaTable.map((row) => ({
          ...chordRow(row),
          cells: row.cells.map(({ box: boxNumber, pentaBox }) => ({
            box: boxNumber,
            text: pentaBox === null ? null : String(pentaBox),
            description: pentaBox === null ? "" : `, penta box ${pentaBox}`,
          })),
        }))
      : options.cagedTable.map((row) => ({
          ...chordRow(row),
          cells: row.cells.map(({ box: boxNumber, shape }) => ({
            box: boxNumber,
            text: shape,
            description: shape === null ? "" : `, ${shape} shape`,
            caged: shape ?? undefined,
          })),
        }));
  /** Om ett urval i Flikens tabell (en cell, ett Ackord eller en Box) är det valda. */
  const sameTarget = (a: TableChoice, b: TableChoice) =>
    a.chord === b.chord && a.box === b.box && a.caged === b.caged && a.interval === b.interval;
  const isSelected = (target: TableChoice) => sameTarget(selection, target);
  const isHovered = (target: TableChoice) => hovered !== null && sameTarget(hovered, target);

  /**
   * Byter val och skriver det i adressen, utan en ny post i historiken per val. Val som inte gäller släpps,
   * och Tonparet börjar om från Boxens lägsta Grundton. Halsen visar sedan det valda, inte det hovrade.
   */
  function choose(change: Partial<FretboardChoice>) {
    setHovered(null);
    apply({ ...choice, intervalStep: undefined, ...change });
  }

  /** Flyttar Tonparet ett skalsteg upp eller ner. Modellen låter steget gå runt. */
  function stepInterval(delta: number) {
    choose({ intervalStep: (selection.intervalStep ?? 0) + delta });
  }

  /** Visar valet, med det som inte gäller släppt, och skriver det i adressen och webbläsaren. */
  function apply(next: FretboardChoice) {
    next = { ...next };
    const normalized = fretboardView({ ...next, tuning: STANDARD_TUNING }).selection;
    next.chord = normalized.chord;
    next.box = normalized.box;
    next.caged = normalized.caged;
    next.tab = normalized.tab;
    next.strings = normalized.strings;
    next.interval = normalized.interval;
    next.intervalStep = normalized.intervalStep;
    setChoice(next);
    const params = choiceToParams(next);
    window.history.replaceState(null, "", `?${params}`);
    saveChoice(params);
  }

  // Utan val i adressen börjar sidan med det senast valda. Adressen finns bara i webbläsaren, så det sker efter hydreringen.
  useLayoutEffect(() => {
    const restored = restoredChoice(window.location.search, readStoredChoice());
    if (restored) apply(restored);
    else saveChoice(choiceToParams(choice));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bara vid start
  }, []);

  /**
   * Byter Flik med Ackord och Box kvar. Från en cell i Penta- eller Treklangsfliken blir valet
   * CAGED-tabellens cell för samma Ackord och Box. Till de andra Flikarna släpps formen.
   */
  function chooseTab(next: FretboardTab) {
    if (next === tab) return;
    const cell = options.cagedTable.find((row) => row.degree === chord)?.cells.find((c) => c.box === box);
    const shape = next === "caged" ? (cell?.shape ?? undefined) : undefined;
    choose({ tab: next, caged: shape });
  }

  /** Vänster och höger flyttar mellan Flikarna, med fokus på den valda. */
  function handleTabKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const index = TABS.findIndex(({ id }) => id === tab);
    const next = TABS[(index + (event.key === "ArrowLeft" ? -1 : 1) + TABS.length) % TABS.length].id;
    const tablist = event.currentTarget;
    flushSync(() => chooseTab(next));
    tablist.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus();
  }

  /** Väljer ett urval i Flikens tabell, eller avmarkerar det om det redan är valt. */
  function toggle(target: TableChoice) {
    choose(isSelected(target) ? CLEARED : { ...CLEARED, ...target });
  }

  /** Det som är gemensamt för en knapp i Flikens tabell: valt, hovrat, hovring förhandsvisar och klick väljer. */
  function tableButton(target: Partial<TableChoice>) {
    const full = { ...CLEARED, ...target };
    return {
      type: "button" as const,
      "aria-pressed": isSelected(full),
      "data-hovered": isHovered(full) || undefined,
      onMouseEnter: () => setHovered(full),
      onClick: () => toggle(full),
    };
  }

  /**
   * Piltangenterna flyttar valet i Flikens tabell: upp och ner byter Ackord, vänster och höger byter Box,
   * och valet går runt till andra kanten. Utan valt Ackord (eller Box) väljer de det första. Escape avmarkerar.
   */
  function handleTableKey(event: KeyboardEvent<HTMLTableElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      choose(CLEARED);
      return;
    }
    const rows = tableRows;
    const row = rows.findIndex((r) => r.row.chord === chord && r.row.interval === interval);
    const column = box === undefined ? -1 : options.boxes.indexOf(box);
    // Med en vald cell i Intervallfliken flyttar vänster och höger Tonparet i stället för Boxen
    if (tab === "intervals" && intervalPair !== null && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      stepInterval(event.key === "ArrowLeft" ? -1 : 1);
      return;
    }
    let nextRow = row;
    // I Intervallfliken väljer tangenterna alltid en cell, eftersom ett Intervall utan Box inte visar något
    let nextColumn = tab === "intervals" && column < 0 ? 0 : column;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      nextRow = stepAround(row, event.key === "ArrowUp" ? -1 : 1, rows.length);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      nextColumn = stepAround(column, event.key === "ArrowLeft" ? -1 : 1, options.boxes.length);
    } else {
      return;
    }
    event.preventDefault();
    const nextRowChoice = nextRow < 0 ? undefined : rows[nextRow];
    const nextBox = nextColumn < 0 ? undefined : options.boxes[nextColumn];
    // I en cell i CAGED-fliken följer formen med, så att valet blir cellen. Ett förminskat Ackord har ingen form.
    const shape = nextRowChoice && nextBox !== undefined ? nextRowChoice.cells[nextColumn].caged : undefined;
    // Fokus följer med till det nya valet, som därför måste vara ritat först
    flushSync(() => {
      choose({ ...CLEARED, ...nextRowChoice?.row, box: nextBox, caged: shape });
    });
    tableRef.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')?.focus();
  }

  return (
    <main className={styles.page}>
      <nav aria-label="Site">
        <Link href="/">← Guitar Practice</Link>
      </nav>
      <h1>Fretboard</h1>
      <div className={styles.layout}>
        <div className={styles.scroller}>
          <svg
            className={styles.neck}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            style={{ minWidth: WIDTH * MIN_SCALE }}
            role="img"
            aria-label={`${options.roots[root]} ${SCALES.find((s) => s.id === scale)?.name} on the fretboard`}
          >
            {INLAY_FRETS.map((fret) =>
              fret === 12 ? (
                <g key={fret} className={styles.inlay}>
                  <circle cx={fretCenter(fret)} cy={TOP + STRING_GAP * 1.5} r={INLAY_RADIUS} />
                  <circle cx={fretCenter(fret)} cy={TOP + STRING_GAP * 3.5} r={INLAY_RADIUS} />
                </g>
              ) : (
                <circle key={fret} className={styles.inlay} cx={fretCenter(fret)} cy={TOP + NECK_HEIGHT / 2} r={INLAY_RADIUS} />
              ),
            )}
            {Array.from({ length: FRET_COUNT + 1 }, (_, i) => (
              <line
                key={i}
                className={i === 0 ? styles.nut : styles.fretWire}
                x1={NUT_X + i * FRET_WIDTH}
                x2={NUT_X + i * FRET_WIDTH}
                y1={TOP}
                y2={TOP + NECK_HEIGHT}
              />
            ))}
            {Array.from({ length: STRING_COUNT }, (_, i) => (
              <line key={i} className={styles.string} x1={NUT_X} x2={WIDTH - END_MARGIN} y1={stringY(i + 1)} y2={stringY(i + 1)} />
            ))}
            {Array.from({ length: FRET_COUNT }, (_, i) => (
              <text key={i} className={styles.fretNumber} x={fretCenter(i + 1)} y={HEIGHT - 8}>
                {i + 1}
              </text>
            ))}
            {chordLabels.map(({ name, low, high }) => (
              <text key={low} className={styles.chordLabel} x={(fretCenter(low) + fretCenter(high)) / 2} y={CHORD_LABEL_Y}>
                {name}
              </text>
            ))}
            {mutedStrings.map((string) => (
              <text key={string} className={styles.mutedString} x={MUTE_WIDTH / 2} y={stringY(string)}>
                ×
              </text>
            ))}
            {dots.map((dot) => (
              <g
                key={`${dot.string}-${dot.fret}`}
                className={[styles.dot, styles[dot.layer], ROOT_CLASSES[dot.rootRole]].filter(Boolean).join(" ")}
              >
                <circle cx={fretCenter(dot.fret)} cy={stringY(dot.string)} r={DOT_RADIUS} />
                <text x={fretCenter(dot.fret)} y={stringY(dot.string)}>
                  {dot.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <section className={styles.panel} aria-label="Choices">
          <div className={`${styles.panelGroup} ${styles.scalePicker}`}>
            <label>
              Root
              <select value={root} onChange={(event) => choose({ root: Number(event.target.value) })}>
                {options.roots.map((name, pitchClass) => (
                  <option key={pitchClass} value={pitchClass}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Scale
              <select value={scale} onChange={(event) => choose({ scale: event.target.value as ScaleId })}>
                {SCALES.map(({ id, name }) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.panelGroup}>
            <div role="tablist" aria-label="Chord tables" className={styles.tabs} onKeyDown={handleTabKey}>
              {TABS.map(({ id, name }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`tab-${id}`}
                  aria-selected={id === tab}
                  aria-controls="tab-panel"
                  tabIndex={id === tab ? 0 : -1}
                  onClick={() => chooseTab(id)}
                >
                  {name}
                </button>
              ))}
            </div>
            {tab === "triads" && (
              <label className={styles.stringPicker}>
                Strings
                <select value={strings} onChange={(event) => choose({ strings: event.target.value as StringSet })}>
                  {options.stringSets.map((stringSet) => (
                    <option key={stringSet} value={stringSet}>
                      {stringSetName(stringSet)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {tab === "intervals" && (
              <div className={styles.intervalStepper}>
                <button type="button" aria-label="Previous pair" disabled={intervalPair === null} onClick={() => stepInterval(-1)}>
                  ◀
                </button>
                <output aria-live="polite">
                  {intervalPair === null ? "Choose a cell" : `${intervalPair.bass} – ${intervalPair.upper}, ${intervalPair.quality}`}
                </output>
                <button type="button" aria-label="Next pair" disabled={intervalPair === null} onClick={() => stepInterval(1)}>
                  ▶
                </button>
              </div>
            )}
            <table
              ref={tableRef}
              id="tab-panel"
              role="tabpanel"
              aria-labelledby={`tab-${tab}`}
              className={styles.chordTable}
              onKeyDown={handleTableKey}
              onMouseLeave={() => setHovered(null)}
            >
              <thead>
                <tr>
                  <td />
                  <th scope="colgroup" colSpan={options.boxes.length}>
                    Box
                  </th>
                </tr>
                <tr>
                  <td />
                  {options.boxes.map((boxNumber) => (
                    <th key={boxNumber} scope="col">
                      <button aria-label={`Box ${boxNumber}`} {...tableButton({ box: boxNumber })}>
                        {boxNumber}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map(({ row, header, headerSelects, cells }) => (
                  <tr key={header}>
                    <th scope="row">{headerSelects ? <button {...tableButton(row)}>{header}</button> : header}</th>
                    {cells.map(({ box: boxNumber, text, description, caged: cellShape }) => (
                      // En cell utan form (i Penta-, Treklangs- och Intervallfliken eller för ett förminskat Ackord) väljer bara raden och Boxen
                      <td key={boxNumber}>
                        <button
                          aria-label={`${header}, Box ${boxNumber}${description}`}
                          {...tableButton({ ...row, box: boxNumber, caged: cellShape })}
                        >
                          {text ?? "–"}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.panelGroup}>
            <label>
              Labels{" "}
              <select value={labels} onChange={(event) => choose({ labels: event.target.value as LabelMode })}>
                <option value="interval">Intervals</option>
                <option value="noteName">Note names</option>
              </select>
            </label>
            <label>
              Note names{" "}
              <select value={noteNames} onChange={(event) => saveNoteNameMode(event.target.value as NoteNameMode)}>
                <option value="swedish">Swedish (H, B)</option>
                <option value="english">English (B, B♭)</option>
              </select>
            </label>
          </div>
        </section>
      </div>
    </main>
  );
}
