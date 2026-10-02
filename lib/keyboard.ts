import type { Command } from "./editor";

/** Tunt tangentbordsskal: översätter en tangent till ett Editor-kommando. */
export function keyToCommand(key: string): Command | null {
  switch (key) {
    case "ArrowUp":
      return { type: "moveCursor", direction: "up" };
    case "ArrowDown":
      return { type: "moveCursor", direction: "down" };
    case "ArrowLeft":
      return { type: "moveCursor", direction: "left" };
    case "ArrowRight":
      return { type: "moveCursor", direction: "right" };
  }
  if (/^[0-9]$/.test(key)) return { type: "enterFret", fret: Number(key) };
  return null;
}
