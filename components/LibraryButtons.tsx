"use client";

import type { SyncState, SyncStatus } from "@/lib/librarySync";
import styles from "./TabEditor.module.css";

/** Statusindikatorns text för varje tillstånd i Bibliotekssynken. */
const STATUS_TEXT: Record<SyncStatus, string> = {
  saved: "Saved",
  saving: "Saving…",
  offline: "Not saved (offline)",
  unauthorized: "Not saved (logged out)",
  conflict: "Not saved (conflict)",
  notFound: "Not saved (removed from library)",
};

/** Förklaringen under verktygsraden när Biblioteket inte tar emot ändringarna. */
const STATUS_NOTICE: Partial<Record<SyncStatus, string>> = {
  offline: "The library can't be reached. Your changes are kept in this browser and saved when you're back online.",
  unauthorized: "You have been logged out. Log in again to save to the library. Your changes are kept in this browser.",
  notFound: "This score is no longer in the library, so changes aren't saved. Download it to keep a copy.",
};

/**
 * Tunt skal för Ägaren: en länk till Biblioteket, och "Add to library" eller statusindikatorn för
 * det Partitur som är öppet. Vid en konflikt visas en banner med valen Reload, Save as copy och
 * Overwrite. Gäster ser den aldrig.
 */
export function LibraryButtons({
  sync,
  pending,
  message,
  onAdd,
  onReload,
  onSaveCopy,
  onOverwrite,
  onDismissMessage,
}: {
  /** Bibliotekssynkens tillstånd, eller null när Partituret inte ligger i Biblioteket. */
  sync: SyncState | null;
  /** Ett anrop till Biblioteket från en knapp pågår. */
  pending: boolean;
  /** Ett fel att visa. */
  message: string | null;
  onAdd: () => void;
  onReload: () => void;
  onSaveCopy: () => void;
  onOverwrite: () => void;
  onDismissMessage: () => void;
}) {
  const notice = sync && STATUS_NOTICE[sync.status];
  return (
    <>
      <div className={styles.buttonGroup} role="group" aria-label="Library">
        {/* Vanlig länk, så att webbläsaren varnar om ändringar som inte är sparade */}
        <a href="/library">Library</a>
        {sync ? (
          <span className={styles.syncStatus} role="status" data-status={sync.status}>
            {STATUS_TEXT[sync.status]}
          </span>
        ) : (
          <button type="button" className={styles.editOnly} onClick={onAdd} disabled={pending}>
            {pending ? "Adding…" : "Add to library"}
          </button>
        )}
      </div>
      {sync?.status === "conflict" && (
        <div className={styles.conflictBanner} role="alert">
          <span>
            This score has been changed in another tab or on another device
            {sync.serverRevision !== undefined && ` (revision ${sync.serverRevision})`}. Automatic saving has
            stopped. Your changes are kept in this browser.
          </span>
          <div className={styles.buttonGroup} role="group" aria-label="Resolve conflict">
            <button type="button" onClick={onReload} disabled={pending} title="Discard your changes and open the saved version">
              Reload
            </button>
            <button type="button" onClick={onSaveCopy} disabled={pending} title="Keep both: save your version as a new score">
              Save as copy
            </button>
            <button type="button" onClick={onOverwrite} disabled={pending} title="Replace the saved version with yours">
              Overwrite
            </button>
          </div>
        </div>
      )}
      {notice && (
        <p className={styles.draftNotice} role="note">
          {notice}
        </p>
      )}
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
