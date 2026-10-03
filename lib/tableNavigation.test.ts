import { describe, expect, it } from "vitest";
import { stepAround } from "./tableNavigation";

describe("Piltangenterna i Flikens tabell", () => {
  it("flyttar ett steg åt gången", () => {
    expect(stepAround(2, 1, 7)).toBe(3);
    expect(stepAround(2, -1, 7)).toBe(1);
  });

  it("går runt vid kanten: nedåt från sista raden till den första och uppåt från den första till den sista", () => {
    expect(stepAround(6, 1, 7)).toBe(0);
    expect(stepAround(0, -1, 7)).toBe(6);
  });

  it("utan valt index blir det det första, åt båda hållen", () => {
    expect(stepAround(-1, 1, 5)).toBe(0);
    expect(stepAround(-1, -1, 5)).toBe(0);
  });
});
