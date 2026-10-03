"use client";

import { useLayoutEffect } from "react";
import { THEME_ATTRIBUTE, THEME_STORAGE_KEY, storedTheme, toggledTheme, type Theme } from "@/lib/theme";
import styles from "./ThemeToggle.module.css";

function readStoredTheme(): Theme | null {
  try {
    return storedTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return null;
  }
}

/**
 * Växlar mellan ljust och mörkt tema. Utan gjort val följer sidan systemet. Ikonen väljs i CSS
 * utifrån attributet på `<html>`, så att servern och klienten renderar samma sak.
 */
export function ThemeToggle() {
  // React tar bort attributet vid ommonteringen i Strict Mode under utveckling. I produktion gör detta ingenting.
  useLayoutEffect(() => {
    const theme = readStoredTheme();
    if (theme) document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
  }, []);

  function toggle() {
    const next = toggledTheme(readStoredTheme(), matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute(THEME_ATTRIBUTE, next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Valet gäller då bara tills sidan laddas om.
    }
  }

  return (
    <button type="button" className={styles.toggle} onClick={toggle} aria-label="Toggle light/dark theme" title="Toggle light/dark theme">
      <svg className={styles.moon} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      <svg className={styles.sun} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
