/**
 * Att skrolla igenom en dropdowns alternativ med musen över den, utan att öppna den. Ren logik;
 * komponenten `WheelSelect` kopplar den till hela sajten.
 */

/** Hjulrörelsen i pixlar som blir ett steg, ungefär ett hack på ett vanligt mushjul. */
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
 * Alternativet efter hjulrörelsen: ett steg per `WHEEL_STEP`, förbi avstängda alternativ, och
 * stopp vid första och sista. Små rörelser, t.ex. från en touchpad, sparas tills de blir ett steg.
 */
export function wheelSelection({ index, disabled, pending, delta }: WheelInput): { index: number; pending: number } {
  const total = pending + delta;
  const steps = Math.trunc(total / WHEEL_STEP);
  const rest = total - steps * WHEEL_STEP;
  const direction = Math.sign(steps);
  let current = index;
  for (let i = 0; i < Math.abs(steps); i++) {
    let next = current + direction;
    while (next >= 0 && next < disabled.length && disabled[next]) next += direction;
    if (next < 0 || next >= disabled.length) break;
    current = next;
  }
  return { index: current, pending: rest };
}
