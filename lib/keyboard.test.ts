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

describe("Notvärde och Skjutning", () => {
  it("en Notvärdestangent sätter Notvärdet, och med Shift Skjuts allt efter", () => {
    expect(keyToCommand(press("s"))).toEqual({ type: "setDuration", duration: 16 });
    expect(keyToCommand(press("S", { shiftKey: true }))).toEqual({ type: "setDuration", duration: 16, shift: true });
    expect(keyToCommand(press("W", { shiftKey: true }))).toEqual({ type: "setDuration", duration: 1, shift: true });
  });

  it("Caps Lock utan Shift Skjuter inget", () => {
    expect(keyToCommand(press("Q"))).toEqual({ type: "setDuration", duration: 4 });
  });

  it("I och Insert infogar ett Slag", () => {
    expect(keyToCommand(press("i"))).toEqual({ type: "insertBeat" });
    expect(keyToCommand(press("I", { shiftKey: true }))).toEqual({ type: "insertBeat" });
    expect(keyToCommand(press("Insert"))).toEqual({ type: "insertBeat" });
  });

  it("det finns en knapp för att infoga ett Slag", () => {
    const shortcuts = SHORTCUT_GROUPS.flatMap((group) => group.shortcuts);

    expect(shortcuts.map((s) => keyToCommand(press(s.press.key, s.press)))).toContainEqual({ type: "insertBeat" });
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

  it("kortkommandot skrivs inte bredvid knappen när det är samma tecken som på knappen", () => {
    for (const shortcut of shortcuts) expect(shortcut.keys, shortcut.description).not.toBe(shortcut.label);
    const arrows = shortcuts.filter((s) => s.press.key.startsWith("Arrow") && !s.press.shiftKey);
    expect(arrows).toHaveLength(4);
    for (const arrow of arrows) expect(arrow.keys).toBeUndefined();
  });

  it("andra knappar har kvar kortkommandot bredvid sig", () => {
    const byKey = (key: string) => shortcuts.find((s) => s.press.key === key && !s.press.shiftKey && !s.press.ctrlKey);

    expect(byKey("s")?.keys).toBe("S");
    expect(byKey(".")?.keys).toBe(".");
    expect(byKey("[")?.keys).toBe("[");
  });

  it("alla tio siffror, alla Notvärden och ångra/gör om finns som knappar", () => {
    const keys = shortcuts.map((s) => s.press.key);

    expect(keys).toEqual(expect.arrayContaining(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]));
    expect(keys).toEqual(expect.arrayContaining(["w", "h", "q", "e", "s", "t"]));
    expect(shortcuts.map(action)).toEqual(expect.arrayContaining([{ type: "undo" }, { type: "redo" }]));
  });
});
