# 15: Bibliotek: lägg i, lista, öppna och spara

**What to build:** Inloggad har Ägaren ett Bibliotek. En biblioteksvy listar Partitur (titel, artist, senast ändrad), och man kan öppna dem i editorn och spara (manuellt i den här ticketen). Nya Partitur som Ägaren skapar läggs i Biblioteket direkt. Ett importerat eller lokalt Partitur läggs där först när man väljer "Lägg i biblioteket". Varje sparning kontrolleras mot revisionen. En Gäst ser och når inget av detta.

**Blocked by:** 07, 14

**Status:** ready-for-agent

- [x] `pg` utan ORM och numrerade SQL-migreringar med ett migreringskommando. Postgres 18 i Docker för lokal utveckling och tester, och som service-container i CI.
- [x] Tabellen för Partitur: id (uuid), titel, artist, dokument (`jsonb` i `.itab`-formatet), `schemaVersion`, revision, `created_at` och `updated_at`.
- [x] Det finns API för att skapa, lista, hämta och spara. Spara tar emot förväntad revision och ger ny revision, eller 409 med serverns revision. Kontrollen är atomisk.
- [x] Alla anrop utan session ger 401, och det finns inga skrivbara endpoints utan inloggning.
- [x] API-testerna går mot en riktig Postgres (TDD) och täcker 401, skapa, lista, hämta, spara med rätt revision och 409 vid fel revision.
- [x] Biblioteksvyn finns i UI:t, liksom "Lägg i biblioteket" och "Spara".
- [x] Ett nytt Partitur skapat av en inloggad Ägare hamnar i Biblioteket direkt. Ett importerat gör det inte.

## Comments

**Implementerad.** Val och noteringar att känna till:
- **Databas lokalt:** `docker compose up -d` startar `postgres:18` på port **5433**, eftersom 5432 ofta är upptagen. Databasen `guitarpractice` används för utveckling och `guitarpractice_test` för testerna. Testdatabasen skapas av `db/init/` när volymen skapas.
  - `DATABASE_URL=postgres://guitarpractice:guitarpractice@localhost:5433/guitarpractice npm run migrate` migrerar dev-databasen. Kommandot läser också `.env.local` om den finns.
  - Testerna migrerar själva och tömmer `scores`. De läser `TEST_DATABASE_URL`, med ovanstående testdatabas som standard. Utan Docker faller `app/api/library.test.ts`.
- **Migreringar:** numrerade filer i `db/migrations/` körs av `scripts/migrate.mjs`, var och en i en egen transaktion. Tabellen `schema_migrations` håller reda på vilka som har körts, och ett advisory lock hindrar samtidiga körningar. En körd migrering får aldrig ändras.
  - **Till 18:** `scripts/` och `db/` ingår inte i standalone-bygget, så deploy-jobbet måste få med dem. `pg` finns i `.next/standalone/node_modules`.
- **API** (`app/api/library/`, allt ger 401 utan session):
  - `GET /api/library` ger `{ scores: [{ id, title, artist, updatedAt, revision }] }`, senast ändrade först.
  - `POST /api/library` tar Partiturfilen som JSON och svarar 201 med `{ id, revision: 1 }`.
  - `GET /api/library/:id` ger `{ id, revision, updatedAt, document }`.
  - `PUT /api/library/:id` tar `{ document, revision }` och svarar `{ revision }`, eller 409 med `{ revision }` från servern. Ett okänt eller ogiltigt id ger 404, och ett ogiltigt dokument eller en saknad revision ger 400.
  - Dokumentet läses med `parse`, så äldre versioner migreras och databasen har alltid aktuell `schemaVersion`.
  - Revisionskontrollen är en enda `UPDATE … WHERE id AND revision`. Testet med tre samtidiga sparningar visar att bara en lyckas.
- **UI:**
  - `/library` är en serverrenderad lista som ger 404 för en Gäst. Landningssidan har en diskret länk "Library" bredvid "Log out".
  - Länken i listan öppnar `/tab-editor?score=<id>`. Har Utkastet ändringar som varken är nedladdade eller sparade frågar den först (`replacingLosesWork` i `lib/draft.ts`). Är Utkastet samma revision med osparade ändringar behålls det i stället.
  - Editorn tar bort `?score` ur adressen direkt, så att en omladdning läser Utkastet och inte ersätter ändringarna.
  - Verktygsraden har för Ägaren "Library" och antingen "Add to library" eller "Save"/"Saved". Fel visas som ett meddelande, och konflikten visas tills vidare bara som text.
- **Utkastet** bär nu `library: { id, revision, saved }`. Varningen när sidan lämnas och frågan vid New och Open gäller ett osparat biblioteks-Partitur på samma sätt som ett Partitur som inte är nedladdat.
- **Nya Partitur:** bara "New" lägger ett Partitur i Biblioteket. Det tomma Partitur som editorn startar med när inget Utkast finns läggs inte dit, annars skulle varje besök lämna ett tomt Partitur efter sig.
- **Kvar till 16 (kända begränsningar):**
  - Efter en 409 behåller klienten sin gamla revision, så nya försök ger 409 igen tills bannern med Ladda om, Spara som kopia och Skriv över finns.
  - Klickar man New två gånger snabbt kan en tom rad hamna i Biblioteket utan att editorn pekar på den.
  - Frågan vid New nämner bara nedladdning, även för ett osparat biblioteks-Partitur.
- **Verifierat** mot `next dev` med curl: en Gäst får 401 och 404 på `/library`, och Ägaren kan skapa, lista och se Partituret i `/library`. `/tab-editor?score=<id>` ger 200, och ett ogiltigt id ger 404. `next build` går igenom. Knapparna i webbläsaren är inte provade manuellt.
