# 10: Speltekniker

**What to build:** Användaren kan markera hammer-on och pull-off, slide, bend med mål (t.ex. ½ eller hel ton) och palm mute. Teknikerna syns i notsystem och tabulatur och hörs vid uppspelning.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] Teknikerna ingår i Partiturmodellen. Hammer-on, pull-off och slide gäller mellan två toner på samma sträng.
- [x] Det finns Editor-kommandon (med kortkommandon) för att växla varje teknik på markörens ton (TDD). Det inkluderar ogiltiga fall, t.ex. hammer-on utan efterföljande ton på samma sträng.
- [x] Översättaren tar varje teknik till alphaTab (testat).
- [x] Om 07 är klar: rundturstester för teknikerna i `.itab`.

## Comments

**Implementerad.** Val och noteringar att känna till:
- **Modellen** (`lib/score.ts`): teknikerna är valfria fält på `Note` och utelämnas när de inte gäller.
  - `hammerPull` är en enda teknik för hammer-on och pull-off. Banden avgör vilken det blir (uppåt hammer-on, nedåt pull-off), precis som alphaTabs `isHammerPullOrigin`.
  - `slide`. Den och `hammerPull` kallas *förbindelser* (`CONNECTIONS`) och utesluter varandra.
  - `bend` är målet i halvtoner: 1 (½ ton), 2 (hel ton) eller 3 (1½ ton).
  - `palmMute` gäller per ton.
- **Förbindelser** leder alltid till tonen på samma sträng i nästa slag, även när det ligger i nästa Takt (`connectionTarget`). Målet måste ha ett annat band.
  - Saknas målet gör kommandot ingenting.
  - Försvinner målet senare, t.ex. för att tonen eller slaget tas bort eller bandet blir detsamma, tar Editorn bort förbindelsen efter varje kommando (`withValidConnections`). Framtida kommandon, som klistra in och ta bort Takt (12), får det automatiskt.
  - En ton som får ett nytt band behåller sina tekniker.
- **Editor-kommandon och kortkommandon:** `toggleHammerPull` (P), `toggleSlide` (L), `cycleBend` (B: ½ → hel → 1½ → ingen) och `togglePalmMute` (M). H och S var redan tagna av Notvärdena. Kortkommandona syns i hjälprutan.
- **Översättaren:** hammer-on/pull-off blir `isHammerPullOrigin`, slide blir `SlideOutType.Shift`, och bend blir `BendType.Bend` med punkter i kvartstoner som når målet halvvägs in i tonen. Palm mute blir `isPalmMute`. alphaTab hittar själv målet för förbindelserna.
- **Partiturfilen:** `schemaVersion` är höjd till **2** enligt regeln i `scoreFile.ts`, med en migrering 1 → 2 som lämnar Partituret orört. Annars hade en äldre, öppen flik tyst tappat teknikerna. Fixturen `lib/fixtures/score-v2.itab` får aldrig ändras.
  - `parse` avvisar en förbindelse utan giltigt mål och en ton med både hammer-on/pull-off och slide (`invalidScore`).
- Teknikerna är testade mot alphaTabs modell. Att de syns och hörs rätt är inte kontrollerat i webbläsaren, och det gäller särskilt hur bend och slide låter.
