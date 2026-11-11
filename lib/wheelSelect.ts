/**
 * Att skrolla igenom en dropdowns alternativ, eller ändra ett tal, med musen över fältet. Ren
 * logik; `WheelSelect` och `useWheelNumber` kopplar den till sidorna.
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
 * Steget efter en hjulrörelse: −1, 0 eller 1, alltså högst ett steg per rörelse. Ett hack ger ett
 * steg hur stort det än är, t.ex. med skalad skärm. Små rörelser, t.ex. från en touchpad, sparas
 * i `pending` tills de blir `WHEEL_STEP`.
 */
export function wheelStep(pending: number, delta: number): { step: number; pending: number } {
  const total = pending + delta;
  if (Math.abs(total) < WHEEL_STEP) return { step: 0, pending: total };
  return { step: Math.sign(total), pending: 0 };
}

/** Alternativet efter hjulrörelsen: högst ett steg, förbi avstängda alternativ, och stopp vid första och sista. */
export function wheelSelection({ index, disabled, pending, delta }: WheelInput): { index: number; pending: number } {
  const { step, pending: rest } = wheelStep(pending, delta);
  if (step === 0) return { index, pending: rest };
  let next = index + step;
  while (next >= 0 && next < disabled.length && disabled[next]) next += step;
  return { index: next >= 0 && next < disabled.length ? next : index, pending: rest };
}
