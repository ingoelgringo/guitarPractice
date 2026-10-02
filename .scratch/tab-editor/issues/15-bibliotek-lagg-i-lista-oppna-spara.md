# 15: Bibliotek: lägg i, lista, öppna och spara

**What to build:** Inloggad har Ägaren ett Bibliotek. En biblioteksvy listar Partitur (titel, artist, senast ändrad), och man kan öppna dem i editorn och spara (manuellt i den här ticketen). Nya Partitur som Ägaren skapar läggs i Biblioteket direkt. Ett importerat eller lokalt Partitur läggs där först när man väljer "Lägg i biblioteket". Varje sparning kontrolleras mot revisionen. En Gäst ser och når inget av detta.

**Blocked by:** 07, 14

**Status:** ready-for-agent

- [ ] `pg` utan ORM och numrerade SQL-migreringar med ett migreringskommando. Postgres 18 i Docker för lokal utveckling och tester, och som service-container i CI.
- [ ] Tabellen för Partitur: id (uuid), titel, artist, dokument (`jsonb` i `.itab`-formatet), `schemaVersion`, revision, `created_at` och `updated_at`.
- [ ] Det finns API för att skapa, lista, hämta och spara. Spara tar emot förväntad revision och ger ny revision, eller 409 med serverns revision. Kontrollen är atomisk.
- [ ] Alla anrop utan session ger 401, och det finns inga skrivbara endpoints utan inloggning.
- [ ] API-testerna går mot en riktig Postgres (TDD) och täcker 401, skapa, lista, hämta, spara med rätt revision och 409 vid fel revision.
- [ ] Biblioteksvyn finns i UI:t, liksom "Lägg i biblioteket" och "Spara".
- [ ] Ett nytt Partitur skapat av en inloggad Ägare hamnar i Biblioteket direkt. Ett importerat gör det inte.
