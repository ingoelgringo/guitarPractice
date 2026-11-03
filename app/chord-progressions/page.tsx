import type { Metadata } from "next";
import { ChordProgressions } from "@/components/ChordProgressions";
import { siteLanguageInPage } from "@/lib/siteLanguageInPage";

export const metadata: Metadata = {
  title: "Chord Progressions · Guitar",
};

/** Ackordföljder: Kvintcirkeln. Öppen för alla. Markeringen ligger inte i adressen och sparas inte. */
export default async function ChordProgressionsPage() {
  return <ChordProgressions language={await siteLanguageInPage()} />;
}
