# 12: Markering och redigering av Takter

**What to build:** Användaren kan markera ett eller flera slag eller hela Takter med tangentbordet, klicka i notbilden för att flytta markören dit, kopiera, klistra in och ta bort en markering, samt infoga en tom Takt före eller efter den aktuella och ta bort en hel Takt.

**Blocked by:** 04

**Status:** ready-for-agent

- [x] Markeringen (start och slut över slag och Takter) är en del av editorstate och utökas med Shift + piltangenter (TDD).
- [x] Kopiera, klistra in och ta bort markering finns som Editor-kommandon (TDD), inklusive inklistring som spiller över Takter och inklistring i slutet av Partituret.
- [x] Det finns kommandon för att infoga Takt före eller efter och ta bort Takt (TDD).
- [x] Alla operationerna kan ångras som en enhet.
- [x] Ett klick i notbilden översätts av ett tunt skal till kommandot "flytta markören till position".
- [x] Kortkommandona för kopiera, klistra in och ta bort (Ctrl+C, Ctrl+V, Delete) fungerar.

## Comments

**Implementerad.** Val och noteringar att känna till:
- **Markeringen** (`EditorState.selection`) är `{ anchor, head }` i markörens Spår. Båda slagen ingår, och `head` är där markören står. `selectionRange` ger första och sista slaget.
  - `extendSelection` utökar ett slag (Shift+←/→) eller hela Takter (Ctrl+Shift+←/→). En markering av slag växer först till de Takter den berör och får sedan en Takt till eller en färre åt gången.
  - Vänster och höger tar bort markeringen, upp och ner behåller den. Markeringen tas bort när Partituret ändras och vid ångra och gör om. Den hamnar aldrig i historiken.
- **Kopiera och klistra in:**
  - `copy` lägger de markerade slagen i `EditorState.clipboard`. Utan markering händer ingenting. Det kopierade följer med vid ångra och till ett annat Partitur som öppnas.
  - `paste` *skriver över* slag för slag, som när man skriver, från markeringens början eller annars från markören, och fortsätter in i följande Takter. Efter Partiturets sista slag fylls den sista Takten så länge slaget ryms i taktarten, och sedan skapas nya Takter. Takter som får fel längd flaggas av valideringen men rättas inte. Markören hamnar på det sista inklistrade slaget.
  - Bara slagen kopieras, inte Byten och repriser.
- **Ta bort:** `deleteSelection` tar bort de markerade slagen. Helt markerade Takter tas bort. Med en markering gör `deleteNote` och `deleteBeat` (Delete och Shift+Delete) samma sak.
- **Takter:** `insertBarBefore`/`insertBarAfter` infogar en Takt med en paus per slag i den taktart som gäller där, t.ex. sex åttondelspauser i 6/8. Då är Takten giltig direkt. Byten och repriser ligger kvar i sina Takter.
  - `deleteBar` tar bort markörens Takt. Den enda Takten blir i stället en paus.
- **Borttagna Takter och Byten:** Takterna som blir kvar behåller den taktart och det tempo som gällde i dem. Ett Byte i en borttagen Takt flyttas alltså till nästa Takt, och tas första Takten bort blir det som gällde i den nya första Takten Partiturets start. Repriser i en borttagen Takt försvinner med den, och en repris kan då bli utan start eller slut. Det är tillåtet enligt 11.
- Infoga och ta bort Takt görs i alla Spår. Slagen i en markering och inklistringen gäller bara markörens Spår. Nya Takter vid inklistring skapas, som i `advance`, bara där. Det spelar ingen roll i version 1.
- **Alla operationerna** är ett kommando var och ångras därför som en enhet.
- **Skalen:**
  - Klick i notbilden: `locateClick` i `ScoreView.tsx` tar slaget från alphaTabs `getBeatAtPos` och strängen från tabbens ruta, på samma sätt som markören ritas. Ett klick utanför tabben behåller strängen.
  - Markeringen ritas som en ruta per Takt.
  - Kortkommandon: Ctrl+C och Ctrl+V. Ctrl+C släpps igenom när text är markerad på sidan.
  - Knapparna "Insert bar before", "Insert bar after" och "Delete bar" finns i verktygsraden, eftersom ticketen inte anger några kortkommandon för dem.
- Klick, markeringsrutorna och kortkommandona är inte kontrollerade i webbläsaren.
