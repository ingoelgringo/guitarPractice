import type { Metadata } from "next";
import { Fretboard } from "@/components/Fretboard";

export const metadata: Metadata = {
  title: "Fretboard · Guitar Practice",
};

/** Greppbrädan. Öppen för alla, och inget sparas. */
export default function FretboardPage() {
  return <Fretboard />;
}
