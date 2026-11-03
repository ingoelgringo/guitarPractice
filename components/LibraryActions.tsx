"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { downloadText } from "@/lib/download";
import { browserStorage, detachFromLibrary, loadDraft, saveDraft } from "@/lib/draft";
import {
  deleteFromLibrary,
  duplicateInLibrary,
  scoreFileFromLibrary,
  type LibraryFailure,
} from "@/lib/libraryClient";
import { MESSAGES, type Messages } from "@/lib/messages";
import { fileName } from "@/lib/scoreFile";
import type { SiteLanguage } from "@/lib/siteLanguage";
import styles from "@/app/page.module.css";

/** Ett begripligt meddelande när en åtgärd i Biblioteket inte gick att göra. */
function errorMessage(failure: LibraryFailure, messages: Messages): string {
  switch (failure.reason) {
    case "unauthorized":
      return messages.libraryLoggedOut;
    case "notFound":
      return messages.libraryNotFound;
    case "conflict":
    case "failed":
      return messages.libraryUnreachable;
  }
}

/**
 * Tunt skal: åtgärderna för ett Partitur i Bibliotekets lista. Varje åtgärd läser om listan när
 * den är klar. Ladda ner hämtar Partiturfilen, som saknar id och revision, så en återöppnad fil
 * blir alltid ett nytt Partitur.
 */
export function LibraryActions({ id, title, language }: { id: string; title: string; language: SiteLanguage }) {
  const messages = MESSAGES[language];
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run<T extends { ok: true }>(action: () => Promise<T | LibraryFailure>, onDone?: (result: T) => void) {
    setPending(true);
    setError(null);
    const result = await action();
    setPending(false);
    if (!result.ok) {
      setError(errorMessage(result, messages));
      // Ett Partitur som redan är borttaget ska försvinna ur listan
      if (result.reason === "notFound") router.refresh();
      return;
    }
    onDone?.(result);
    router.refresh();
  }

  function remove() {
    if (!confirm(messages.confirmDelete(title))) return;
    void run(
      () => deleteFromLibrary(id),
      () => {
        // Har editorn det här Partituret i Utkastet ligger det kvar där, men utanför Biblioteket
        const storage = browserStorage();
        const draft = loadDraft(storage);
        const detached = detachFromLibrary(draft, id);
        if (detached && detached !== draft) saveDraft(storage, detached);
      },
    );
  }

  return (
    <div className={styles.libraryActions}>
      <button type="button" disabled={pending} onClick={() => void run(() => duplicateInLibrary(id))}>
        {messages.duplicate}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          void run(
            () => scoreFileFromLibrary(id),
            ({ text, score }) => downloadText(text, fileName(score)),
          )
        }
      >
        {messages.download}
      </button>
      <button type="button" disabled={pending} onClick={remove}>
        {messages.delete}
      </button>
      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
