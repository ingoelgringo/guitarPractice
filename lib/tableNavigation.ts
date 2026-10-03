/**
 * Nästa index längs en axel i Flikens tabell när en piltangent trycks: ett steg, och runt till andra
 * kanten vid den sista eller första. Utan valt index (-1) blir det det första.
 */
export function stepAround(index: number, delta: number, count: number): number {
  return index < 0 ? 0 : (index + delta + count) % count;
}
