"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isActiveNavItem, type SiteNavItem } from "@/lib/siteNav";
import styles from "./SiteNav.module.css";

/** Ikonerna per sökväg. En post utan egen ikon får Gitarrsidans. */
const ICONS: Record<string, ReactNode> = {
  "/": (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </>
  ),
  "/tab-editor": (
    <>
      <path d="M3 6h18M3 10h18M3 14h18M3 18h18" />
      <path d="M8 4v16" strokeWidth="2.5" />
    </>
  ),
  "/fretboard": (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M9 5v14M15 5v14M3 10h18M3 14h18" />
    </>
  ),
  "/chord-progressions": (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </>
  ),
  // En stämgaffel
  "/tuner": (
    <>
      <path d="M9 3v8a3 3 0 0 0 6 0V3" />
      <path d="M12 14v7" />
    </>
  ),
  "/library": (
    <>
      <path d="M12 6c-2-1.5-5-2-8-1.5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-14c-3-.5-6 0-8 1.5z" />
      <path d="M12 6v14" />
    </>
  ),
};

/**
 * Sajtens meny till vänster, med en länk per sida och den aktiva markerad. På mellanbreda skärmar
 * bara ikoner, och på smala en rad under headern. Posterna kommer från layouten (lib/siteNav.ts).
 */
export function SiteNav({ items, label }: { items: SiteNavItem[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label={label}>
      <ul className={styles.list}>
        {items.map((item) => {
          const active = isActiveNavItem(item.href, pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${styles.link} ${active ? styles.active : ""}`}
                aria-current={active ? "page" : undefined}
                title={item.label}
              >
                <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
                  {ICONS[item.href] ?? ICONS["/"]}
                </svg>
                <span className={styles.label}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
