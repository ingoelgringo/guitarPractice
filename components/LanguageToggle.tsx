"use client";

import { useRouter } from "next/navigation";
import { MESSAGES } from "@/lib/messages";
import { languageCookie, otherLanguage, type SiteLanguage } from "@/lib/siteLanguage";
import { Flag } from "./Flag";
import styles from "./SiteHeader.module.css";

/**
 * Flaggan i headern. Den visar språket man byter till. Servern läser cookien, så sidan renderas
 * om på servern i stället för att laddas om, och det man har öppet i ett Verktyg ligger kvar.
 */
export function LanguageToggle({ language }: { language: SiteLanguage }) {
  const router = useRouter();
  const messages = MESSAGES[language];

  function toggle() {
    document.cookie = languageCookie(otherLanguage(language));
    router.refresh();
  }

  return (
    <button type="button" className={styles.language} onClick={toggle} lang={otherLanguage(language)}>
      <Flag language={otherLanguage(language)} /> {messages.switchLanguage}
    </button>
  );
}
