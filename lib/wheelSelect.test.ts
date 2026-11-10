import { describe, expect, it } from "vitest";
import { WHEEL_STEP, wheelSelection } from "./wheelSelect";

const options = (count: number, disabled: number[] = []) => Array.from({ length: count }, (_, i) => disabled.includes(i));

describe("att skrolla i en dropdown", () => {
  it("går ett alternativ nedåt eller uppåt per hack i hjulet", () => {
    expect(wheelSelection({ index: 2, disabled: options(5), pending: 0, delta: WHEEL_STEP })).toEqual({ index: 3, pending: 0 });
    expect(wheelSelection({ index: 2, disabled: options(5), pending: 0, delta: -WHEEL_STEP })).toEqual({ index: 1, pending: 0 });
  });

  it("samlar små rörelser från en touchpad tills de blir ett helt steg", () => {
    const first = wheelSelection({ index: 0, disabled: options(5), pending: 0, delta: WHEEL_STEP / 2 });
    expect(first).toEqual({ index: 0, pending: WHEEL_STEP / 2 });
    expect(wheelSelection({ index: 0, disabled: options(5), pending: first.pending, delta: WHEEL_STEP / 2 })).toEqual({ index: 1, pending: 0 });
  });

  it("går flera alternativ vid en stor rörelse", () => {
    expect(wheelSelection({ index: 0, disabled: options(5), pending: 0, delta: 3 * WHEEL_STEP }).index).toBe(3);
  });

  it("stannar vid första och sista alternativet", () => {
    expect(wheelSelection({ index: 4, disabled: options(5), pending: 0, delta: WHEEL_STEP }).index).toBe(4);
    expect(wheelSelection({ index: 0, disabled: options(5), pending: 0, delta: -WHEEL_STEP }).index).toBe(0);
  });

  it("hoppar över avstängda alternativ", () => {
    expect(wheelSelection({ index: 0, disabled: options(5, [1, 2]), pending: 0, delta: WHEEL_STEP }).index).toBe(3);
    expect(wheelSelection({ index: 1, disabled: options(3, [2]), pending: 0, delta: WHEEL_STEP }).index).toBe(1);
  });

  it("väljer det första alternativet när inget är valt", () => {
    expect(wheelSelection({ index: -1, disabled: options(3), pending: 0, delta: WHEEL_STEP }).index).toBe(0);
  });
});
