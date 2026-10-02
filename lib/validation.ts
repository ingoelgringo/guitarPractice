import { barCapacity, barTicks, type Score, timeSignatureAt } from "./score";

export interface InvalidBar {
  track: number;
  bar: number;
  problem: "tooShort" | "tooLong";
}

/**
 * Härledd validering: pekar ut Takter vars slag inte fyller den taktart som gäller där exakt.
 * Ingenting rättas, det är upp till användaren. Den sista Takten i ett Spår får vara
 * för kort, eftersom det är där man skriver (men inte för lång).
 */
export function invalidBars(score: Score): InvalidBar[] {
  return score.tracks.flatMap((track, trackIndex) =>
    track.bars.flatMap((bar, barIndex): InvalidBar[] => {
      const capacity = barCapacity(timeSignatureAt(score, trackIndex, barIndex));
      const ticks = barTicks(bar);
      const isLast = barIndex === track.bars.length - 1;
      if (ticks > capacity) return [{ track: trackIndex, bar: barIndex, problem: "tooLong" }];
      if (ticks < capacity && !isLast) return [{ track: trackIndex, bar: barIndex, problem: "tooShort" }];
      return [];
    }),
  );
}
