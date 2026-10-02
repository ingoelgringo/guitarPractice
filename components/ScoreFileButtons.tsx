"use client";

import { useRef, useState } from "react";
import { createEditor, type Command } from "@/lib/editor";
import type { Score } from "@/lib/score";
import { FILE_EXTENSION, fileName, parse, serialize, type ParseError } from "@/lib/scoreFile";
import styles from "./TabEditor.module.css";

/** Ett begripligt felmeddelande för en fil som inte gick att öppna. */
function errorMessage(error: ParseError): string {
  switch (error.kind) {
    case "invalidJson":
      return "The file is damaged and can't be read. It may not have finished downloading.";
    case "notAScoreFile":
      return "This isn't a score file. Only .itab files saved from the Tab Editor can be opened.";
    case "unsupportedVersion":
      return `This score file was made with a newer version of the Tab Editor (format version ${error.version}). Reload the page to get the latest version and try again.`;
    case "invalidScore":
      return "The score file is damaged and can't be opened.";
  }
}

/** Hur ett annat Partitur tog det nuvarandes plats: ett nytt tomt eller ett från en fil. */
export type ReplacedBy = "new" | "file";

/**
 * Tunt skal: laddar ner Partituret som Partiturfil, öppnar en Partiturfil från datorn och
 * startar ett nytt tomt Partitur. Har Partituret ändringar som inte är nedladdade frågar den
 * först, eftersom Utkastet då ersätts.
 */
export function ScoreFileButtons({
  score,
  nothingToLose,
  onFileMatched,
  onReplaced,
  dispatch,
}: {
  score: Score;
  /**
   * Om Partituret kan ersättas utan att något går förlorat: det är detsamma som när det senast
   * laddades ner eller öppnades, eller som den senast sparade revisionen i Biblioteket.
   */
  nothingToLose: boolean;
  /** Anropas när Partituret i Editorn motsvarar en Partiturfil: efter nedladdning, eller när ett annat tar dess plats. */
  onFileMatched: (score: Score) => void;
  /** Anropas när ett annat Partitur tar det nuvarandes plats: ett nytt tomt eller ett från en fil. */
  onReplaced: (score: Score, by: ReplacedBy) => void;
  dispatch: (command: Command) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const newDialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);

  function download() {
    const url = URL.createObjectURL(new Blob([serialize(score)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName(score);
    link.click();
    // Vissa webbläsare avbryter nedladdningen om adressen släpps direkt
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onFileMatched(score);
  }

  function replaceWith(next: Score, by: ReplacedBy) {
    onFileMatched(next);
    onReplaced(next, by);
    dispatch({ type: "openScore", score: next });
  }

  async function open(file: File) {
    setError(null);
    const result = parse(await file.text());
    if (!result.ok) {
      setError(errorMessage(result.error));
      return;
    }
    if (!nothingToLose && !confirm("The current score has changes that haven't been downloaded. Open the file anyway?")) {
      return;
    }
    replaceWith(result.score, "file");
  }

  function startNew() {
    replaceWith(createEditor().score, "new");
  }

  return (
    <>
      <div className={styles.buttonGroup} role="group" aria-label="Score file">
        <button type="button" onClick={() => (nothingToLose ? startNew() : newDialogRef.current?.showModal())}>
          New
        </button>
        <button type="button" onClick={() => inputRef.current?.click()}>
          Open…
        </button>
        <button type="button" onClick={download}>
          Download
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={FILE_EXTENSION}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Samma fil ska gå att välja igen
          e.target.value = "";
          if (file) void open(file);
        }}
      />
      <dialog
        ref={newDialogRef}
        className={styles.dialog}
        aria-labelledby="new-score-question"
        onClose={(e) => {
          // Esc stänger utan svar och räknas som Cancel
          const choice = e.currentTarget.returnValue;
          e.currentTarget.returnValue = "";
          if (choice === "download") download();
          if (choice === "download" || choice === "discard") startNew();
        }}
      >
        <form method="dialog">
          <p id="new-score-question">
            The current score has changes that haven&apos;t been downloaded, and a new score replaces your draft.
            Download the current score first?
          </p>
          <div className={styles.dialogButtons}>
            <button value="cancel">Cancel</button>
            <button value="discard">Don&apos;t download</button>
            <button value="download" autoFocus>
              Download
            </button>
          </div>
        </form>
      </dialog>
      {error && (
        <div className={styles.fileError} role="alert">
          <span>{error}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}
    </>
  );
}
