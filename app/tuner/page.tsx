import type { Metadata } from "next";
import { Tuner } from "@/components/Tuner";
import { siteLanguageInPage } from "@/lib/siteLanguageInPage";

export const metadata: Metadata = {
  title: "Tuner · Guitar",
};

/** Stämmaren. Öppen för alla. Inställningarna sparas i webbläsaren och ligger inte i adressen. */
export default async function TunerPage() {
  const language = await siteLanguageInPage();
  return <Tuner language={language} />;
}
