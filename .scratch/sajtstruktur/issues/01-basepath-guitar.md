# 01: basePath /guitar

**What to build:** Gitarrdelen byggs med `basePath: "/guitar"`. Allt som inte får prefixet automatiskt går via en hjälpfunktion: `fetch("/api/login")` i `app/login/LoginForm.tsx`, alla anrop i `lib/libraryClient.ts`, `<a href="/library">` i `components/LibraryButtons.tsx`, `history.replaceState(..., "/tab-editor")` i `components/TabEditor.tsx`, länken till editorn i `components/LibraryScoreLink.tsx`, utloggningsformulärets `action` i `app/page.tsx` och `SOUND_FONT`, `SCRIPT_FILE` och `fontDirectory` i `components/ScoreView.tsx`. Deployens hälsokontroll (`.github/workflows/deploy.yml`) frågar `/guitar`. `deploy/nginx/guitar-practice.conf` innehåller bara de `location`-block gitarrdelen behöver (`/guitar/_next/static/`, `/guitar/alphatab/`, `= /guitar/api/login` med hastighetsgräns, `= /guitar` och `/guitar/` som proxy), för att klistras in i Landningssidans server-block.

**Blocked by:** –

**Status:** done

- [x] Test för hjälpfunktionen som lägger till basePath.
- [x] Alla hårdkodade sökvägar ovan går via hjälpfunktionen (sök efter `"/api`, `"/alphatab`, `href="/` och `action="/`). Även utloggningens `Location` går till `/guitar`, och `LibraryScoreLink` (en template-literal som sökningen missar).
- [x] Sessionscookien har sökvägen `/guitar`, och utloggningen rensar även en gammal cookie med sökvägen `/` (tester i `app/api/auth.test.ts`).
- [x] API-testerna går igenom (bibliotekstesterna kräver Postgres och körs i CI).
- [x] Ett lokalt produktionsbygge på `/guitar`: sidorna, alphaTabs filer, utloggningen och fel inloggning svarar rätt med curl.
- [ ] Uppspelning och riktig inloggning i en webbläsare. Prövas i ticket 04 efter bytet.
- [x] Arbetet görs på grenen `sajtstruktur` och mergas inte till `main` förrän i ticket 04.
