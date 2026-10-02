# 12: Markering och redigering av Takter

**What to build:** Användaren kan markera ett eller flera slag eller hela Takter med tangentbordet, klicka i notbilden för att flytta markören dit, kopiera, klistra in och ta bort en markering, samt infoga en tom Takt före eller efter den aktuella och ta bort en hel Takt.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Markeringen (start och slut över slag och Takter) är en del av editorstate och utökas med Shift + piltangenter (TDD).
- [ ] Kopiera, klistra in och ta bort markering finns som Editor-kommandon (TDD), inklusive inklistring som spiller över Takter och inklistring i slutet av Partituret.
- [ ] Det finns kommandon för att infoga Takt före eller efter och ta bort Takt (TDD).
- [ ] Alla operationerna kan ångras som en enhet.
- [ ] Ett klick i notbilden översätts av ett tunt skal till kommandot "flytta markören till position".
- [ ] Kortkommandona för kopiera, klistra in och ta bort (Ctrl+C, Ctrl+V, Delete) fungerar.
