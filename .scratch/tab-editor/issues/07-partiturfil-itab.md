# 07: Partiturfil (.itab)

**What to build:** Användaren kan ladda ner Partituret som en `.itab`-fil och öppna en `.itab`-fil från datorn för att fortsätta redigera. Formatet är versionerad JSON med `schemaVersion` och samma format som ska lagras i databasen. Filen innehåller ingen databasidentitet. Trasiga eller främmande filer ger begripliga fel. Se ADR 0002. Formatet blir ett publikt kontrakt så fort den första filen har laddats ner.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] `serialize(score)` och `parse(text)` är utvecklade med TDD. Rundturstester finns för alla notationselement som existerar när ticketen görs.
- [x] Det finns en ram för kedjade migreringar (version N → N+1). En fixturfil för `schemaVersion` 1 läggs i repot och får aldrig ändras.
- [x] `parse` returnerar strukturerade fel för ogiltig JSON, fel format och en okänd framtida `schemaVersion`. UI:t visar dem begripligt.
- [x] Nedladdningens filnamn utgår från Partiturets titel (säkert filnamn, `.itab`).
- [x] Att öppna en fil ersätter det aktuella Partituret i editorn. Om det finns ändringar som inte är nedladdade frågar editorn först.
- [x] Det är dokumenterat (i testerna eller i en kort kommentar vid modulen) att senare tickets som lägger till notationselement ska utöka rundturstesterna och höja `schemaVersion` med en migrering när formatet ändras.

## Comments

**Implementerad.** Val och noteringar att känna till:
- Dokumentet ser ut så här: `{ "format": "itab", "schemaVersion": 1, "score": { … } }`.
  - `format` finns utöver `schemaVersion`, så att andra JSON-filer känns igen. Fältet är nu en del av det publika kontraktet och borde nämnas i ADR 0002.
  - Dokumentet innehåller ingen databasidentitet.
- `lib/scoreFile.ts`:
  - `serialize(score)` och `parse(text)`. `parse` returnerar `{ ok: true, score }` eller `{ ok: false, error }`, där `error.kind` är `invalidJson`, `notAScoreFile`, `unsupportedVersion` (med `version`) eller `invalidScore`.
  - `fileName(score)` gör ett säkert filnamn av titeln, med "Untitled" som reserv.
  - `migrate` kedjar migreringar (`MIGRATIONS[n]` tar version n till n + 1). Den finns som ram, men listan är tom så länge formatet bara har version 1.
- `parse` kontrollerar hela Partituret mot modellens gränser. Fel typer eller värden utanför gränserna ger `invalidScore`. Okända fält tas bort, `dotted: false` och `triplet: false` utelämnas, och tonerna sorteras efter sträng. Resultatet ser alltså alltid ut som ett Partitur som Editorn har skapat.
- Gränserna (band, tempo, taktart och tonhöjd) har flyttats från `editor.ts` till `score.ts`. De hör till formatet: en snävare gräns gör gamla filer oläsbara och kräver en ny `schemaVersion`. Det står i en kommentar vid gränserna och överst i `scoreFile.ts`, tillsammans med regeln att rundturstesterna ska utökas för varje nytt notationselement.
- `lib/fixtures/score-v1.itab` innehåller alla notationselement som finns i dag och får aldrig ändras.
- Editor-kommandot `openScore` byter Partituret i Editorn, ställer markören först och tömmer ångra-historiken.
- Knapparna "Download" och "Open…" ligger i verktygsraden ovanför Sidan, bredvid väljaren för Vy-läge.
  - Felmeddelandena visas i en röd ruta som går att stänga.
  - Har Partituret ändrats sedan det senast laddades ner eller öppnades frågar editorn med `confirm` innan filen ersätter det.
  - Jämförelsen görs mot serialiserad text, så ändringar som ångras tillbaka räknas inte.
- Inför 08:
  - Komponenten antar att Partituret i början inte har några ändringar, eftersom det är tomt. När ett Utkast återställs måste det räknas som ej nedladdat.
  - Varningen när man lämnar sidan (story 60) kan använda samma jämförelse.
- Saknas en migrering kastar `migrate` ett vanligt fel. Det kan bara hända vid ett programmeringsfel, och fixturtesterna för varje version fångar det.
- Verifierat i headless Chrome:
  - Nedladdningen ger `Untitled.itab` med rätt innehåll.
  - En trasig fil ger ett felmeddelande.
  - Efter en ändring frågar editorn innan filen öppnas. Avböjer man ändras ingenting, och godkänner man ersätts Partituret, inklusive Vy-läget.
  - Öppnar man filen igen utan ändringar kommer ingen fråga.
