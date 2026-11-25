# 04: Egna stämningar

**What to build:** Man skapar en egen stämning för det valda Stränginstrumentet genom att utgå från en befintlig, stämma varje sträng (eller varje Strängpar) ±halvton med tonnamnet synligt och ge den ett namn. Egna stämningar listas efter de färdiga i stämningsvalet och kan redigeras, byta namn och tas bort. De färdiga är låsta. Allt sparas i `localStorage` med `schemaVersion` och syns bara i Stämmaren.

**Blocked by:** 03

**Status:** done

- [x] Formatet och lagringen: skapa, ändra, byta namn, ta bort och ogiltig data (tester först).
- [x] Halvtonsstegen per sträng, med en rimlig gräns för hur långt man kan stämma (tester).
- [x] UI för att skapa och redigera stämningar, och bekräftelse innan man tar bort en.
- [x] Om den valda stämningen tas bort faller valet tillbaka på instrumentets standardstämning (tester).

## Comments

**2026-11-25:** Byggt.
- **Logik (TDD):** `lib/customTunings.ts` sparar de egna stämningarna under `guitarPractice.tuner.customTunings` med `schemaVersion` 1. Namnet är nyckeln: inom ett Stränginstrument får ingen egen stämning heta som en annan eller som en färdig, oavsett stora och små bokstäver, och namnet är högst 40 tecken. Ogiltiga poster hoppas över vid läsning.
- **Gräns för halvtonsstegen:** en oktav under och en kvint över Stränginstrumentets färdiga toner för strängen, men aldrig under det Stämmaren hör (A#0, från `MIN_FREQUENCY` i `lib/pitch.ts`). Ett Strängpar stäms som en enhet.
- **Fallback:** `readTunerSettings` letar bland både färdiga och egna stämningar, så en borttagen egen stämning ger instrumentets standardstämning.
- **UI:** Knapparna Ny stämning, Redigera och Ta bort under stämningsvalet. Redigera och Ta bort syns bara för egna stämningar. Redigeraren har namn och −/+ per sträng med tonnamnet. Borttagning bekräftas med `confirm`. De egna stämningarna listas i en egen grupp efter de färdiga.
- **Prövat i Chromium (390 px):** skapa, tomt och upptaget namn, val efter sparning och omladdning, byta namn, ta bort med fallback, inga konsolfel.
- **Känt:** Byter en annan flik namn på den valda stämningen faller den här fliken tillbaka på standardstämningen.
