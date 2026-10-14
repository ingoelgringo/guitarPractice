"use client";

import { useState, type ReactNode } from "react";
import styles from "./TabEditor.module.css";

const TABS = [
  { id: "edit", name: "Edit" },
  { id: "settings", name: "Score settings" },
] as const;

type PanelTab = (typeof TABS)[number]["id"];

/**
 * Tunt skal: sidopanelen längs högerkanten med flikarna Edit och Score settings. Ihopfälld är den
 * bara flikarna, och en flik öppnar den igen. Flikknapparna tar inte fokus, så att tangentbordet
 * fortsätter att styra editorn (piltangenterna flyttar Markören, inte mellan flikarna).
 */
export function EditorPanel({ edit, settings }: { edit: ReactNode; settings: ReactNode }) {
  const [tab, setTab] = useState<PanelTab>("edit");
  const [open, setOpen] = useState(true);

  return (
    <aside className={styles.panel} data-open={open || undefined} aria-label="Editor panel">
      <div className={styles.panelHeader}>
        <div role="tablist" aria-label="Panel" className={styles.panelTabs}>
          {TABS.map(({ id, name }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`panel-tab-${id}`}
              aria-selected={open && id === tab}
              aria-controls={`panel-${id}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setTab(id);
                setOpen(true);
              }}
            >
              {name}
            </button>
          ))}
        </div>
        {open && (
          <button
            type="button"
            className={styles.panelClose}
            title="Hide panel"
            aria-label="Hide panel"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpen(false)}
          >
            »
          </button>
        )}
      </div>
      {/* Båda flikarna står kvar, så att ett textfält som inte är klart inte försvinner vid flikbyte */}
      {TABS.map(({ id }) => (
        <div
          key={id}
          id={`panel-${id}`}
          role="tabpanel"
          aria-labelledby={`panel-tab-${id}`}
          className={styles.panelContent}
          hidden={!open || id !== tab}
        >
          {id === "edit" ? edit : settings}
        </div>
      ))}
    </aside>
  );
}
