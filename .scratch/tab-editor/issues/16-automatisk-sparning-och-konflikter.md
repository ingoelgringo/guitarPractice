# 16: Automatisk sparning och konflikter

**What to build:** Partitur i Biblioteket sparas automatiskt 2 sekunder efter senaste ändringen, när fliken stängs eller döljs och när nätet kommer tillbaka. En statusindikator visar *Sparat*, *Sparar…* eller *Ej sparat (offline)*. Om Partituret har ändrats på en annan flik eller enhet (409) stoppas den automatiska sparningen, och en banner låter Ägaren välja Ladda om, Spara som kopia eller Skriv över. Ändringarna ligger hela tiden kvar i Utkastet, så inget går förlorat.

**Blocked by:** 08, 15

**Status:** ready-for-agent

- [ ] Bibliotekssynken är en tillståndsmaskin (Sparat, Sparar, Ej sparat (offline), Konflikt) som testas utan DOM och utan riktigt nätverk (TDD).
- [ ] Debounce på 2 sekunder, sparning vid `visibilitychange`/`pagehide` och ny sparning vid `online`.
- [ ] Vid 409 stoppas den automatiska sparningen och en banner visar de tre valen.
- [ ] "Skriv över" använder API:t för att skriva över oavsett revision, och "Spara som kopia" skapar ett nytt Partitur i Biblioteket. Båda testas på API-nivå.
- [ ] Utkastet uppdateras med Biblioteks-id och revision, så att ändringar gjorda offline överlever en omladdning.
- [ ] Den manuella "Spara"-knappen från 15 ersätts av statusindikatorn.
