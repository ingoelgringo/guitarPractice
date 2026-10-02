# 02: Driftsättning av skelettet

**What to build:** Skelettet från 01 nås publikt på `https://guitar.berghult.com`, och en push till `main` med gröna tester driftsätter automatiskt. Bygget sker i GitHub Actions (Next.js `standalone`) och skickas till servern med `rsync`, så att servern slipper byggtoppen. Inget av det här rör databasen (se 18). Följ `vps-infra` (`SERVER.md`, `RUNBOOK-new-app.md`) och dokumentera avvikelserna. Vissa steg (DNS hos Oderland, GitHub-repo och secrets, sudo-steg på servern) måste Ägaren göra själv. Ge dem som en tydlig checklista.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Kodrepot har en GitHub-remote (issue tracker förblir lokal markdown).
- [ ] GitHub Actions har ett test-jobb som kör alla Vitest-tester, och ett deploy-jobb som bara körs när testerna är gröna.
- [ ] Deploy-jobbet bygger `standalone` i CI, skickar resultatet med `rsync` och kör `pm2 restart guitar-practice` på servern. Inget `npm ci` och ingen build sker på servern.
- [ ] PM2-processen `guitar-practice` kör på port 3004 med `max_memory_restart: '250M'` och loggar under `~/logs/`.
- [ ] Nginx proxar till 3004 och serverar `/_next/static` direkt från disk med lång `immutable`-cachning.
- [ ] Certbot ger HTTPS för `guitar.berghult.com`, och A-recordet pekar mot servern.
- [ ] I `vps-infra` finns `apps/guitar-practice.md`, och rader är tillagda i tabellerna i `SERVER.md` och `README.md`. Bygget i CI med `rsync` är dokumenterat som avvikelse.
- [ ] Hela kedjan är verifierad: en trivial ändring på `main` syns live.
