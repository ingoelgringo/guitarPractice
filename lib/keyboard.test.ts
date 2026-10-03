import { describe, expect, it } from "vitest";
import { keyToBeatText, keyToCommand, type KeyPress } from "./keyboard";

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
