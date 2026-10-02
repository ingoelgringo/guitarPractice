"use client";

import styles from "./TabEditor.module.css";

/**
 * Tunt skal för Ägaren: en länk till Biblioteket, och "Add to library" eller "Save" för det
 * Partitur som är öppet. Gäster ser den aldrig.
 */
export function LibraryButtons({
  inLibrary,
  saved,
  pending,
  message,
  onAdd,
  onSave,
  onDismissMessage,
}: {
  inLibrary: boolean;
  /** Om Partituret är detsamma som den senast kända revisionen i Biblioteket. */
  saved: boolean;
  /** Ett anrop till Biblioteket pågår. */
  pending: boolean;
  /** Ett fel att visa, t.ex. en konflikt. */
  message: string | null;
  onAdd: () => void;
  onSave: () => void;
  onDismissMessage: () => void;
}) {
  return (
    <>
      <div className={styles.buttonGroup} role="group" aria-label="Library">
        {/* Vanlig länk, så att webbläsaren varnar om ändringar som inte är sparade */}
        <a href="/library">Library</a>
        {inLibrary ? (
          <button type="button" className={styles.editOnly} onClick={onSave} disabled={pending || saved}>
            {pending ? "Saving…" : saved ? "Saved" : "Save"}
          </button>
        ) : (
          <button type="button" className={styles.editOnly} onClick={onAdd} disabled={pending}>
            {pending ? "Adding…" : "Add to library"}
          </button>
        )}
      </div>
      {message && (
        <div className={styles.fileError} role="alert">
          <span>{message}</span>
          <button type="button" aria-label="Dismiss" onClick={onDismissMessage}>
            ×
          </button>
        </div>
      )}
    </>
  );
}
