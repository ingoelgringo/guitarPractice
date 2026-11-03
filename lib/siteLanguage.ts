/**
 * Sajtspråket: engelska eller svenska, valt med flaggan i headern. Valet ligger i cookien `lang` med
 * sökvägen `/`, så att det gäller även på Landningssidan. Det styr inte Notnamnsläget.
 */
export type SiteLanguage = "en" | "sv";

export const LANG_COOKIE = "lang";
const LANG_COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

const LANGUAGES: readonly SiteLanguage[] = ["en", "sv"];

function storedLanguage(value: string | undefined): SiteLanguage | null {
  return LANGUAGES.find((language) => language === value) ?? null;
}

/** Det av sajtens språk som `Accept-Language` föredrar mest, annars engelska. */
function preferredLanguage(acceptLanguage: string | null): SiteLanguage {
  let best: { language: SiteLanguage; quality: number } | null = null;
  for (const part of (acceptLanguage ?? "").split(",")) {
    const [tag, ...params] = part.trim().split(";");
    const language = storedLanguage(tag.split("-")[0].toLowerCase());
    if (!language) continue;
    const q = params.map((param) => param.trim()).find((param) => param.startsWith("q="));
    const quality = q ? Number(q.slice(2)) : 1;
    // Vid lika vikt vinner den som står först
    if (quality > 0 && (!best || quality > best.quality)) best = { language, quality };
  }
  return best?.language ?? "en";
}

/** Sajtspråket för en förfrågan: cookien om den är giltig, annars webbläsarens önskemål. */
export function siteLanguage(cookie: string | undefined, acceptLanguage: string | null): SiteLanguage {
  return storedLanguage(cookie) ?? preferredLanguage(acceptLanguage);
}

/** Språket som flaggan byter till. */
export function otherLanguage(language: SiteLanguage): SiteLanguage {
  return language === "en" ? "sv" : "en";
}

/** Cookien för `document.cookie`. Inte httpOnly, eftersom flaggan sätter den i webbläsaren. */
export function languageCookie(language: SiteLanguage): string {
  return `${LANG_COOKIE}=${language}; Path=/; Max-Age=${LANG_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
