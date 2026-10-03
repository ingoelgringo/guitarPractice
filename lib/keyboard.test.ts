import { describe, expect, it } from "vitest";
import { keyToBeatText, keyToCommand, SHORTCUT_GROUPS, type KeyPress } from "./keyboard";

function press(key: string, modifiers: Partial<KeyPress> = {}): KeyPress {
  return { key, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, timeStamp: 0, ...modifiers };
}

describe("textfälten för Ackordnamn och Anteckning", () => {
  it("C öppnar Ackordnamnet och A Anteckningen, oavsett skiftläge", () => {
    expect(keyToBeatText(press("c"))).toBe("chordName");
    expect(keyToBeatText(press("C", { shiftKey: true }))).toBe("chordName");
    expect(keyToBeatText(press("a"))).toBe("annotation");
  });

  it("Ctrl+C kopierar fortfarande och öppnar inget fält", () => {
    expect(keyToBeatText(press("c", { ctrlKey: true }))).toBeNull();
    expect(keyToCommand(press("c", { ctrlKey: true }))).toEqual({ type: "copy" });
  });

  it("andra tangenter öppnar inget fält", () => {
    expect(keyToBeatText(press("q"))).toBeNull();
    expect(keyToBeatText(press("a", { altKey: true }))).toBeNull();
  });
});

describe("knapparna för kortkommandona", () => {
  const shortcuts = SHORTCUT_GROUPS.flatMap((group) => group.shortcuts);

  /** Det som knappen gör: samma som tangenttrycket. */
  function action(shortcut: (typeof shortcuts)[number]) {
    const p = press(shortcut.press.key, shortcut.press);
    return keyToBeatText(p) ?? keyToCommand(p);
  }

  it("varje knapp gör något, och samma sak som sitt kortkommando", () => {
    for (const shortcut of shortcuts) expect(action(shortcut), shortcut.label).not.toBeNull();
  });

  it("inga två knappar gör samma sak", () => {
    const actions = shortcuts.map((shortcut) => JSON.stringify(action(shortcut)));

    expect(new Set(actions).size).toBe(actions.length);
  });

  it("varje knapp har en etikett och en beskrivning", () => {
    for (const shortcut of shortcuts) {
      expect(shortcut.label.trim()).not.toBe("");
      expect(shortcut.description.trim()).not.toBe("");
    }
  });

  it("alla tio siffror, alla Notvärden och ångra/gör om finns som knappar", () => {
    const keys = shortcuts.map((s) => s.press.key);

    expect(keys).toEqual(expect.arrayContaining(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]));
    expect(keys).toEqual(expect.arrayContaining(["w", "h", "q", "e", "s", "t"]));
    expect(shortcuts.map(action)).toEqual(expect.arrayContaining([{ type: "undo" }, { type: "redo" }]));
  });
});
