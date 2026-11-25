# 05: Offline och installation

**What to build:** Stämmaren går att installera på hemskärmen och fungerar helt utan nät. Lägg till `app/manifest.ts` (namn, ikoner, `start_url` och `scope` för `/guitar/tuner`, `display: standalone`) och `public/sw.js` som registreras från Stämmarsidan med `basePath`-prefix. Följ `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`. Sidan cachas med network-first och `/guitar/_next/static/*` med cache-first. Gamla cachar rensas när en ny version aktiveras.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Manifest och ikoner.
- [ ] Service worker med versionerad cache och rätt scope under `/guitar`.
- [ ] Kontrollera att Nginx (i Landningssidans repo) serverar `sw.js` och manifestet under `/guitar/` utan lång cachning. Skriv det i en kommentar här om något behöver ändras där.
- [ ] Prövat: installera på mobilen, slå på flygplansläge och öppna Stämmaren igen. Den laddar, mikrofonen fungerar och egna stämningar finns kvar.

## Comments
