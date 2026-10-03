"use client";

import { SHORTCUT_GROUPS, type KeyPress } from "@/lib/keyboard";
import styles from "./TabEditor.module.css";

/**
 * Tunt skal: kortkommandona som knappar, med kortkommandot bredvid. En knapp gör samma
 * tangenttryck som kortkommandot via `onPress`, så att knappen och tangenten gör samma sak.
 */
export function ShortcutButtons({ onPress }: { onPress: (press: KeyPress) => void }) {
  return (
    <details className={styles.help} open>
      <summary>Edit</summary>
      {SHORTCUT_GROUPS.map(({ name, shortcuts }) => (
        <section key={name} className={styles.shortcutGroup} aria-label={name}>
          <h3>{name}</h3>
          <div className={styles.shortcuts}>
            {shortcuts.map(({ press, label, symbol, keys, description }) => (
              <span key={keys ?? label} className={styles.shortcut}>
                <button
                  type="button"
                  className={symbol ? styles.symbol : undefined}
                  title={keys ? `${description} (${keys})` : description}
                  aria-label={description}
                  // Fokus stannar där det var, så att tangentbordet fortsätter att styra editorn
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) =>
                    onPress({ ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...press, timeStamp: e.timeStamp })
                  }
                >
                  {label}
                </button>
                {keys && <kbd>{keys}</kbd>}
              </span>
            ))}
          </div>
        </section>
      ))}
    </details>
  );
}
