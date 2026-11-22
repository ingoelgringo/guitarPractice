"use client";

import type { ReactNode } from "react";
import type { SyncStatus } from "@/lib/librarySync";
import type { Messages } from "@/lib/messages";
import type { ProgressionDraft } from "@/lib/progressionDraft";
import type { ProgressionListEntry } from "@/lib/progressionLibraryClient";
import card from "./Card.module.css";
import { CardIcon } from "./CardIcon";
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
 * Tunt skal för Ägaren: Ackordföljderna i Biblioteket, ett kort bredvid Ackordeditorn med en lista
 * där ett klick öppnar Ackordföljden. Den öppna Ackordföljden sparas automatiskt och har en
 * statusindikator i kortets rubrik, och vid en Konflikt visas valen Ladda om, Spara som kopia och
 * Skriv över. En Gäst ser den aldrig. Synken körs ändå för en Ägare som har loggats ut, som i
 * Tab-editorn: sparningen misslyckas, och Utkastet behåller sin plats i Biblioteket tills Ägaren
 * loggar in igen.
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
    <section className={`${card.card} ${styles.library}`} aria-labelledby="progression-library-heading">
      <div className={card.header}>
        <h2 id="progression-library-heading" className={card.title}>
          <CardIcon name="library" />
          {messages.progressionLibrary}
        </h2>
        <div className={card.tools}>
          {syncState && syncState.status !== "notFound" ? (
            <span className={styles.status} role="status" data-status={syncState.status}>
              {statusText(syncState.status, messages)}
            </span>
          ) : (
            <button type="button" className={styles.button} onClick={library.add} disabled={pending}>
              {messages.saveProgressionToLibrary}
            </button>
          )}
          <button type="button" className={styles.button} onClick={library.createNew} disabled={pending}>
            {messages.newProgressionInLibrary}
          </button>
        </div>
      </div>
      <p className={card.help}>
        {syncState && syncState.status !== "notFound"
          ? messages.openedProgression(library.openName ?? messages.untitledProgression)
          : syncState
            ? messages.syncNotFoundNotice
            : messages.progressionNotInLibrary}
      </p>
      {syncState?.status === "conflict" && (
        <div className={styles.conflict} role="alert">
          <span>{messages.progressionConflict(syncState.serverRevision ?? syncState.revision)}</span>
          <div className={styles.choices} role="group" aria-label={messages.resolveConflict}>
            <button
              type="button"
              className={styles.button}
              onClick={library.reload}
              disabled={pending}
              title={messages.reloadHelp}
            >
              {messages.reload}
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={library.saveCopy}
              disabled={pending}
              title={messages.saveAsCopyHelp}
            >
              {messages.saveAsCopy}
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={library.overwrite}
              disabled={pending}
              title={messages.overwriteHelp}
            >
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
        <p className={card.help}>{messages.progressionLibraryEmpty}</p>
      ) : (
        <ul className={styles.list}>
          {library.entries.map((entry) => (
            <li
              key={entry.id}
              className={styles.entry}
              aria-current={entry.id === syncState?.id ? "true" : undefined}
            >
              <button type="button" className={styles.open} disabled={pending} onClick={() => library.open(entry)}>
                <svg className={styles.entryIcon} viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h10" />
                </svg>
                <span className={styles.entryText}>
                  <span className={styles.name}>{entry.name}</span>
                  <time className={styles.changed} dateTime={entry.updatedAt}>
                    {messages.progressionChanged(updatedFormat.format(new Date(entry.updatedAt)))}
                  </time>
                </span>
              </button>
              <EntryButton
                icon="rename"
                label={`${messages.rename}: ${entry.name}`}
                title={messages.rename}
                disabled={pending}
                onClick={() => library.rename(entry)}
              />
              <EntryButton
                icon="duplicate"
                label={`${messages.duplicate}: ${entry.name}`}
                title={messages.duplicate}
                disabled={pending}
                onClick={() => library.duplicate(entry)}
              />
              <EntryButton
                icon="delete"
                label={`${messages.delete}: ${entry.name}`}
                title={messages.delete}
                disabled={pending}
                onClick={() => library.remove(entry)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Ikonerna för Byt namn, Duplicera och Ta bort, ritade i en 24×24-ruta med kontur. */
const ENTRY_ICONS = {
  rename: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  duplicate: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  delete: (
    <>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </>
  ),
} satisfies Record<string, ReactNode>;

/** En ikonknapp på en rad i listan, med åtgärden och Ackordföljdens namn som etikett. */
function EntryButton({
  icon,
  label,
  title,
  disabled,
  onClick,
}: {
  icon: keyof typeof ENTRY_ICONS;
  label: string;
  title: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.iconButton}
      aria-label={label}
      title={title}
      disabled={disabled}
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {ENTRY_ICONS[icon]}
      </svg>
    </button>
  );
}
