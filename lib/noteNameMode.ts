/**
 * Notnamnsläget: svenskt (H, och B för B♭) eller engelskt. Ett val för hela sajten, sparat per
 * webbläsare och engelskt tills man väljer något annat. Det ligger inte i adressen.
 */
export type NoteNameMode = "swedish" | "english";

export const DEFAULT_NOTE_NAME_MODE: NoteNameMode = "english";

/** Den gemensamma nyckeln i `localStorage`. */
export const NOTE_NAME_MODE_KEY = "guitarPractice.noteNames";
/** Greppbrädans nyckel från innan läget blev gemensamt. Den läses så att ingen tappar sitt val. */
export const LEGACY_FRETBOARD_NOTE_NAME_KEY = "guitarPractice.fretboard.noteNames";

/** Den del av `localStorage` som Notnamnsläget använder. */
export type NoteNameStorage = Pick<Storage, "getItem" | "setItem">;

function storedMode(value: string | null): NoteNameMode | null {
  return value === "swedish" || value === "english" ? value : null;
}

/** Det sparade Notnamnsläget, med Greppbrädans gamla nyckel som fallback och annars förvalet. */
export function readNoteNameMode(storage: NoteNameStorage | null): NoteNameMode {
  try {
    return (
      storedMode(storage?.getItem(NOTE_NAME_MODE_KEY) ?? null) ??
      storedMode(storage?.getItem(LEGACY_FRETBOARD_NOTE_NAME_KEY) ?? null) ??
      DEFAULT_NOTE_NAME_MODE
    );
  } catch {
    return DEFAULT_NOTE_NAME_MODE;
  }
}

/** Sparar Notnamnsläget. Utan fungerande lagring gäller valet bara tills sidan laddas om. */
export function saveNoteNameMode(storage: NoteNameStorage | null, mode: NoteNameMode): void {
  try {
    storage?.setItem(NOTE_NAME_MODE_KEY, mode);
  } catch {
    // Inget att göra
  }
}
