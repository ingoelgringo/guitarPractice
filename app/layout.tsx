import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guitar Practice",
  description: "Tools for guitarists: write tabs with notation, play them back and print them.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
