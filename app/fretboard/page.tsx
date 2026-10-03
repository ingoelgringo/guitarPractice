import type { Metadata } from "next";
import { Fretboard } from "@/components/Fretboard";
import { choiceFromParams } from "@/lib/fretboardParams";

export const metadata: Metadata = {
  title: "Fretboard · Guitar Practice",
};

/** Greppbrädan. Öppen för alla, och inget sparas. Valet ligger i adressen, t.ex. `?root=Eb&scale=blues`. */
export default async function FretboardPage(props: PageProps<"/fretboard">) {
  const searchParams = await props.searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
  }
  return <Fretboard initialChoice={choiceFromParams(params)} />;
}
