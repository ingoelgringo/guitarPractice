# 16: Automatisk sparning och konflikter

**What to build:** Partitur i Biblioteket sparas automatiskt 2 sekunder efter senaste ändringen, när fliken stängs eller döljs och när nätet kommer tillbaka. En statusindikator visar *Sparat*, *Sparar…* eller *Ej sparat (offline)*. Om Partituret har ändrats på en annan flik eller enhet (409) stoppas den automatiska sparningen, och en banner låter Ägaren välja Ladda om, Spara som kopia eller Skriv över. Ändringarna ligger hela tiden kvar i Utkastet, så inget går förlorat.

**Blocked by:** 08, 15

**Status:** ready-for-agent

- [x] Bibliotekssynken är en tillståndsmaskin (Sparat, Sparar, Ej sparat (offline), Konflikt) som testas utan DOM och utan riktigt nätverk (TDD).
- [x] Debounce på 2 sekunder, sparning vid `visibilitychange`/`pagehide` och ny sparning vid `online`.
- [x] Vid 409 stoppas den automatiska sparningen och en banner visar de tre valen.
- [x] "Skriv över" använder API:t för att skriva över oavsett revision, och "Spara som kopia" skapar ett nytt Partitur i Biblioteket. Båda testas på API-nivå.
- [x] Utkastet uppdateras med Biblioteks-id och revision, så att ändringar gjorda offline överlever en omladdning.
- [x] Den manuella "Spara"-knappen från 15 ersätts av statusindikatorn.

## Comments

**Implementerad.** Val och noteringar att känna till:
- **Bibliotekssynken** finns i `lib/librarySync.ts` (klassen `LibrarySync`) och testas med falska timers och ett falskt Bibliotek i `lib/librarySync.test.ts`.
  - Konstruktorn har inga sidoeffekter. `start()` och `stop()` styrs av en effekt i TabEditor, och `subscribe` och `state` passar `useSyncExternalStore`. `state` är samma objekt tills något ändras.
  - Utöver de fyra tillstånden i specen finns `unauthorized` (utloggad, nästa ändring försöker igen) och `notFound` (borttaget, sparningen stoppas). Under väntetiden efter en ändring visas *Saving…*.
  - Efter en misslyckad sparning görs inget nytt försök förrän nästa ändring, `online`, eller att fliken döljs.
  - Skriv över gäller tills det har lyckats, även om första försöket görs offline.
- **API:** `PUT /api/library/:id` med `{ document, overwrite: true }` sparar oavsett revision. Om servern redan har exakt samma dokument blir en sparning med gammal revision ingen 409, utan servern svarar med sin revision. Det behövs eftersom svaret på en sparning vid `pagehide` aldrig når fliken, så att Utkastet har kvar den gamla revisionen.
- **Anrop med `keepalive`:** alla anrop under 60 kB skickas med `keepalive`, så att sparningen vid `pagehide` hinner fram. Större Partitur skickas utan och ligger då kvar i Utkastet.
- **UI:**
  - Knappen Save är ersatt av en statusindikator (`role="status"`).
  - Vid konflikt visas en banner med Reload, Save as copy och Overwrite.
    - *Reload* hämtar den sparade versionen.
    - *Save as copy* lägger den aktuella versionen i Biblioteket som ett nytt Partitur med samma titel och fortsätter arbetet i kopian.
- **Kvarstående begränsningar:**
  - Ändrar man något medan en sparning pågår och stänger fliken innan den är klar, finns ändringen bara i Utkastet. Nästa laddning ger då en konflikt mot fliken själv, och Overwrite löser den.
  - Konflikten sparas inte i Utkastet. Efter en omladdning visas bannern först när nästa sparning får 409.
  - Från 15 kvarstår att ett dubbelklick på New kan lämna en tom rad i Biblioteket, och att frågan vid New bara nämner nedladdning.
- **Verifierat:** Vitest (enhets- och API-tester mot Postgres), typkontroll, lint och `next build`. Knapparna i webbläsaren är inte provade manuellt.
