"use client";

import { useEffect } from "react";
import { withBasePath } from "@/lib/basePath";
import { preloadReferenceTone } from "./referenceTone";

// Sökvägarna och meddelandet `cache-static` måste stämma med public/sw.js.

/**
 * Registrerar Stämmarens service worker (public/sw.js), så att Stämmaren fungerar utan nät. Bara i
 * produktion, eftersom utvecklingsserverns filer ändras hela tiden.
 *
 * Första gången styr service workern inte sidan, så de Next-filer sidan redan har laddat går inte
 * genom den. Därför skickar sidan dem till service workern, som sparar dem. Tone.js laddas först
 * när referenstonen spelas, så sidan laddar den i förväg för att den ska komma med.
 */
export function useTunerServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    void (async () => {
      try {
        await navigator.serviceWorker.register(withBasePath("/sw.js"), {
          scope: withBasePath("/tuner"),
          updateViaCache: "none",
        });
        const registration = await navigator.serviceWorker.ready;
        try {
          await preloadReferenceTone();
        } catch {
          // Referenstonen fungerar då bara med nät.
        }
        const staticPath = withBasePath("/_next/static/");
        const urls = performance
          .getEntriesByType("resource")
          .map((entry) => entry.name)
          .filter((url) => new URL(url).pathname.startsWith(staticPath));
        registration.active?.postMessage({ type: "cache-static", urls });
      } catch {
        // Stämmaren fungerar ändå, bara inte utan nät.
      }
    })();
  }, []);
}
