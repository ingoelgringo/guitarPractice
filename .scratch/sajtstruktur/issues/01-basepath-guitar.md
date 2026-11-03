# 01: basePath /guitar

**What to build:** Gitarrdelen byggs med `basePath: "/guitar"`. Allt som inte får prefixet automatiskt går via en hjälpfunktion: `fetch("/api/login")` i `app/login/LoginForm.tsx`, alla anrop i `lib/libraryClient.ts`, `<a href="/library">` i `components/LibraryButtons.tsx`, `history.replaceState(..., "/tab-editor")` i `components/TabEditor.tsx`, utloggningsformulärets `action` i `app/page.tsx` och `SOUND_FONT`, `SCRIPT_FILE` och `fontDirectory` i `components/ScoreView.tsx`. Deployens hälsokontroll (`.github/workflows/deploy.yml`) frågar `/guitar/`. `deploy/nginx/guitar-practice.conf` ersätts av en notis om vilka `location`-block gitarrdelen behöver (`/guitar/_next/static/`, `/guitar/alphatab/`, `= /guitar/api/login` med hastighetsgräns och `/guitar/` som proxy).

**Blocked by:** –

**Status:** done

- [x] Test för hjälpfunktionen som lägger till basePath.
- [x] Alla hårdkodade sökvägar ovan går via hjälpfunktionen (sök efter `"/api`, `"/alphatab`, `href="/` och `action="/`). Även utloggningens `Location` går till `/guitar`.
- [x] Sessionscookien har sökvägen `/guitar` (test i `app/api/auth.test.ts`).
- [x] API-testerna går igenom (bibliotekstesterna kräver Postgres och körs i CI).
- [ ] Ett lokalt produktionsbygge på `/guitar`: sidorna, alphaTabs filer, utloggningen och fel inloggning svarar rätt med curl. Uppspelning och riktig inloggning är inte provade i en webbläsare.
- [x] Arbetet görs på grenen `sajtstruktur` och mergas inte till `main` förrän i ticket 04.
