"use client";

import type { AlphaTabApi } from "@coderline/alphatab";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { browserStorage, loadDraft, saveDraft, type Draft } from "@/lib/draft";
import { apply, createEditor, type Cursor } from "@/lib/editor";
import { keyToCommand, SHORTCUTS } from "@/lib/keyboard";
import { addToLibrary, saveToLibrary, type LibraryFailure } from "@/lib/libraryClient";
import type { Score } from "@/lib/score";
import { serialize } from "@/lib/scoreFile";
import { invalidBars } from "@/lib/validation";
import { BarButtons } from "./BarButtons";
import { LibraryButtons } from "./LibraryButtons";
import { DEFAULT_PLAYBACK_OPTIONS, PlaybackControls, playNoteAt } from "./PlaybackControls";
import { ScoreFileButtons, type ReplacedBy } from "./ScoreFileButtons";
import { ScoreSettings } from "./ScoreSettings";
import { ScoreView } from "./ScoreView";
import styles from "./TabEditor.module.css";
import { ViewModePicker } from "./ViewModePicker";

/**
 * Smal skärm eller pekenhet: Partituret går att visa och spela upp men inte redigera. Samma fråga
 * som i TabEditor.module.css, som döljer redigeringsverktygen.
 */
const VIEW_ONLY_MEDIA = "(max-width: 640px), (pointer: coarse)";

/** Ett Partitur som Ägaren har öppnat från Biblioteket. */
export type OpenedFromLibrary = { id: string; revision: number; score: Score };

/** Ett Partitur i Biblioteket: id, senast kända revision och texten som den revisionen motsvarar. */
type LibraryState = { id: string; revision: number; savedText: string | null };

/** Ett begripligt meddelande när Biblioteket inte tog emot Partituret. */
function libraryErrorMessage(failure: LibraryFailure): string {
  switch (failure.reason) {
    case "unauthorized":
      return "You have been logged out. Log in again to use the library. Your changes are kept in this browser.";
    case "conflict":
      return `This score has been changed in another tab or on another device (revision ${failure.revision}), so it wasn't saved. Your changes are kept in this browser.`;
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

  const [library, setLibrary] = useState<LibraryState | null>(() =>
    restored?.library
      ? { ...restored.library, savedText: restored.library.saved ? serialize(restored.score) : null }
      : null,
  );
  const saved = library !== null && scoreText === library.savedText;
  // Ett Partitur i Biblioteket är säkert när det är sparat, andra när de är nedladdade. Utloggad
  // ser Ägaren inget av Biblioteket och arbetar som en Gäst.
  const nothingToLose = owner && library ? saved : downloaded;
  const [libraryPending, setLibraryPending] = useState(false);
  const [libraryMessage, setLibraryMessage] = useState<string | null>(null);
  // Ökar när ett annat Partitur tar det nuvarandes plats, så att svar som gäller det förra ignoreras
  const generation = useRef(0);

  useEffect(() => {
    // En omladdning ska inte öppna Partituret från Biblioteket igen och ersätta ändringarna i
    // Utkastet. Partituret och dess id finns redan i Utkastet.
    if (fromLibrary) window.history.replaceState(null, "", "/tab-editor");
  }, [fromLibrary]);

  async function addScore(score: Score) {
    const current = generation.current;
    setLibraryPending(true);
    setLibraryMessage(null);
    const result = await addToLibrary(score);
    if (current !== generation.current) return;
    setLibraryPending(false);
    if (result.ok) setLibrary({ id: result.id, revision: result.revision, savedText: serialize(score) });
    else setLibraryMessage(libraryErrorMessage(result));
  }

  async function saveScore() {
    if (!library) return;
    const current = generation.current;
    const text = scoreText;
    setLibraryPending(true);
    setLibraryMessage(null);
    const result = await saveToLibrary(library.id, state.score, library.revision);
    if (current !== generation.current) return;
    setLibraryPending(false);
    if (result.ok) setLibrary({ id: library.id, revision: result.revision, savedText: text });
    else setLibraryMessage(libraryErrorMessage(result));
  }

  function onReplaced(score: Score, by: ReplacedBy) {
    generation.current++;
    setLibrary(null);
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
  const [atStart] = useState({ score: state.score, downloaded, library });
  const changedSinceStart = useRef(fromLibrary !== undefined);
  useEffect(() => {
    if (
      !changedSinceStart.current &&
      state.score === atStart.score &&
      downloaded === atStart.downloaded &&
      library === atStart.library
    ) {
      return;
    }
    changedSinceStart.current = true;
    saveDraft(browserStorage(), {
      score: state.score,
      downloaded,
      library: library ? { id: library.id, revision: library.revision, saved } : undefined,
    });
  }, [atStart, state.score, downloaded, library, saved]);

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

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target instanceof HTMLElement ? event.target : null;
      // Textfält har sin egen inmatning och sitt eget ångra
      if (target?.closest("input, textarea, [contenteditable]")) return;
      // En öppen dialog är modal, så Partituret bakom den ändras inte
      if (document.querySelector("dialog[open]")) return;
      if (matchMedia(VIEW_ONLY_MEDIA).matches) return;
      const command = keyToCommand(event);
      if (!command) return;
      // I en rullgardin styr tangenterna rullgardinen, men ångra och gör om gäller Partituret
      if (target?.closest("select") && command.type !== "undo" && command.type !== "redo") return;
      // Markerad text på sidan kopieras som vanligt
      if (command.type === "copy" && !window.getSelection()?.isCollapsed) return;
      event.preventDefault();
      if (command.type === "typeDigit") soundPendingRef.current = true;
      dispatch(command);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Stabil, så att notvyn inte får en ny klickhanterare vid varje rendering
  const onPositionClick = useCallback((position: Cursor) => dispatch({ type: "moveCursorTo", position }), []);

  return (
    <div className={styles.editor}>
      <ScoreSettings score={state.score} cursor={state.cursor} dispatch={dispatch} />
      <details className={styles.help}>
        <summary>Keyboard shortcuts</summary>
        <table>
          <tbody>
            {SHORTCUTS.map(({ keys, action }) => (
              <tr key={keys}>
                <td>
                  <kbd>{keys}</kbd>
                </td>
                <td>{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <div className={styles.toolbar}>
        <ScoreFileButtons
          score={state.score}
          nothingToLose={nothingToLose}
          onFileMatched={(score) => setFileText(serialize(score))}
          onReplaced={onReplaced}
          dispatch={dispatch}
        />
        {owner && (
          <LibraryButtons
            inLibrary={library !== null}
            saved={saved}
            pending={libraryPending}
            message={libraryMessage}
            onAdd={() => void addScore(state.score)}
            onSave={() => void saveScore()}
            onDismissMessage={() => setLibraryMessage(null)}
          />
        )}
        <div className={styles.editTools}>
          <ViewModePicker viewMode={state.score.viewMode} dispatch={dispatch} />
          <BarButtons dispatch={dispatch} />
        </div>
        <div className={styles.buttonGroup}>
          {/* Print-CSS:en i TabEditor.module.css lämnar bara Sidorna kvar */}
          <button type="button" onClick={() => window.print()}>
            Print…
          </button>
        </div>
        {!(owner && library) && (
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
      />
    </div>
  );
}
