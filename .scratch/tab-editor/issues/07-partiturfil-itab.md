# 07: Partiturfil (.itab)

**What to build:** Användaren kan ladda ner Partituret som en `.itab`-fil och öppna en `.itab`-fil från datorn för att fortsätta redigera. Formatet är versionerad JSON med `schemaVersion` och samma format som ska lagras i databasen. Filen innehåller ingen databasidentitet. Trasiga eller främmande filer ger begripliga fel. Se ADR 0002. Formatet blir ett publikt kontrakt så fort den första filen har laddats ner.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `serialize(score)` och `parse(text)` är utvecklade med TDD. Rundturstester finns för alla notationselement som existerar när ticketen görs.
- [ ] Det finns en ram för kedjade migreringar (version N → N+1). En fixturfil för `schemaVersion` 1 läggs i repot och får aldrig ändras.
- [ ] `parse` returnerar strukturerade fel för ogiltig JSON, fel format och en okänd framtida `schemaVersion`. UI:t visar dem begripligt.
- [ ] Nedladdningens filnamn utgår från Partiturets titel (säkert filnamn, `.itab`).
- [ ] Att öppna en fil ersätter det aktuella Partituret i editorn. Om det finns ändringar som inte är nedladdade frågar editorn först.
- [ ] Det är dokumenterat (i testerna eller i en kort kommentar vid modulen) att senare tickets som lägger till notationselement ska utöka rundturstesterna och höja `schemaVersion` med en migrering när formatet ändras.
