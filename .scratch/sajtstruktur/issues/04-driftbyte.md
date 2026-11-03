# 04: Driftbyte till den nya strukturen

**What to build:** Gitarrdelen och Landningssidan går live samtidigt. Görs för hand på servern enligt `vps-infra/RUNBOOK-new-app.md`.

**Blocked by:** 01, 02, 03 och Landningssidan i repot `ingemar-berghult` (deploy och Nginx-block klara)

**Status:** ready-for-human

- [ ] Landningsrepot är deployat till sin katalog på servern (den svarar inte på `/` ännu).
- [ ] Byt serverns vhost för `ingemar.berghult.com` till blocket från `ingemar-berghult` (behåll certbots 443-del): `/` och `/projects` statiskt, `/stenhagen/` oförändrat, `/guitar/` till port 3004 (blocken i `deploy/nginx/guitar-practice.conf`), `/stenhagen/`-blocken från den gamla versionen av samma fil (före grenen `sajtstruktur`) och 301 från `/tab-editor`, `/fretboard`, `/library` och `/login` till `/guitar/...`. `nginx -t` och sedan reload.
- [ ] Merga grenen med 01–03 till `main` direkt efter, så att deployen bygger med basePath.
- [ ] Kontrollera: `/`, `/projects`, `/stenhagen/`, `/guitar/`, uppspelning i editorn, inloggning, Library och ett gammalt bokmärke.
- [ ] Uppdatera `vps-infra`: `apps/guitar-practice.md` (adress `/guitar`), en ny `apps/ingemar-berghult.md` och tabellen i `README.md`.
