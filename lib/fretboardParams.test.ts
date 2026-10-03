import { describe, expect, it } from "vitest";
import { choiceFromParams, choiceToParams } from "./fretboardParams";

describe("Greppbrädans val i adressen", () => {
  it("utan parametrar blir valet A mollpentatonik", () => {
    expect(choiceFromParams(new URLSearchParams())).toEqual({ root: 9, scale: "minorPentatonic", labels: "interval" });
  });

  it("läser Grundton och Skala", () => {
    expect(choiceFromParams(new URLSearchParams("root=Eb&scale=blues"))).toEqual({ root: 3, scale: "blues", labels: "interval" });
  });

  it("ogiltiga värden faller tillbaka var för sig", () => {
    expect(choiceFromParams(new URLSearchParams("root=X&scale=major"))).toEqual({ root: 9, scale: "major", labels: "interval" });
    expect(choiceFromParams(new URLSearchParams("root=C&scale=lydian"))).toEqual({ root: 0, scale: "minorPentatonic", labels: "interval" });
  });

  it("Grundtonen tolkas utan hänsyn till skiftläge och med korsförtecken", () => {
    expect(choiceFromParams(new URLSearchParams("root=eb")).root).toBe(3);
    expect(choiceFromParams(new URLSearchParams("root=F%23")).root).toBe(6);
  });

  it("etikettläget tonnamn ligger i adressen, intervall är standard", () => {
    expect(choiceFromParams(new URLSearchParams("labels=notes")).labels).toBe("noteName");
    expect(choiceFromParams(new URLSearchParams("labels=x")).labels).toBe("interval");
  });

  it("Ackordet ligger i adressen som steg, och saknas när inget Ackord är valt", () => {
    expect(choiceFromParams(new URLSearchParams("chord=2")).chord).toBe(2);
    expect(choiceFromParams(new URLSearchParams()).chord).toBeUndefined();
    expect(choiceFromParams(new URLSearchParams("chord=ii")).chord).toBeUndefined();
    expect(choiceToParams({ root: 0, scale: "major", labels: "interval", chord: 5 }).get("chord")).toBe("5");
    expect(choiceToParams({ root: 0, scale: "major", labels: "interval" }).has("chord")).toBe(false);
  });

  it("Boxen ligger i adressen, och saknas när ingen Box är vald", () => {
    expect(choiceFromParams(new URLSearchParams("box=3")).box).toBe(3);
    expect(choiceFromParams(new URLSearchParams("box=x")).box).toBeUndefined();
    expect(choiceToParams({ root: 0, scale: "major", labels: "interval", box: 2 }).get("box")).toBe("2");
    expect(choiceToParams({ root: 0, scale: "major", labels: "interval" }).has("box")).toBe(false);
  });

  it("skriver valet som läsbara parametrar", () => {
    expect(choiceToParams({ root: 10, scale: "naturalMinor", labels: "interval" }).toString()).toBe(
      "root=Bb&scale=natural-minor&labels=intervals",
    );
  });

  it("ett val överlever en tur via adressen", () => {
    const choice = { root: 6, scale: "majorPentatonic", labels: "noteName", chord: 4, box: 5 } as const;

    expect(choiceFromParams(choiceToParams(choice))).toEqual(choice);
  });
});
