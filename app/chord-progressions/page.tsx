import type { Metadata } from "next";
import { ChordProgressions } from "@/components/ChordProgressions";
import { isOwnerInPage } from "@/lib/auth";
import { listProgressions } from "@/lib/progressionLibrary";
import { siteLanguageInPage } from "@/lib/siteLanguageInPage";

export const metadata: Metadata = {
  title: "Chord Progressions · Guitar",
};

/**
 * Ackordföljder: Tonnetzen, Kvintcirkeln och editorn. Öppen för alla. Ägaren får också listan med
 * Ackordföljder i Biblioteket. Markeringen ligger inte i adressen och sparas inte.
 */
export default async function ChordProgressionsPage() {
  const [language, owner] = await Promise.all([siteLanguageInPage(), isOwnerInPage()]);
  const library = owner ? await listProgressions() : null;
  return <ChordProgressions language={language} library={library} />;
}
