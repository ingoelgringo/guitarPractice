# 18: Databasen i produktion

**What to build:** Biblioteket fungerar live på `guitar.berghult.com`. Databasen `guitarpractice` med egen användare skapas i den befintliga containern `folkbibeln-postgres` (postgres:18, localhost:5435), utan ny container och utan delning med Folkbibelns databas. Migreringarna körs i deploy-flödet, och Biblioteket säkerhetskopieras dagligen. Steg som kräver sudo eller servertillgång ges som checklista åt Ägaren.

**Blocked by:** 02, 15

**Status:** ready-for-agent

- [ ] Det finns en checklista för att skapa databasen och användaren i `folkbibeln-postgres`.
- [ ] `.env` på servern har `DATABASE_URL`, `SESSION_SECRET`, `OWNER_USERNAME` och `OWNER_PASSWORD_HASH`.
- [ ] Deploy-jobbet kör SQL-migreringarna före `pm2 restart`.
- [ ] Backup-cron kör `pg_dump` av `guitarpractice` dagligen kl. 03:00 och rensar dumpar äldre än 30 dagar.
- [ ] `limit_req` för inloggningen är aktiv i Nginx.
- [ ] `vps-infra` är uppdaterad: `apps/guitar-practice.md` (databas, env-nycklar, backup) och `apps/folkbibeln.md` (containern hyser nu även `guitarpractice`).
- [ ] Verifierat live: Ägaren loggar in, skapar ett Partitur, laddar om, och Partituret finns kvar.
