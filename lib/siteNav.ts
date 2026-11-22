import { MESSAGES } from "./messages";
import type { SiteLanguage } from "./siteLanguage";
import { TOOLS } from "./tools";

/** En post i sajtens meny. `href` är en sökväg i appen, utan basePath. */
export interface SiteNavItem {
  href: string;
  label: string;
}

/**
 * Menyns poster: Gitarrsidan, Verktygen som finns och, för Ägaren, Biblioteket. Verktygens namn
 * översätts inte, se lib/tools.ts.
 */
export function siteNavItems(owner: boolean, language: SiteLanguage): SiteNavItem[] {
  const messages = MESSAGES[language];
  const tools = TOOLS.flatMap((tool) => (tool.href ? [{ href: tool.href, label: tool.title }] : []));
  return [
    { href: "/", label: messages.siteTitle },
    ...tools,
    ...(owner ? [{ href: "/library", label: messages.library }] : []),
  ];
}

/** Sant om posten hör till sidan: sidan själv eller en sida under den. Gitarrsidan bara exakt. */
export function isActiveNavItem(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
