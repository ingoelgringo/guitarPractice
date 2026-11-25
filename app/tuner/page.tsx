import type { Metadata, Viewport } from "next";
import { Tuner } from "@/components/Tuner";
import { siteLanguageInPage } from "@/lib/siteLanguageInPage";
import { TUNER_APPLE_ICON, TUNER_MANIFEST_PATH, TUNER_THEME_COLOR } from "@/lib/tunerManifest";

export const metadata: Metadata = {
  title: "Tuner · Guitar",
  // Bara Stämmaren går att installera och använda utan nät.
  manifest: TUNER_MANIFEST_PATH,
  icons: { apple: TUNER_APPLE_ICON },
  appleWebApp: { capable: true, title: "Tuner", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: TUNER_THEME_COLOR,
};

/** Stämmaren. Öppen för alla. Inställningarna sparas i webbläsaren och ligger inte i adressen. */
export default async function TunerPage() {
  const language = await siteLanguageInPage();
  return <Tuner language={language} />;
}
