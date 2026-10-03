# 20: Ackordnamn

**What to build:** Användaren kan skriva ett Ackordnamn (fri text, t.ex. "Am7") ovanför ett Slag. `C` öppnar ett textfält vid Markörens Slag:
- Enter sparar och stänger.
- Esc avbryter.
- Tab sparar och öppnar fältet på nästa Slag, och Shift+Tab på föregående.
- Tom text tar bort Ackordnamnet.

Ackordnamnet tolkas inte, har inget diagram och påverkar inte uppspelningen.

**Blocked by:** 12

**Status:** ready-for-agent

- [x] `Beat` har det valfria fältet `chordName`, högst 16 tecken efter trim.
- [x] Editor-kommandot `setBeatText` (field `chordName`) sätter eller tar bort Ackordnamnet på Markörens Slag (även en paus) och går att ångra. Ett oförändrat värde blir inget ångrasteg. Med en Markering ändras bara Markörens Slag.
- [x] Ackordnamnet följer Slaget när man kopierar, klistrar in och tar bort.
- [x] `.itab` får `schemaVersion` 4 med en migrering från 3 och en fixtur för v4. Inläsningen avvisar ett Ackordnamn som inte är en sträng eller som är för långt.
- [x] Översättaren visar Ackordnamnet ovanför Slaget i alla tre Vy-lägen, utan diagram.
- [x] `C` öppnar fältet, och hjälprutan visar kortkommandot.
- [x] Fältet ligger vid Markören, och editorns kortkommandon fångar inte tangenter medan man skriver i det.

## Comments

**Implementerad.** Val och noteringar:
- Ackordnamn och Anteckning delar ett kommando: `setBeatText { field: BeatText; text }`, där `BeatText = "chordName" | "annotation"`. Gränserna finns i `MAX_BEAT_TEXT_LENGTH` i `lib/score.ts`.
- `.itab` v4 (`lib/fixtures/score-v4.itab`). Inläsningen kräver text utan blanksteg runt, inte tom och inom gränsen, alltså så som Editorn skriver den.
- alphaTab: ett `model.Chord` per unikt namn på staven (namnet är id), med `showDiagram = false`.
- `keyToBeatText` i `lib/keyboard.ts` översätter C/A till ett fält. Det är inget Editor-kommando, eftersom fältet bara finns i UI:t.
- `BeatTextField` ritas via `cursorOverlay` på `ScoreView`, vid Markörens ruta. Tab använder `neighbourBeat` (exporterad från editorn), som inte skapar nya slag i slutet. Där stänger Tab fältet i stället.
- Verifierat i headless Chrome: C → "Am" → Tab → "G" → Enter ger Am och G ovanför slagen i alla tre Vy-lägen.
