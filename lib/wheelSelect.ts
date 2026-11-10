/**
 * Att skrolla igenom en dropdowns alternativ med musen över den, utan att öppna den. Ren logik;
 * komponenten `WheelSelect` kopplar den till hela sajten.
 */

/** Den minsta hjulrörelsen i pixlar som blir ett steg, ungefär ett hack på ett vanligt mushjul. */
export const WHEEL_STEP = 100;

export interface WheelInput {
  /** Det valda alternativet, eller −1 när inget är valt. */
  index: number;
  /** Vilka alternativ som är avstängda, ett per alternativ. */
  disabled: readonly boolean[];
  /** Rörelse som ännu inte blivit ett helt steg. */
  pending: number;
  /** Den nya rörelsen, positiv nedåt. */
  delta: number;
}

/**
 * Alternativet efter hjulrörelsen: högst ett steg per rörelse, förbi avstängda alternativ, och
 * stopp vid första och sista. Ett hack ger alltså ett steg hur stort det än är, t.ex. med skalad
 * skärm. Små rörelser, t.ex. från en touchpad, sparas tills de blir `WHEEL_STEP`.
 */
export function wheelSelection({ index, disabled, pending, delta }: WheelInput): { index: number; pending: number } {
  const total = pending + delta;
  if (Math.abs(total) < WHEEL_STEP) return { index, pending: total };
  const direction = Math.sign(total);
  let next = index + direction;
  while (next >= 0 && next < disabled.length && disabled[next]) next += direction;
  return { index: next >= 0 && next < disabled.length ? next : index, pending: 0 };
}
