# 05: Boxar

**What to build:** Man väljer Box 1–5 för skalan, numrerade från läget med Grundtonen på sträng 6. Boxen framhävs på alla ställen den förekommer inom band 0–15 och resten av skalan tonas ner. Fem boxar finns för alla v1-skalor (dur och moll som pentatonikens lägen med två extra toner). Boxen ligger i adressen.

**Blocked by:** 02

**Status:** ready-for-agent

- [x] Tester genom `fretboardView`: Box 1 i A mollpentatonik framhäver band 5–8 på alla strängar. En box som går utanför band 15 visas också en oktav ner om den får plats.
- [x] Boxen kan kombineras med ett valt Ackord (04) utan att lagren krockar, om 04 är klar.
- [x] Boxen går att välja bort.

## Comments

**Implementerad.**
- Box k börjar på sträng 6 på pentatonikens k:te ton och har två pentatoniska toner per sträng i stigande ordning. Box 1 börjar alltså på Grundtonen. Dur och naturlig moll bygger på dur- och mollpentatonikens boxar, och blues på mollpentatonikens. Skalans extra toner läggs på den grannsträng som håller dem närmast boxens band.
- Durpentatonikens Box 1 har samma form som mollpentatonikens Box 2, eftersom båda numreras från Grundtonen på sträng 6.
- Boxen visas på varje ställe där hela boxen får plats inom band 0–15, en oktav ner eller upp. Bara om den inte får plats någonstans visas de delar som ryms.
- Lagren är filter. En Prick som klarar alla valda lager (Ackord, Box) framhävs. En som klarar något av dem blir skalton, och en som inte klarar något tonas ner. Ackordtoner utanför skalan hör till Boxen när de ligger inom boxens band.
- Boxen ligger i adressen som `box=1`.
- **Att bekräfta:**
  - När en extra ton ligger lika långt utanför boxen på båda grannsträngarna vinner den ljusare strängen. Det ger det vanliga Box 1 i A naturlig moll (H på G-strängen band 4). Men i Box 5 hamnar F på ljusa e band 1 i stället för på H-strängen band 6.
  - Extra toner under boxens första eller över dess sista pentatoniska ton tas inte med. Det gäller till exempel H på sträng 6 band 7 i C-durs Box 1.
