/**
 * Gitarrdelen ligger under `/guitar` på sajten (ADR 0004). `<Link>`, `redirect` och `router` lägger
 * till prefixet själva, men inte `fetch`, `<a href>`, formulärens `action`, `history` eller alphaTab.
 */
export const BASE_PATH = "/guitar";

/** En sökväg i appen, t.ex. `/api/login`, som en adress på sajten. */
export function withBasePath(path: string): string {
  return path === "/" ? BASE_PATH : BASE_PATH + path;
}
