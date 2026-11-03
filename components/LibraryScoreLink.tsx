"use client";

import type { ReactNode } from "react";
import { withBasePath } from "@/lib/basePath";
import { browserStorage, loadDraft, replacingLosesWork } from "@/lib/draft";

/**
 * Länken från Bibliotekets lista till editorn. Partituret ersätter Utkastet, så har Utkastet
 * ändringar som varken är nedladdade eller sparade frågar den först.
 */
export function LibraryScoreLink({
  id,
  revision,
  confirmMessage,
  children,
}: {
  id: string;
  revision: number;
  /** Frågan på Sajtspråket när Utkastet har osparade ändringar. */
  confirmMessage: string;
  children: ReactNode;
}) {
  return (
    // Vanlig länk: editorn läser Utkastet när sidan laddas
    <a
      href={withBasePath(`/tab-editor?score=${id}`)}
      onClick={(event) => {
        const draft = loadDraft(browserStorage());
        if (
          replacingLosesWork(draft, { id, revision }) &&
          !confirm(confirmMessage)
        ) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </a>
  );
}
