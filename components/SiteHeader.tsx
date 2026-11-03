import { MESSAGES } from "@/lib/messages";
import type { SiteLanguage } from "@/lib/siteLanguage";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./SiteHeader.module.css";

/**
 * Sajtens header, samma som på Landningssidan. Låg och på en rad, så att den inte tar plats från
 * editorn. Hemlänken går till `/`, utanför basePath, och är därför en vanlig länk.
 */
export function SiteHeader({ language }: { language: SiteLanguage }) {
  return (
    <header className={styles.header}>
      {/* Landningssidan ligger utanför Next-appen, så <Link> skulle lägga till /guitar */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className={styles.home}>
        ingemar.berghult.com
      </a>
      <div className={styles.controls}>
        <LanguageToggle language={language} />
        <ThemeToggle label={MESSAGES[language].toggleTheme} />
      </div>
    </header>
  );
}
