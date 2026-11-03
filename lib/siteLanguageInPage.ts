import { cookies, headers } from "next/headers";
import { LANG_COOKIE, siteLanguage, type SiteLanguage } from "./siteLanguage";

/**
 * Sajtspråket för förfrågan som renderas. Servern renderar direkt på rätt språk, så att engelska
 * aldrig blinkar fram först. Bara för servern, eftersom `next/headers` inte finns i webbläsaren.
 */
export async function siteLanguageInPage(): Promise<SiteLanguage> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  return siteLanguage(cookieStore.get(LANG_COOKIE)?.value, headerList.get("accept-language"));
}
