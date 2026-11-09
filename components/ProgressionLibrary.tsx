"use client";

import type { SyncStatus } from "@/lib/librarySync";
import type { Messages } from "@/lib/messages";
import type { ProgressionDraft } from "@/lib/progressionDraft";
import type { ProgressionListEntry } from "@/lib/progressionLibraryClient";
import styles from "./ProgressionLibrary.module.css";
import { useProgressionLibrary } from "./useProgressionLibrary";

function statusText(status: SyncStatus, messages: Messages): string {
  switch (status) {
    case "saved":
      return messages.syncSaved;
    case "saving":
      return messages.syncSaving;
    case "offline":
      return messages.syncOffline;
    case "unauthorized":
      return messages.syncUnauthorized;
    case "conflict":
      return messages.syncConflict;
    case "notFound":
      return messages.syncNotFound;
  }
}

function statusNotice(status: SyncStatus, messages: Messages): string | null {
  switch (status) {
    case "offline":
      return messages.syncOfflineNotice;
    case "unauthorized":
      return messages.syncUnauthorizedNotice;
    default:
      return null;
  }
}

/**
 * Tunt skal för Ägaren: Ackordföljderna i Biblioteket under editorn. Den öppna Ackordföljden
 * sparas automatiskt och har en statusindikator, och vid en Konflikt visas valen Ladda om, Spara
 * som kopia och Skriv över. En Gäst ser den aldrig. Synken körs ändå för en Ägare som har loggats
 * ut, som i Tab-editorn: sparningen misslyckas, och Utkastet behåller sin plats i Biblioteket tills
 * Ägaren loggar in igen.
 */
export function ProgressionLibrary({
  draft,
  library: initialEntries,
  messages,
}: {
  draft: ProgressionDraft;
  /** Listan för Ägaren, eller null för en Gäst. */
  library: ProgressionListEntry[] | null;
  messages: Messages;
}) {
  const library = useProgressionLibrary(draft, initialEntries, messages);
  const { syncState, pending } = library;
  if (initialEntries === null) return null;
  const notice = syncState && statusNotice(syncState.status, messages);
  const updatedFormat = new Intl.DateTimeFormat(messages.dateLocale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Stockholm",
  });

  return (
    <section className={styles.library} aria-labelledby="progression-library-heading">
      <h2 id="progression-library-heading" className={styles.heading}>
        {messages.progressionLibrary}
      </h2>
      <div className={styles.toolbar}>
        {syncState && syncState.status !== "notFound" ? (
          <>
            <span>{messages.openedProgression(library.openName ?? messages.untitledProgression)}</span>
            <span className={styles.status} role="status" data-status={syncState.status}>
              {statusText(syncState.status, messages)}
            </span>
          </>
        ) : (
          <>
            <span>{syncState ? messages.syncNotFoundNotice : messages.progressionNotInLibrary}</span>
            <button type="button" onClick={library.add} disabled={pending}>
              {messages.saveProgressionToLibrary}
            </button>
          </>
        )}
        <button type="button" onClick={library.createNew} disabled={pending}>
          {messages.newProgressionInLibrary}
        </button>
      </div>
      {syncState?.status === "conflict" && (
        <div className={styles.conflict} role="alert">
          <span>{messages.progressionConflict(syncState.serverRevision ?? syncState.revision)}</span>
          <div className={styles.choices} role="group" aria-label={messages.resolveConflict}>
            <button type="button" onClick={library.reload} disabled={pending} title={messages.reloadHelp}>
              {messages.reload}
            </button>
            <button type="button" onClick={library.saveCopy} disabled={pending} title={messages.saveAsCopyHelp}>
              {messages.saveAsCopy}
            </button>
            <button type="button" onClick={library.overwrite} disabled={pending} title={messages.overwriteHelp}>
              {messages.overwrite}
            </button>
          </div>
        </div>
      )}
      {notice && (
        <p className={styles.notice} role="note">
          {notice}
        </p>
      )}
      {library.message && (
        <div className={styles.error} role="alert">
          <span>{library.message}</span>
          <button type="button" aria-label={messages.dismiss} onClick={library.dismissMessage}>
            ×
          </button>
        </div>
      )}
      {library.entries.length === 0 ? (
        <p>{messages.progressionLibraryEmpty}</p>
      ) : (
        <div className={styles.tableBox}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{messages.columnName}</th>
                <th>{messages.columnLastChanged}</th>
                <th>
                  <span className={styles.visuallyHidden}>{messages.columnActions}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {library.entries.map((entry) => (
                <tr key={entry.id} aria-current={entry.id === syncState?.id ? "true" : undefined}>
                  <td>{entry.name}</td>
                  <td>
                    <time dateTime={entry.updatedAt}>{updatedFormat.format(new Date(entry.updatedAt))}</time>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button type="button" disabled={pending} onClick={() => library.open(entry)}>
                        {messages.open}
                      </button>
                      <button type="button" disabled={pending} onClick={() => library.rename(entry)}>
                        {messages.rename}
                      </button>
                      <button type="button" disabled={pending} onClick={() => library.duplicate(entry)}>
                        {messages.copy}
                      </button>
                      <button type="button" disabled={pending} onClick={() => library.remove(entry)}>
                        {messages.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
