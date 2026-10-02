import type { Metadata } from "next";
import { TabEditorLoader } from "@/components/TabEditorLoader";

export const metadata: Metadata = {
  title: "Tab Editor · Guitar Practice",
};

export default function TabEditorPage() {
  return <TabEditorLoader />;
}
