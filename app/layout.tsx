import type { Metadata } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guitar Practice",
  description: "Tools for guitarists: write tabs with notation, play them back and print them.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Skriptet sätter temaattributet före hydreringen, därav suppressHydrationWarning.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
