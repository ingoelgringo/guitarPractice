import type { SiteLanguage } from "@/lib/siteLanguage";
import styles from "./SiteHeader.module.css";

/**
 * Flaggan för ett Sajtspråk, som SVG. Flagg-emojis ritas som bokstäverna "SE" och "GB" i Windows.
 * Samma flaggor finns i Landningssidans HTML (repot ingemar-berghult).
 */
export function Flag({ language }: { language: SiteLanguage }) {
  return language === "sv" ? (
    <svg className={styles.flag} viewBox="0 0 16 10" width="18" height="12" aria-hidden="true">
      <rect width="16" height="10" fill="#006aa7" />
      <rect x="5" width="2" height="10" fill="#fecc00" />
      <rect y="4" width="16" height="2" fill="#fecc00" />
    </svg>
  ) : (
    <svg className={styles.flag} viewBox="0 0 60 30" width="24" height="12" aria-hidden="true">
      <clipPath id="flag-gb-diagonals">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#flag-gb-diagonals)" stroke="#c8102e" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6" />
    </svg>
  );
}
