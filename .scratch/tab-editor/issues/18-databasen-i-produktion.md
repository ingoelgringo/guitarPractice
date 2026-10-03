# 18: Databasen i produktion

**What to build:** Biblioteket fungerar live på `ingemar.berghult.com`. Databasen `guitarpractice` med egen användare skapas i den befintliga containern `folkbibeln-postgres` (postgres:18, localhost:5435), utan ny container och utan delning med Folkbibelns databas. Migreringarna körs i deploy-flödet, och Biblioteket säkerhetskopieras dagligen. Steg som kräver sudo eller servertillgång ges som checklista åt Ägaren.

**Blocked by:** 02, 15

**Status:** ready-for-agent

- [x] Det finns en checklista för att skapa databasen och användaren i `folkbibeln-postgres`.
- [x] `.env` på servern har `DATABASE_URL`, `SESSION_SECRET`, `OWNER_USERNAME` och `OWNER_PASSWORD_HASH`.
- [x] Deploy-jobbet kör SQL-migreringarna före `pm2 restart`.
- [x] Backup-cron kör `pg_dump` av `guitarpractice` dagligen kl. 03:00 och rensar dumpar äldre än 30 dagar.
- [x] `limit_req` för inloggningen är aktiv i Nginx.
- [x] `vps-infra` är uppdaterad: `apps/guitar-practice.md` (databas, env-nycklar, backup) och `apps/folkbibeln.md` (containern hyser nu även `guitarpractice`).
- [x] Verifierat live: Ägaren loggar in, skapar ett Partitur, laddar om, och Partituret finns kvar.

## Comments

**Agentens del är klar.** Det som återstår görs av Ingo på servern: databasen och användaren, `.env`, backup-cron, `limit_req` och verifieringen live. Checklistan finns i `vps-infra/apps/guitar-practice.md` under "Uppsättning: inloggning och databas (ticket 14 och 18)". Den ersätter ticket 14:s egen checklista. Därför står status som `ready-for-human`.
- **Gör checklistan innan `main` pushas.** Utan `.env` på servern blir deploy-jobbet rött vid migreringen. Den gamla releasen fortsätter då köra.
- **Deploy:** CI lägger `scripts/migrate.mjs` och `db/migrations/` i standalone-bygget. `pg` finns redan i dess `node_modules`. På servern körs `node --env-file=$APP_DIR/.env releases/<sha>/scripts/migrate.mjs` **före** bytet av `current` och `pm2 startOrRestart`. En misslyckad migrering lämnar alltså den gamla releasen igång.
  - Migreringar backas inte vid rollback, och den gamla processen kör en kort stund mot det nya schemat under varje deploy. Migreringar ska därför bara lägga till.
- **Databasen:** användaren `guitarpractice` äger databasen `guitarpractice` och är inte superuser. `CONNECT` återkallas från `PUBLIC` på `guitarpractice`. (Ändrat vid uppsättningen: se nedan.) `DATABASE_URL` använder `127.0.0.1`, inte `localhost`, och lösenordet är hex så att det inte behöver kodas i URL:en.
- **Backup:** `umask 077 && docker exec folkbibeln-postgres pg_dump -U guitarpractice guitarpractice > ~/backups/guitarpractice-ÅÅÅÅMMDD.sql` kl. 03:00, plus en rensning efter 30 dagar. Ett återställningsrecept finns i vps-infra.
- **Verifierat lokalt:**
  - Standalone-bygget innehåller `pg`.
  - `migrate.mjs` körd från en kopia av standalone med `--env-file` migrerar en tom databas, och en andra körning ändrar inget.
  - En saknad `.env` ger en felkod.
  - Checklistans SQL är provad i en tillfällig `postgres:18`-container: `guitarpractice` nekas `CONNECT` till `folkbibeln`, migreringen fungerar som icke-superuser och `pg_dump` fungerar.
  - Workflowen har inte körts i GitHub Actions.
- **vps-infra:** ändringarna (inklusive ticket 14:s) ligger ocommittade i `vps-infra`. `apps/guitar-practice.md` har avsnitten Hemligheter, Databas, Uppsättning och Backup, och `folkbibeln.md` och `SERVER.md` nämner att containern nu delas.

**Verifierad 2026-10-03.** Ingo körde checklistan med agenten som guide.
- **Folkbibelns databas lämnades orörd**, eftersom Ingo inte ville riskera de andra apparna. Därför kördes inte `REVOKE CONNECT ON DATABASE folkbibeln FROM PUBLIC`. `guitarpractice` kan ansluta till `folkbibeln`, men har ingen rätt att läsa dess tabeller.
- **Inga hemligheter på kommandoraden:**
  - Databaslösenordet sattes med `\password` i psql.
  - `.env` skrevs i `nano` efter `install -m 600 /dev/null`, inte med `printf`.
- **Kontroller längs vägen:**
  - Nginx-filen och crontab kopierades innan de ändrades.
  - Nginx laddades om först efter ett godkänt `nginx -t`.
  - Alla fem sajter svarade efteråt.
- **Live:**
  - Deployen var grön med `Applied: 001_scores.sql`.
  - Ingo loggade in, skrev ett Partitur och valde "Add to library". Efter omladdning fanns det kvar, och det har 1 791 byte i `scores`.
  - Containern använder 71 MB av 256 (54 före).
  - 16 felaktiga inloggningar gav fem 401 och sedan 429, och Nginx loggade 10 `limiting requests`.
- **Backup-raden** provkördes och gav `guitarpractice-20261002.sql` med `-rw-------`. Ett saknat mellanslag i `$(date +…)` upptäcktes och rättades. Utan rättelsen hade filen skrivits över varje natt.
- Serverns Nginx-fil har en egen kommentar överst. Den säger att filen är den aktiva vhosten och att repots kopia uppdateras för hand.
- I förbifarten: Clayrooms domän är `boka.clayroom.se`, inte `boka.keramikstudion.se`. Rättat i `vps-infra` (`apps/clayroom.md`, `README.md` och `SERVER.md`).
