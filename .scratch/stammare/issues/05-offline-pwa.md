# 05: Offline och installation

**What to build:** Stämmaren går att installera på hemskärmen och fungerar helt utan nät. Lägg till `app/manifest.ts` (namn, ikoner, `start_url` och `scope` för `/guitar/tuner`, `display: standalone`) och `public/sw.js` som registreras från Stämmarsidan med `basePath`-prefix. Följ `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`. Sidan cachas med network-first och `/guitar/_next/static/*` med cache-first. Gamla cachar rensas när en ny version aktiveras.

**Blocked by:** 03

**Status:** ready-for-human

- [x] Manifest och ikoner.
- [x] Service worker med versionerad cache och rätt scope under `/guitar`.
- [x] Kontrollera att Nginx (i Landningssidans repo) serverar `sw.js` och manifestet under `/guitar/` utan lång cachning. Skriv det i en kommentar här om något behöver ändras där.
- [ ] Prövat: installera på mobilen, slå på flygplansläge och öppna Stämmaren igen. Den laddar, mikrofonen fungerar och egna stämningar finns kvar. (Prövat i Chromium utan nät, se kommentaren. Kvar: en riktig mobil.)

## Comments

**2026-11-25:** Byggt. Det som är kvar är att pröva på en riktig mobil, därav `ready-for-human`.
- **Manifestet ligger inte i `app/manifest.ts`.** Next länkar det filen till från alla sidor, och resten av gitarrdelen fungerar inte utan nät (Out of Scope). I stället bygger `lib/tunerManifest.ts` manifestet. Det serveras från `app/tuner/manifest.webmanifest/route.ts` och länkas bara från Stämmarsidan via `metadata.manifest`. `start_url`, `scope` och `id` är `/guitar/tuner`.
- **Ikonerna:** `public/icons/tuner.svg` (stämgaffeln från sidmenyn på sajtens blå) och PNG:er på 180, 192 och 512 px. 512 används även som maskable. Sidan har `apple-touch-icon`, `appleWebApp` och `theme-color` för iOS.
- **Service workern:** `public/sw.js` har tester i `lib/serviceWorker.test.ts`, som kör den i en `vm`-kontext med låtsade cachar. `components/useTunerServiceWorker.ts` registrerar den, bara i produktion, med scope `/guitar/tuner` och `updateViaCache: "none"`. Cacharna heter `tuner-page-v1` och `tuner-static-v1`, och de som har prefixet `tuner-` men en annan version tas bort när en ny version aktiveras.
  - Stämmarsidan hämtas network-first. Efter 3 s utan svar visas den sparade sidan.
  - `/guitar/_next/static/*` hämtas cache-first.
  - Första gången styr service workern inte sidan än, så sidan skickar sina Next-filer till den, som sparar dem. Över 60 sparade filer tas de som sidan inte använder bort.
- **Nginx behöver inte ändras.** `location /guitar/` proxar `/guitar/sw.js` och `/guitar/tuner/manifest.webmanifest` till Next. `next.config.ts` ger `sw.js` `Cache-Control: no-cache, no-store, must-revalidate`, och manifestet får `public, max-age=0, must-revalidate`. Deployen kopierar `public/` (`.github/workflows/deploy.yml`), så `sw.js` och ikonerna följer med.
- **Prövat i Chromium med ett produktionsbygge (`next start`):**
  - Headers och manifest stämmer.
  - Ingen manifestlänk på Greppbrädan.
  - Service workern styr sidan efter första laddningen och har sparat sidan och 9 Next-filer.
  - Utan nät laddar Stämmaren, både vid omladdning och i en ny flik. Den egna stämningen finns kvar och redigeraren fungerar.
  - Greppbrädan laddar inte utan nät, som väntat.
  - Inga fel.
- **Att tänka på vid provet på mobilen:** på iOS har en app på hemskärmen egen lagring. Egna stämningar som skapats i Safari följer inte med, så skapa stämningen i den installerade appen.
