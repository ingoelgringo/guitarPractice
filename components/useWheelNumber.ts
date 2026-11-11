"use client";

import { type RefObject, useEffect, useRef } from "react";
import { WHEEL_STEP, wheelStep } from "@/lib/wheelSelect";

/**
 * Hjulet över fältet ändrar talet ett steg per hack: uppåt ökar, nedåt minskar. `onStep` får +1
 * eller −1 och sparar värdet direkt. Sidan skrollar inte samtidigt.
 */
export function useWheelNumber(field: RefObject<HTMLInputElement | null>, onStep: (step: 1 | -1) => void) {
  const latest = useRef(onStep);
  useEffect(() => {
    latest.current = onStep;
  });

  useEffect(() => {
    const element = field.current;
    if (!element) return;
    let pending = 0;
    function onWheel(event: WheelEvent) {
      if (element!.disabled) return;
      event.preventDefault();
      const scale = event.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? 1 : WHEEL_STEP;
      const next = wheelStep(pending, event.deltaY * scale);
      pending = next.pending;
      if (next.step !== 0) latest.current(next.step > 0 ? -1 : 1);
    }
    // Inte passiv, så att sidan inte skrollar samtidigt.
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [field]);
}
