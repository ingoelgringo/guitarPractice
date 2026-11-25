// Stämmarens service worker, så att Stämmaren fungerar utan nät. Den registreras från
// Stämmarsidan med scope `/guitar/tuner` och styr bara den sidan, men allt sidan hämtar går
// genom den. Stämmarsidan hämtas från nätet först och Next-filerna (som har en hash i namnet)
// från cachen först. Allt annat går direkt till nätet. Testerna ligger i lib/serviceWorker.test.ts.
//
// Höj VERSION när strategierna ändras. Då rensas cacharna från den förra versionen när den nya
// aktiveras.

const VERSION = "v1";
const PREFIX = "tuner-";
const PAGE_CACHE = `${PREFIX}page-${VERSION}`;
const STATIC_CACHE = `${PREFIX}static-${VERSION}`;

// Sökvägarna följer var sw.js ligger, alltså basePath (`/guitar/`).
const BASE = new URL("./", self.location).pathname;
const PAGE_PATH = `${BASE}tuner`;
const PAGE = new URL(PAGE_PATH, self.location).href;
const STATIC = `${BASE}_next/static/`;

/** Så länge väntar Stämmarsidan på nätet innan den sparade sidan visas, i millisekunder. */
const NETWORK_TIMEOUT = 3000;
/** Över så här många sparade Next-filer tas de som sidan inte använder längre bort. */
const MAX_STATIC_FILES = 60;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const response = await fetch(PAGE);
        if (response.ok) await (await caches.open(PAGE_CACHE)).put(PAGE, response);
      } catch {
        // Utan nät sparas sidan nästa gång den hämtas.
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const current = [PAGE_CACHE, STATIC_CACHE];
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => name.startsWith(PREFIX) && !current.includes(name)).map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate" && (url.pathname === PAGE_PATH || url.pathname === `${PAGE_PATH}/`)) {
    event.respondWith(networkFirst(request));
  } else if (url.pathname.startsWith(STATIC)) {
    event.respondWith(cacheFirst(request));
  }
});

/**
 * Stämmarsidan: från nätet, och den senast hämtade när nätet saknas eller är för segt. Svarar
 * nätet efter timeouten sparas sidan ändå till nästa gång.
 */
async function networkFirst(request) {
  const cache = await caches.open(PAGE_CACHE);
  const network = fetch(request).then(async (response) => {
    if (response.ok) await cache.put(PAGE, response.clone());
    return response;
  });
  const cached = await cache.match(PAGE);
  if (!cached) return network;
  const timeout = new Promise((resolve) => setTimeout(() => resolve(cached), NETWORK_TIMEOUT));
  return Promise.race([network.catch(() => cached), timeout]);
}

/** Next-filerna: ändras aldrig under samma namn, så cachen räcker när filen finns där. */
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

// Första gången sidan laddas styr service workern den inte än, så sidan skickar de Next-filer den
// har laddat. De sparas. När cachen har vuxit tas filerna som sidan inte skickade bort: de kommer
// från tidigare releaser, eller laddas senare och hämtas då igen.
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "cache-static" || !Array.isArray(data.urls)) return;
  const wanted = new Set(
    data.urls
      .map((url) => new URL(url, self.location))
      .filter((url) => url.origin === self.location.origin && url.pathname.startsWith(STATIC))
      .map((url) => url.href),
  );
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = (await cache.keys()).map((request) => request.url);
      if (cached.length > MAX_STATIC_FILES) {
        await Promise.all(cached.filter((url) => !wanted.has(url)).map((url) => cache.delete(url)));
      }
      await Promise.all(
        [...wanted]
          .filter((url) => !cached.includes(url))
          .map(async (url) => {
            try {
              const response = await fetch(url);
              if (response.ok) await cache.put(url, response);
            } catch {
              // Nästa laddning försöker igen.
            }
          }),
      );
    })(),
  );
});
