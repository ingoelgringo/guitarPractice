import { describe, expect, it } from "vitest";
import { activeTheme, storedTheme, toggledTheme } from "./theme";

describe("det sparade temat", () => {
  it("godtar ljust och mörkt", () => {
    expect(storedTheme("light")).toBe("light");
    expect(storedTheme("dark")).toBe("dark");
  });

  it("allt annat betyder att inget val är gjort", () => {
    expect(storedTheme(null)).toBeNull();
    expect(storedTheme("")).toBeNull();
    expect(storedTheme("blue")).toBeNull();
  });
});

describe("temat som syns", () => {
  it("följer systemet när inget val är gjort", () => {
    expect(activeTheme(null, false)).toBe("light");
    expect(activeTheme(null, true)).toBe("dark");
  });

  it("ett gjort val går före systemet", () => {
    expect(activeTheme("light", true)).toBe("light");
    expect(activeTheme("dark", false)).toBe("dark");
  });
});

describe("växlingen", () => {
  it("byter till motsatsen av det som syns", () => {
    expect(toggledTheme(null, false)).toBe("dark");
    expect(toggledTheme(null, true)).toBe("light");
    expect(toggledTheme("dark", false)).toBe("light");
    expect(toggledTheme("light", true)).toBe("dark");
  });
});
