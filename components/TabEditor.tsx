"use client";

import type { AlphaTabApi } from "@coderline/alphatab";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { browserStorage, loadDraft, saveDraft } from "@/lib/draft";
import { apply, createEditor } from "@/lib/editor";
import { keyToCommand, SHORTCUTS } from "@/lib/keyboard";
import { serialize } from "@/lib/scoreFile";
import { invalidBars } from "@/lib/validation";
import { DEFAULT_PLAYBACK_OPTIONS, PlaybackControls, playNoteAt } from "./PlaybackControls";
import { ScoreFileButtons } from "./ScoreFileButtons";
import { ScoreSettings } from "./ScoreSettings";
import { ScoreView } from "./ScoreView";
import styles from "./TabEditor.module.css";
import { ViewModePicker } from "./ViewModePicker";

export function TabEditor() {
  // Editorn renderas bara i webbläsaren, så Utkastet kan läsas redan när den skapas
  const [restored] = useState(() => loadDraft(browserStorage()));
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

  // Utkastet sparas först när något har ändrats sedan start. Ett Utkast som inte gick att läsa,
  // t.ex. från en nyare version av editorn, skrivs då inte över bara för att editorn öppnades.
  const [atStart] = useState({ score: state.score, downloaded });
  const changedSinceStart = useRef(false);
  useEffect(() => {
    if (!changedSinceStart.current && state.score === atStart.score && downloaded === atStart.downloaded) return;
    changedSinceStart.current = true;
    saveDraft(browserStorage(), { score: state.score, downloaded });
  }, [atStart, state.score, downloaded]);

  useEffect(() => {
    if (downloaded) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [downloaded]);

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
      const command = keyToCommand(event);
      if (!command) return;
      // I en rullgardin styr tangenterna rullgardinen, men ångra och gör om gäller Partituret
      if (target?.closest("select") && command.type !== "undo" && command.type !== "redo") return;
      event.preventDefault();
      if (command.type === "typeDigit") soundPendingRef.current = true;
      dispatch(command);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
          downloaded={downloaded}
          onFileMatched={(score) => setFileText(serialize(score))}
          dispatch={dispatch}
        />
        <ViewModePicker viewMode={state.score.viewMode} dispatch={dispatch} />
        <p className={styles.draftNotice} role="note">
          Your work is saved as a draft in this browser only. Download the score to keep a safe copy.
        </p>
      </div>
      <PlaybackControls
        api={api}
        cursor={state.cursor}
        options={playbackOptions}
        onOptionsChange={setPlaybackOptions}
      />
      <ScoreView score={state.score} cursor={state.cursor} invalidBars={barProblems} onApiChange={setApi} />
    </div>
  );
}
