"use client";

import type { AlphaTabApi } from "@coderline/alphatab";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { browserStorage, loadDraft, saveDraft, type Draft } from "@/lib/draft";
import { apply, createEditor, neighbourBeat, type Cursor, type Side } from "@/lib/editor";
import { keyToBeatText, keyToCommand, type KeyPress } from "@/lib/keyboard";
import { addToLibrary, loadFromLibrary, saveToLibrary, type LibraryFailure } from "@/lib/libraryClient";
import { LibrarySync } from "@/lib/librarySync";
import type { BeatText, Score } from "@/lib/score";
import { serialize } from "@/lib/scoreFile";
import { invalidBars } from "@/lib/validation";
import { BarButtons } from "./BarButtons";
import { BeatTextField } from "./BeatTextField";
import { LibraryButtons } from "./LibraryButtons";
import { DEFAULT_PLAYBACK_OPTIONS, PlaybackControls, playNoteAt } from "./PlaybackControls";
import { ScoreFileButtons, type ReplacedBy } from "./ScoreFileButtons";
import { ScoreSettings } from "./ScoreSettings";
import { ScoreView } from "./ScoreView";
import { ShortcutButtons } from "./ShortcutButtons";
import styles from "./TabEditor.module.css";

/**
 * Smal skärm eller pekenhet: Partituret går att visa och spela upp men inte redigera. Samma fråga
 * som i TabEditor.module.css, som döljer redigeringsverktygen.
 */
const VIEW_ONLY_MEDIA = "(max-width: 640px), (pointer: coarse)";

/** Ett Partitur som Ägaren har öppnat från Biblioteket. */
export type OpenedFromLibrary = { id: string; revision: number; score: Score };

/** En synk för ett Partitur i Biblioteket, i en revision som motsvarar `savedText` (null när den inte är känd). */
function syncFor(id: string, revision: number, score: Score, savedText: string | null): LibrarySync {
  return new LibrarySync({ id, revision, savedText, score, save: saveToLibrary });
}

const noSubscription = () => () => {};

/** Ett begripligt meddelande när Biblioteket inte tog emot Partituret. */
function libraryErrorMessage(failure: LibraryFailure): string {
  switch (failure.reason) {
    case "unauthorized":
      return "You have been logged out. Log in again to use the library. Your changes are kept in this browser.";
    case "conflict":
      return "This score has been changed in another tab or on another device. Your changes are kept in this browser.";
    case "notFound":
      return "This score is no longer in the library.";
    case "failed":
      return "The library couldn't be reached. Check your connection and try again.";
  }
}

/**
 * Det Partitur som editorn startar med. Ett Partitur som öppnas från Biblioteket ersätter
 * Utkastet, utom när Utkastet redan är samma revision av det, eventuellt med osparade ändringar.
 */
function initialDraft(fromLibrary: OpenedFromLibrary | undefined): Draft | null {
  const draft = loadDraft(browserStorage());
  if (!fromLibrary) return draft;
  if (draft?.library?.id === fromLibrary.id && draft.library.revision === fromLibrary.revision) return draft;
  return {
    score: fromLibrary.score,
    downloaded: true,
    library: { id: fromLibrary.id, revision: fromLibrary.revision, saved: true },
  };
}

export function TabEditor({ owner, fromLibrary }: { owner: boolean; fromLibrary?: OpenedFromLibrary }) {
  // Editorn renderas bara i webbläsaren, så Utkastet kan läsas redan när den skapas
  const [restored] = useState(() => initialDraft(fromLibrary));
  const [state, dispatch] = useReducer(apply, restored, (draft) =>
    draft ? apply(createEditor(), { type: "openScore", score: draft.score }) : createEditor(),
  );
  const barProblems = useMemo(() => invalidBars(state.score), [state.score]);
  // Partiturfilen som Partituret senast motsvarade, eller null när den inte är känd.
  // Ett nytt tomt Partitur har inget att förlora.
  const [fileText, setFileText] = useState(() => (!restored || restored.downloaded ? serialize(state.score) : null));
  const scoreText = useMemo(() => serialize(state.score), [state.score]);
  // Jämförelsen görs mot texten, så ändringar som ångras tillbaka räknas inte
  const downloaded = scoreText === fileText;

  // Synken skapas utan sidoeffekter och startas av en effekt, så att den går att skapa vid rendering
  const [sync, setSync] = useState<LibrarySync | null>(() =>
    restored?.library
      ? syncFor(
          restored.library.id,
          restored.library.revision,
          restored.score,
          restored.library.saved ? serialize(restored.score) : null,
        )
      : null,
  );
  const syncState = useSyncExternalStore(
    sync?.subscribe ?? noSubscription,
    () => sync?.state ?? null,
    () => null,
  );
  const saved = syncState?.saved ?? false;
  // Ett Partitur i Biblioteket är säkert när det är sparat, andra när de är nedladdade. Utloggad
  // ser Ägaren inget av Biblioteket och arbetar som en Gäst.
  const nothingToLose = owner && syncState ? saved : downloaded;
  const [libraryPending, setLibraryPending] = useState(false);
  const [libraryMessage, setLibraryMessage] = useState<string | null>(null);
  // Ökar när ett annat Partitur tar det nuvarandes plats, så att svar som gäller det förra ignoreras
  const generation = useRef(0);

  useEffect(() => {
    // En omladdning ska inte öppna Partituret från Biblioteket igen och ersätta ändringarna i
    // Utkastet. Partituret och dess id finns redan i Utkastet.
    if (fromLibrary) window.history.replaceState(null, "", "/tab-editor");
  }, [fromLibrary]);

  useEffect(() => {
    if (!sync) return;
    sync.start();
    return () => sync.stop();
  }, [sync]);

  useEffect(() => {
    sync?.edit(state.score);
  }, [sync, state.score]);

  useEffect(() => {
    if (!sync) return;
    const flush = () => sync.flush();
    // Sista ändringen sparas direkt när fliken döljs eller stängs, och när nätet kommer tillbaka
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") flush();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);
    window.addEventListener("online", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("online", flush);
    };
  }, [sync]);

  /** Lägger Partituret i Biblioteket som ett nytt Partitur. Används också för Spara som kopia. */
  async function addScore(score: Score) {
    const current = generation.current;
    setLibraryPending(true);
    setLibraryMessage(null);
    const result = await addToLibrary(score);
    if (current !== generation.current) return;
    setLibraryPending(false);
    if (result.ok) setSync(syncFor(result.id, result.revision, score, serialize(score)));
    else setLibraryMessage(libraryErrorMessage(result));
  }

  /** Ladda om: ersätter ändringarna med den senast sparade versionen i Biblioteket. */
  async function reloadScore() {
    if (!syncState) return;
    const current = generation.current;
    setLibraryPending(true);
    setLibraryMessage(null);
    const result = await loadFromLibrary(syncState.id);
    if (current !== generation.current) return;
    setLibraryPending(false);
    if (!result.ok) {
      setLibraryMessage(libraryErrorMessage(result));
      return;
    }
    generation.current++;
    setFileText(serialize(result.score));
    setSync(syncFor(syncState.id, result.revision, result.score, serialize(result.score)));
    dispatch({ type: "openScore", score: result.score });
  }

  function onReplaced(score: Score, by: ReplacedBy) {
    generation.current++;
    setSync(null);
    setLibraryPending(false);
    setLibraryMessage(null);
    // Ägarens nya Partitur hamnar i Biblioteket direkt. En öppnad fil gör det inte. Det tomma
    // Partitur som editorn startar med när inget Utkast finns läggs inte dit, så att varje besök
    // inte lämnar ett tomt Partitur efter sig.
    if (owner && by === "new") void addScore(score);
  }

  // Utkastet sparas först när något har ändrats sedan start. Ett Utkast som inte gick att läsa,
  // t.ex. från en nyare version av editorn, skrivs då inte över bara för att editorn öppnades.
  // Ett Partitur som har öppnats från Biblioteket ersätter däremot Utkastet direkt.
  const [atStart] = useState({ score: state.score, downloaded, syncState });
  const changedSinceStart = useRef(fromLibrary !== undefined);
  useEffect(() => {
    if (
      !changedSinceStart.current &&
      state.score === atStart.score &&
      downloaded === atStart.downloaded &&
      syncState === atStart.syncState
    ) {
      return;
    }
    changedSinceStart.current = true;
    saveDraft(browserStorage(), {
      score: state.score,
      downloaded,
      library: syncState ? { id: syncState.id, revision: syncState.revision, saved: syncState.saved } : undefined,
    });
  }, [atStart, state.score, downloaded, syncState]);

  useEffect(() => {
    if (nothingToLose) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [nothingToLose]);

  const [api, setApi] = useState<AlphaTabApi | null>(null);
  const [playbackOptions, setPlaybackOptions] = useState(DEFAULT_PLAYBACK_OPTIONS);
  // Satt när ett band har skrivits in och tonen ska höras när Partituret har renderats
  const soundPendingRef = useRef(false);

  useEffect(() => {
    // Notvyn är ett barn, så den har redan renderat det nya Partituret när det här körs
    if (!soundPendingRef.current) return;
    soundPendingRef.current = false;
    if (api && playbackOptions.soundOnInput) playNoteAt(api, state.cursor);
  }, [state, api, playbackOptions.soundOnInput]);

  // Textfältet för Ackordnamnet eller Anteckningen på slaget under markören, när det är öppet
  const [openTextField, setOpenTextField] = useState<BeatText | null>(null);

  /**
   * Ett tangenttryck från tangentbordet eller en knapp: öppnar ett textfält på slaget eller blir
   * ett Editor-kommando. Svarar om trycket gjorde något.
   */
  const onPress = useCallback((press: KeyPress) => {
    const textField = keyToBeatText(press);
    if (textField) {
      setOpenTextField(textField);
      return true;
    }
    const command = keyToCommand(press);
    if (!command) return false;
    if (command.type === "typeDigit") soundPendingRef.current = true;
    dispatch(command);
    return true;
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target instanceof HTMLElement ? event.target : null;
      // Textfält har sin egen inmatning och sitt eget ångra
      if (target?.closest("input, textarea, [contenteditable]")) return;
      // En öppen dialog är modal, så Partituret bakom den ändras inte
      if (document.querySelector("dialog[open]")) return;
      if (matchMedia(VIEW_ONLY_MEDIA).matches) return;
      const command = keyToCommand(event);
      // I en rullgardin styr tangenterna rullgardinen, men ångra och gör om gäller Partituret
      if (target?.closest("select") && command?.type !== "undo" && command?.type !== "redo") return;
      // Markerad text på sidan kopieras som vanligt
      if (command?.type === "copy" && !window.getSelection()?.isCollapsed) return;
      // Tangenten ska inte heller göra sitt vanliga, t.ex. skrivas i ett textfält som den öppnar
      if (onPress(event)) event.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onPress]);

  function commitBeatText(field: BeatText, text: string, move?: Side) {
    dispatch({ type: "setBeatText", field, text });
    // Texten ändrar inte slagen, så grannslaget är detsamma efter kommandot
    const next = move && neighbourBeat(state, move);
    if (next) dispatch({ type: "moveCursorTo", position: next });
    else setOpenTextField(null);
  }

  // Stabil, så att notvyn inte får en ny klickhanterare vid varje rendering
  const onPositionClick = useCallback((position: Cursor) => dispatch({ type: "moveCursorTo", position }), []);

  return (
    <div className={styles.editor}>
      <ScoreSettings score={state.score} cursor={state.cursor} dispatch={dispatch} />
      <ShortcutButtons onPress={onPress} />
      <div className={styles.toolbar}>
        <nav className={styles.buttonGroup} aria-label="Site">
          <Link href="/">← Guitar Practice</Link>
        </nav>
        <ScoreFileButtons
          score={state.score}
          nothingToLose={nothingToLose}
          onFileMatched={(score) => setFileText(serialize(score))}
          onReplaced={onReplaced}
          dispatch={dispatch}
        />
        {owner && (
          <LibraryButtons
            sync={syncState}
            pending={libraryPending}
            message={libraryMessage}
            onAdd={() => void addScore(state.score)}
            onReload={() => void reloadScore()}
            onSaveCopy={() => void addScore(state.score)}
            onOverwrite={() => sync?.overwrite()}
            onDismissMessage={() => setLibraryMessage(null)}
          />
        )}
        <div className={styles.editTools}>
          <BarButtons dispatch={dispatch} />
        </div>
        <div className={styles.buttonGroup}>
          {/* Print-CSS:en i TabEditor.module.css lämnar bara Sidorna kvar */}
          <button type="button" onClick={() => window.print()}>
            Print…
          </button>
        </div>
        {!(owner && syncState) && (
          <p className={styles.draftNotice} role="note">
            Your work is saved as a draft in this browser only. Download the score to keep a safe copy.
          </p>
        )}
      </div>
      <PlaybackControls
        api={api}
        cursor={state.cursor}
        options={playbackOptions}
        onOptionsChange={setPlaybackOptions}
      />
      <ScoreView
        score={state.score}
        cursor={state.cursor}
        selection={state.selection}
        invalidBars={barProblems}
        onApiChange={setApi}
        onPositionClick={onPositionClick}
        cursorOverlay={
          openTextField
            ? (box) => {
                const { track, bar, beat } = state.cursor;
                return (
                  <BeatTextField
                    // Ett nytt fält för varje slag, med slagets text
                    key={`${openTextField}-${bar}-${beat}`}
                    field={openTextField}
                    value={state.score.tracks[track].bars[bar].beats[beat][openTextField] ?? ""}
                    cursorBox={box}
                    onCommit={(text, move) => commitBeatText(openTextField, text, move)}
                    onCancel={() => setOpenTextField(null)}
                  />
                );
              }
            : undefined
        }
      />
    </div>
  );
}
