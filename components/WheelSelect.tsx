"use client";

import { useEffect } from "react";
import { WHEEL_STEP, wheelSelection } from "@/lib/wheelSelect";

/** Hur många pixlar en rad och en sida är, när webbläsaren räknar hjulet i rader eller sidor. */
const LINE = WHEEL_STEP / 3;
const PAGE = WHEEL_STEP;

/**
 * Hjulet över en dropdown byter alternativ i stället för att skrolla sidan, utan att dropdownen
 * öppnas. Det gäller på hela sajten. En avstängd dropdown skrollar sidan som vanligt. Komponenten
 * renderar inget.
 */
export function WheelSelect() {
  useEffect(() => {
    // Rörelse som ännu inte blivit ett steg, för den dropdown den gjordes över.
    let pending = { select: null as HTMLSelectElement | null, delta: 0 };

    function onWheel(event: WheelEvent) {
      const select = event.target instanceof Element ? event.target.closest("select") : null;
      if (!select || select.disabled || select.multiple || select.size > 1) return;
      event.preventDefault();
      const scale = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? LINE : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? PAGE : 1;
      const next = wheelSelection({
        index: select.selectedIndex,
        disabled: Array.from(select.options, (option) => option.disabled),
        pending: pending.select === select ? pending.delta : 0,
        delta: event.deltaY * scale,
      });
      pending = { select, delta: next.pending };
      if (next.index === select.selectedIndex) return;
      select.selectedIndex = next.index;
      // React läser valet från change-händelsen, precis som när man väljer i listan.
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }

    // Inte passiv, så att sidan inte skrollar samtidigt.
    document.addEventListener("wheel", onWheel, { passive: false });
    return () => document.removeEventListener("wheel", onWheel);
  }, []);
  return null;
}
