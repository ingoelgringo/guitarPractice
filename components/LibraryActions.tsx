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
import { fileName } from "@/lib/scoreFile";
import styles from "@/app/page.module.css";

/** Ett begripligt meddelande när en åtgärd i Biblioteket inte gick att göra. */
function errorMessage(failure: LibraryFailure): string {
  switch (failure.reason) {
    case "unauthorized":
      return "You have been logged out. Log in again to use the library.";
    case "notFound":
      return "This score is no longer in the library.";
    case "conflict":
    case "failed":
      return "The library couldn't be reached. Check your connection and try again.";
  }
}

/**
 * Tunt skal: åtgärderna för ett Partitur i Bibliotekets lista. Varje åtgärd läser om listan när
 * den är klar. Ladda ner hämtar Partiturfilen, som saknar id och revision, så en återöppnad fil
 * blir alltid ett nytt Partitur.
 */
export function LibraryActions({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run<T extends { ok: true }>(action: () => Promise<T | LibraryFailure>, onDone?: (result: T) => void) {
    setPending(true);
    setError(null);
    const result = await action();
    setPending(false);
    if (!result.ok) {
      setError(errorMessage(result));
      // Ett Partitur som redan är borttaget ska försvinna ur listan
      if (result.reason === "notFound") router.refresh();
      return;
    }
    onDone?.(result);
    router.refresh();
  }

  function remove() {
    if (!confirm(`Delete "${title}" from the library? This can't be undone.`)) return;
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
        Duplicate
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
        Download
      </button>
      <button type="button" disabled={pending} onClick={remove}>
        Delete
      </button>
      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
