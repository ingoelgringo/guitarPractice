import type { Command, Direction } from "./editor";
import type { Duration } from "./score";

const ARROW_KEYS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

/** Tangent, Notvärde och namn i hjälprutan. Tangenterna gäller oavsett skiftläge. */
const DURATION_KEYS: readonly { key: string; duration: Duration; name: string }[] = [
  { key: "w", duration: 1, name: "Whole note" },
  { key: "h", duration: 2, name: "Half note" },
  { key: "q", duration: 4, name: "Quarter note" },
  { key: "e", duration: 8, name: "Eighth note" },
  { key: "s", duration: 16, name: "Sixteenth note" },
  { key: "t", duration: 32, name: "Thirty-second note" },
];

/** Tunt tangentbordsskal: översätter en tangent till ett Editor-kommando. `time` är tangenttryckets tid i ms. */
export function keyToCommand(key: string, time: number): Command | null {
  if (Object.hasOwn(ARROW_KEYS, key)) return { type: "moveCursor", direction: ARROW_KEYS[key] };
  if (/^[0-9]$/.test(key)) return { type: "typeDigit", digit: Number(key), time };
  if (key === ".") return { type: "toggleDot" };
  if (key === "/") return { type: "toggleTriplet" };
  const lower = key.toLowerCase();
  if (lower === "r") return { type: "insertRest" };
  const duration = DURATION_KEYS.find((d) => d.key === lower);
  return duration ? { type: "setDuration", duration: duration.duration } : null;
}

/** Kortkommandona som de visas i editorns hjälpruta. */
export const SHORTCUTS: readonly { keys: string; action: string }[] = [
  { keys: "← → ↑ ↓", action: "Move cursor between beats and strings" },
  { keys: "0–9", action: "Enter fret (type two digits quickly for 10–24)" },
  ...DURATION_KEYS.map(({ key, name }) => ({ keys: key.toUpperCase(), action: name })),
  { keys: ".", action: "Toggle dotted" },
  { keys: "/", action: "Toggle triplet" },
  { keys: "R", action: "Insert rest and move on" },
];
