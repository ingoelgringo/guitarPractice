import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { OpenedFromLibrary } from "@/components/TabEditor";
import { TabEditorLoader } from "@/components/TabEditorLoader";
import { isOwnerInPage } from "@/lib/auth";
import { loadScore } from "@/lib/library";

export const metadata: Metadata = {
  title: "Tab Editor · Guitar Practice",
};

/** Editorn. Ägaren öppnar ett Partitur från Biblioteket med `?score=<id>`. */
export default async function TabEditorPage(props: PageProps<"/tab-editor">) {
  const owner = await isOwnerInPage();
  const { score: id } = await props.searchParams;

  let fromLibrary: OpenedFromLibrary | undefined;
  // En Gäst når inget i Biblioteket, så för en Gäst betyder parametern ingenting.
  if (owner && typeof id === "string") {
    const loaded = await loadScore(id);
    if (!loaded) notFound();
    fromLibrary = { id: loaded.stored.id, revision: loaded.stored.revision, score: loaded.score };
  }

  return <TabEditorLoader owner={owner} fromLibrary={fromLibrary} />;
}
