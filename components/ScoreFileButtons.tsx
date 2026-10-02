"use client";

import { useRef, useState } from "react";
import type { Command } from "@/lib/editor";
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

/**
 * Tunt skal: laddar ner Partituret som Partiturfil och öppnar en Partiturfil från datorn.
 * Har Partituret ändrats sedan det senast laddades ner eller öppnades frågar den först.
 */
export function ScoreFileButtons({ score, dispatch }: { score: Score; dispatch: (command: Command) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Partiturfilen som det aktuella Partituret senast motsvarade. Ett nytt tomt Partitur har inget att förlora.
  const [savedText, setSavedText] = useState(() => serialize(score));
  const [error, setError] = useState<string | null>(null);

  function download() {
    const text = serialize(score);
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName(score);
    link.click();
    // Vissa webbläsare avbryter nedladdningen om adressen släpps direkt
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setSavedText(text);
  }

  async function open(file: File) {
    setError(null);
    const result = parse(await file.text());
    if (!result.ok) {
      setError(errorMessage(result.error));
      return;
    }
    const hasUnsavedChanges = serialize(score) !== savedText;
    if (hasUnsavedChanges && !confirm("The current score has changes that haven't been downloaded. Open the file anyway?")) {
      return;
    }
    setSavedText(serialize(result.score));
    dispatch({ type: "openScore", score: result.score });
  }

  return (
    <>
      <div className={styles.buttonGroup} role="group" aria-label="Score file">
        <button type="button" onClick={download}>
          Download
        </button>
        <button type="button" onClick={() => inputRef.current?.click()}>
          Open…
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
