import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { MESSAGES } from "@/lib/messages";
import { siteLanguageInPage } from "@/lib/siteLanguageInPage";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const messages = MESSAGES[await siteLanguageInPage()];
  return { title: messages.siteTitle, description: messages.siteDescription };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const language = await siteLanguageInPage();

  return (
    // Skriptet sätter temaattributet före hydreringen, därav suppressHydrationWarning.
    <html lang={language} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <SiteHeader language={language} />
        {children}
      </body>
    </html>
  );
}
