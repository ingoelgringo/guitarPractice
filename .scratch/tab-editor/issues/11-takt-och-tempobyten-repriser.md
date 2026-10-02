# 11: Takt- och tempobyten samt repriser

**What to build:** Användaren kan ändra taktart och tempo från en viss Takt och markera början och slut på en repris med antal varv. Notbilden visar ändringarna, och uppspelningen följer dem.

**Blocked by:** 03

**Status:** ready-for-agent

- [x] Det finns Editor-kommandon för att sätta och ta bort ett taktartsbyte och ett tempobyte på markörens Takt (TDD).
- [x] Valideringen av Takter och den automatiska nya Takten följer gällande taktart.
- [x] Det finns Editor-kommandon för reprisstart, reprisslut och antal varv (TDD), inklusive ogiltiga kombinationer.
- [x] Översättaren tar taktartsbyten, tempobyten och repriser till alphaTab (testat).
- [x] Om 07 är klar: rundturstester i `.itab`.

## Comments

**Implementerad.** Val och noteringar att känna till:
- **Modellen** (`lib/score.ts`): bytena och repriserna är valfria fält på `Bar`, som utelämnas när de inte gäller.
  - `timeSignature` och `tempo` är *Byten* (`BarChange`). De gäller från sin Takt till nästa Byte. `timeSignatureAt` och `tempoAt` ger det som gäller i en Takt.
  - `repeatStart`. `repeatEnd` är antalet varv sammanlagt, 2–99.
  - Första Takten har inga Byten. Där gäller `Score.timeSignature` och `Score.tempo`, som nu är starten.
  - Fälten gäller hela Partituret. Editorn sätter dem i varje Spår som har Takten, och översättaren läser dem från det första. Att flera Spår hålls lika upprätthålls inte av `parse`, och `advance` lägger fortfarande bara till nya Takter i markörens Spår. Det spelar ingen roll i version 1, som har ett Spår.
- **Editor-kommandon:**
  - `setBarTimeSignature`/`clearBarTimeSignature` och `setBarTempo`/`clearBarTempo`. På första Takten ändrar `set*` starten. Ett Byte till det som redan gäller före Takten blir inget Byte.
    - Ett Byte som *blir* överflödigt senare, t.ex. när ett tidigare Byte ändras, ligger kvar. Det låter likadant men ritas ut.
  - `toggleRepeatStart`, `toggleRepeatEnd` (ett nytt slut får 2 varv) och `setRepeatCount`.
    - Ogiltigt: antal varv utanför 2–99, decimaltal och antal varv utan reprisslut.
    - Repriser utan start, starter utan slut och repriser i varandra är tillåtna. alphaTab spelar dem som beskrivs vid `Bar.repeatEnd`, och testerna i `toAlphaTab.test.ts` låser det.
  - Kortkommandon: `[` och `]` växlar reprisstart och reprisslut, även med AltGr/Option (svenskt tangentbord).
- **Validering och ny Takt** följer taktarten som gäller i Takten.
- **UI:** Score settings har en ruta för markörens Takt ("Bar N"). Där finns taktart och tempo från Takten (med "Remove change" när Takten har ett eget Byte), reprisstart, reprisslut och antal varv.
- **Översättaren:** taktarten sätts på varje MasterBar, Byten av tempo blir tempomarkeringar, och repriserna blir `isRepeatStart` och `repeatCount`. Uppspelningsordningen och tempot är testade med alphaTabs `MidiFileGenerator`.
- **Partiturfilen:** `schemaVersion` är **3**, med en migrering 2 → 3 som lämnar Partituret orört. Fixturen `lib/fixtures/score-v3.itab` får aldrig ändras. `parse` avvisar Byten på första Takten och värden utanför gränserna.
- Panelen och kortkommandona är inte kontrollerade i webbläsaren.
