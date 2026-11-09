"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { LibraryFailure } from "@/lib/libraryClient";
import { LibrarySync } from "@/lib/librarySync";
import type { Messages } from "@/lib/messages";
import { newProgression, type Progression } from "@/lib/progression";
import { type ProgressionDraft, progressionReplacingLosesWork, serializeProgression } from "@/lib/progressionDraft";
import {
  addProgressionToLibrary,
  copyName,
  deleteProgressionFromLibrary,
  duplicateProgressionInLibrary,
  listProgressionsInLibrary,
  loadProgressionFromLibrary,
  type ProgressionListEntry,
  renameProgressionInLibrary,
  saveProgressionToLibrary,
} from "@/lib/progressionLibraryClient";
import { currentProgressionDraft, replaceProgressionDraft, setDraftLibrary } from "./useProgressionDraft";

/** En synk för `progression`, där revisionen i Biblioteket är `savedText`, eller okänd med null. */
function syncFor(id: string, revision: number, progression: Progression, savedText: string | null): LibrarySync<Progression> {
  return new LibrarySync({
    id,
    revision,
    savedText,
    document: progression,
    serialize: serializeProgression,
    save: saveProgressionToLibrary,
  });
}

const noSubscription = () => () => {};

/** Ett begripligt meddelande när ett anrop till Biblioteket inte gick att göra. */
function errorMessage(failure: LibraryFailure, messages: Messages): string {
  switch (failure.reason) {
    case "unauthorized":
      return messages.libraryLoggedOut;
    case "notFound":
      return messages.progressionNotFound;
    case "conflict":
    case "failed":
      return messages.libraryUnreachable;
  }
}

/**
 * Ägarens Ackordföljder i Biblioteket: listan, den automatiska sparningen av den Ackordföljd som är
 * öppen (Bibliotekssynken i `lib/librarySync.ts`) och valen vid en Konflikt. Utkastet minns vilken
 * Ackordföljd i Biblioteket det är, så att sparningen fortsätter efter en omladdning.
 */
export function useProgressionLibrary(
  draft: ProgressionDraft,
  /** Listan för Ägaren, eller null för en Gäst, som inte når Biblioteket. */
  initialEntries: ProgressionListEntry[] | null,
  messages: Messages,
) {
  const owner = initialEntries !== null;
  const [entries, setEntries] = useState(initialEntries ?? []);
  const [sync, setSync] = useState(() =>
    draft.library
      ? syncFor(
          draft.library.id,
          draft.library.revision,
          draft.progression,
          draft.library.saved ? serializeProgression(draft.progression) : null,
        )
      : null,
  );
  const syncState = useSyncExternalStore(
    sync?.subscribe ?? noSubscription,
    () => sync?.state ?? null,
    () => null,
  );
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const progression = draft.progression;

  useEffect(() => {
    if (!sync) return;
    sync.start();
    return () => sync.stop();
  }, [sync]);

  useEffect(() => {
    sync?.edit(progression);
  }, [sync, progression]);

  // Utkastet följer synken, så att en omladdning fortsätter där den slutade
  useEffect(() => {
    setDraftLibrary(syncState ? { id: syncState.id, revision: syncState.revision, saved: syncState.saved } : undefined);
  }, [syncState]);

  useEffect(() => {
    if (!sync) return;
    const flush = () => sync.flush();
    // Sista ändringen sparas direkt när fliken döljs eller stängs, och när nätet kommer tillbaka
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") flush();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);
    window.addEventListener("online", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("online", flush);
    };
  }, [sync]);

  // Listan visar senast ändrad, så den läses om efter varje sparning
  const savedRevision = syncState?.revision;
  useEffect(() => {
    if (savedRevision === undefined || !owner) return;
    let cancelled = false;
    void listProgressionsInLibrary().then((result) => {
      if (!cancelled && result.ok) setEntries(result.progressions);
    });
    return () => {
      cancelled = true;
    };
  }, [savedRevision, owner]);

  async function refresh() {
    const result = await listProgressionsInLibrary();
    if (result.ok) setEntries(result.progressions);
  }

  /** Kör ett anrop till Biblioteket, visar felet om det inte gick och läser om listan. */
  async function run<T extends { ok: true }>(action: () => Promise<T | LibraryFailure>, onDone?: (result: T) => void) {
    setPending(true);
    setMessage(null);
    const result = await action();
    setPending(false);
    if (result.ok) onDone?.(result);
    else setMessage(errorMessage(result, messages));
    await refresh();
  }

  /**
   * Byter till en annan synk. Den gamla stoppas först, så att den inte hinner spara den nya
   * Ackordföljden under fel id innan React har renderat med den nya.
   */
  function switchSync(next: LibrarySync<Progression>) {
    sync?.stop();
    setSync(next);
  }

  /** Byter ut Utkastet mot en Ackordföljd i Biblioteket och sparar den framöver. */
  function openStored(id: string, revision: number, next: Progression) {
    const savedText = serializeProgression(next);
    switchSync(syncFor(id, revision, next, savedText));
    replaceProgressionDraft({ progression: next, library: { id, revision, saved: true } });
  }

  /**
   * Börjar spara Ackordföljden i editorn som den nya posten `id`, där `added` är det som sparades.
   * Ändringar som gjordes medan anropet pågick finns kvar och sparas strax.
   */
  function attach(id: string, revision: number, added: Progression) {
    const current = currentProgressionDraft().progression;
    switchSync(syncFor(id, revision, current, serializeProgression(added)));
  }

  /** Frågar först när Utkastet har Ackord som går förlorade. */
  function mayReplace(target: { id: string; revision: number }): boolean {
    const current = { progression, library: syncState ?? undefined };
    return !progressionReplacingLosesWork(current, target) || confirm(messages.confirmReplaceProgression);
  }

  function askName(question: string, suggestion: string): string | null {
    const name = prompt(question, suggestion)?.trim();
    return name ? name : null;
  }

  const openName = entries.find((entry) => entry.id === syncState?.id)?.name ?? null;

  return {
    entries,
    syncState,
    openName,
    pending,
    message,
    dismissMessage: () => setMessage(null),

    /** Lägger Ackordföljden i editorn i Biblioteket. */
    add() {
      const name = askName(messages.progressionNamePrompt, messages.untitledProgression);
      if (!name) return;
      const added = progression;
      void run(
        () => addProgressionToLibrary(name, added),
        (result) => attach(result.id, result.revision, added),
      );
    },

    /** Börjar på en ny Ackordföljd i Biblioteket. */
    createNew() {
      if (!mayReplace({ id: "", revision: 0 })) return;
      const name = askName(messages.progressionNamePrompt, messages.untitledProgression);
      if (!name) return;
      const fresh = newProgression();
      void run(
        () => addProgressionToLibrary(name, fresh),
        (result) => openStored(result.id, result.revision, fresh),
      );
    },

    open(entry: ProgressionListEntry) {
      // Är den redan öppen fortsätter arbetet med den
      if (syncState?.id === entry.id && syncState.status !== "conflict") return;
      if (!mayReplace(entry)) return;
      void run(
        () => loadProgressionFromLibrary(entry.id),
        (result) => openStored(entry.id, result.revision, result.progression),
      );
    },

    rename(entry: ProgressionListEntry) {
      const name = askName(messages.progressionRenamePrompt, entry.name);
      if (!name || name === entry.name) return;
      void run(() => renameProgressionInLibrary(entry.id, name));
    },

    duplicate(entry: ProgressionListEntry) {
      void run(() => duplicateProgressionInLibrary(entry.id));
    },

    remove(entry: ProgressionListEntry) {
      if (!confirm(messages.confirmDelete(entry.name))) return;
      void run(
        () => deleteProgressionFromLibrary(entry.id),
        // Ackordföljden i editorn ligger kvar i Utkastet, men utanför Biblioteket
        () => {
          if (sync && syncState?.id === entry.id) {
            sync.stop();
            setSync(null);
          }
        },
      );
    },

    /** Ladda om: tar den sparade versionen och släpper ändringarna. */
    reload() {
      if (!syncState) return;
      const { id } = syncState;
      void run(
        () => loadProgressionFromLibrary(id),
        (result) => openStored(id, result.revision, result.progression),
      );
    },

    /** Spara som kopia: en ny Ackordföljd i Biblioteket med ändringarna. Originalet lämnas orört. */
    saveCopy() {
      const mine = progression;
      void run(
        () => addProgressionToLibrary(copyName(openName ?? messages.untitledProgression), mine),
        (result) => attach(result.id, result.revision, mine),
      );
    },

    /** Skriv över: sparar oavsett vad som har sparats på andra flikar eller enheter. */
    overwrite() {
      sync?.overwrite();
    },
  };
}
