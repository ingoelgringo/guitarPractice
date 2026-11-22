import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteNav } from "@/components/SiteNav";
import { WheelSelect } from "@/components/WheelSelect";
import { isOwnerInPage } from "@/lib/auth";
import { MESSAGES } from "@/lib/messages";
import { siteLanguageInPage } from "@/lib/siteLanguageInPage";
import { siteNavItems } from "@/lib/siteNav";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";
import styles from "./layout.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const messages = MESSAGES[await siteLanguageInPage()];
  return { title: messages.siteTitle, description: messages.siteDescription };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [language, owner] = await Promise.all([siteLanguageInPage(), isOwnerInPage()]);

  return (
    // Skriptet sätter temaattributet före hydreringen, därav suppressHydrationWarning.
    <html lang={language} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <SiteHeader language={language} />
        <div className={styles.shell}>
          <SiteNav items={siteNavItems(owner, language)} label={MESSAGES[language].siteNav} />
          <div className={styles.content}>{children}</div>
        </div>
        <WheelSelect />
      </body>
    </html>
  );
}
