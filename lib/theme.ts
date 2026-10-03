export type Theme = "light" | "dark";

/** Nyckeln i `localStorage` och attributet på `<html>`. Utan sparat val följer temat systemet. */
export const THEME_STORAGE_KEY = "theme";
export const THEME_ATTRIBUTE = "data-theme";

/** Det sparade valet, eller `null` när inget giltigt val är gjort. */
export function storedTheme(value: string | null): Theme | null {
  return value === "light" || value === "dark" ? value : null;
}

/** Temat som syns: valet om det finns, annars systemets. */
export function activeTheme(stored: Theme | null, systemPrefersDark: boolean): Theme {
  return stored ?? (systemPrefersDark ? "dark" : "light");
}

/** Temat efter en växling: motsatsen till det som syns. */
export function toggledTheme(stored: Theme | null, systemPrefersDark: boolean): Theme {
  return activeTheme(stored, systemPrefersDark) === "dark" ? "light" : "dark";
}

/** Körs i `<head>` före första målningen, så att ett sparat val inte blinkar fram efter systemets tema. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("${THEME_ATTRIBUTE}",t)}catch(e){}})()`;
