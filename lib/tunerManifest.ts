import type { MetadataRoute } from "next";
import { withBasePath } from "./basePath";

/**
 * Stämmaren som installerbar app. Manifestet serveras från `/guitar/tuner/manifest.webmanifest`
 * och länkas bara från Stämmarsidan, eftersom resten av gitarrdelen inte fungerar utan nät. Den
 * öppnas och stannar på `/guitar/tuner`, där service workern (public/sw.js) tar hand om nätet.
 */

export const TUNER_PATH = withBasePath("/tuner");
export const TUNER_MANIFEST_PATH = `${TUNER_PATH}/manifest.webmanifest`;
/** Sajtens blå, samma som i ikonen (public/icons/tuner.svg). */
export const TUNER_THEME_COLOR = "#2563eb";
/** iOS läser inte ikonerna i manifestet när Stämmaren läggs på hemskärmen. */
export const TUNER_APPLE_ICON = withBasePath("/icons/tuner-180.png");

export function tunerManifest(): MetadataRoute.Manifest {
  return {
    id: TUNER_PATH,
    name: "Tuner",
    short_name: "Tuner",
    description: "A guitar, bass, ukulele and mandolin tuner that works offline.",
    start_url: TUNER_PATH,
    scope: TUNER_PATH,
    display: "standalone",
    background_color: "#f3f5f9",
    theme_color: TUNER_THEME_COLOR,
    icons: [
      { src: withBasePath("/icons/tuner-192.png"), sizes: "192x192", type: "image/png" },
      { src: withBasePath("/icons/tuner-512.png"), sizes: "512x512", type: "image/png" },
      // Gaffeln ligger inom den mittersta cirkeln, så samma bild fungerar som maskable.
      { src: withBasePath("/icons/tuner-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
