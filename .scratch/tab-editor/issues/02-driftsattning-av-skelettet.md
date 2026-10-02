# 02: Driftsättning av skelettet

**What to build:** Skelettet från 01 nås publikt på `https://ingemar.berghult.com`, och en push till `main` med gröna tester driftsätter automatiskt. Bygget sker i GitHub Actions (Next.js `standalone`) och skickas till servern med `rsync`, så att servern slipper byggtoppen. Inget av det här rör databasen (se 18). Följ `vps-infra` (`SERVER.md`, `RUNBOOK-new-app.md`) och dokumentera avvikelserna. Vissa steg (DNS hos Oderland, GitHub-repo och secrets, sudo-steg på servern) måste Ägaren göra själv. Ge dem som en tydlig checklista.

**Blocked by:** 01

**Status:** ready-for-human

- [ ] Kodrepot har en GitHub-remote (issue tracker förblir lokal markdown).
- [x] GitHub Actions har ett test-jobb som kör alla Vitest-tester, och ett deploy-jobb som bara körs när testerna är gröna.
- [x] Deploy-jobbet bygger `standalone` i CI, skickar resultatet med `rsync` och kör `pm2 restart guitar-practice` på servern. Inget `npm ci` och ingen build sker på servern.
- [x] PM2-processen `guitar-practice` kör på port 3004 med `max_memory_restart: '250M'` och loggar under `~/logs/`.
- [x] Nginx proxar till 3004 och serverar `/_next/static` direkt från disk med lång `immutable`-cachning.
- [ ] Certbot ger HTTPS för `ingemar.berghult.com`, och A-recordet pekar mot servern.
- [x] I `vps-infra` finns `apps/guitar-practice.md`, och rader är tillagda i tabellerna i `SERVER.md` och `README.md`. Bygget i CI med `rsync` är dokumenterat som avvikelse.
- [ ] Hela kedjan är verifierad: en trivial ändring på `main` syns live.

## Comments

**Agentens del är klar.** Det som återstår är Ingos egna steg: DNS, GitHub-repo och remote, secrets, sudo-steg på servern och verifiering. Checklistan finns i `vps-infra/apps/guitar-practice.md` under "Uppsättnings-runbook". Därför står status som `ready-for-human`. Bocka av de tre sista punkterna ovan när kedjan är verifierad.

Avvikelser och val att känna till:
- Deploy-jobbet kör `pm2 startOrRestart ecosystem.config.cjs --update-env` i stället för `pm2 restart guitar-practice`. Det startar processen vid första deployen och läser in ändrad `env`. Vid senare deployer är effekten densamma som en restart.
- Servern har release-kataloger (`releases/<sha>` + symlänken `current`) och en delad `static/`. En deploy byter alltså aldrig ut filer under den körande processen, och HTML från den gamla processen hittar sina chunkar medan den nya startar. Rollback: byt `current` och kör `pm2 restart`.
- Test-jobbet kör även `npm run typecheck`.
- Standalone-bygget är verifierat lokalt: `/`, `/tab-editor`, en chunk och ett alphaTab-typsnitt svarar 200 från `server.js`. Workflowen har inte körts i GitHub Actions än.
- Soundfont från disk (09), `limit_req` på inloggningen (14) och databas och backup (18) är medvetet utskjutna.
