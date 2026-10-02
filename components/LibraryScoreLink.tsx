"use client";

import type { ReactNode } from "react";
import { browserStorage, loadDraft, replacingLosesWork } from "@/lib/draft";

/**
 * Länken från Bibliotekets lista till editorn. Partituret ersätter Utkastet, så har Utkastet
 * ändringar som varken är nedladdade eller sparade frågar den först.
 */
export function LibraryScoreLink({ id, revision, children }: { id: string; revision: number; children: ReactNode }) {
  return (
    // Vanlig länk: editorn läser Utkastet när sidan laddas
    <a
      href={`/tab-editor?score=${id}`}
      onClick={(event) => {
        const draft = loadDraft(browserStorage());
        if (
          replacingLosesWork(draft, { id, revision }) &&
          !confirm("The score in the editor has changes that haven't been saved or downloaded. Open this score anyway?")
        ) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </a>
  );
}
