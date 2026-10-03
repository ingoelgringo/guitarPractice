# 02: Lager och färger

**What to build:** Prickarna får lager i stället för v1:s betoning: orange (greppet, eller Ackordets toner när inget grepp finns), blått (Boxen, eller skalan när ingen Box är vald) och nedtonat. Grundtoner får en kantlinje: mörkblå för Skalans Grundton och mörkorange för Ackordets grundton, som vinner när båda är samma Prick. Den tjocka svarta ringen försvinner. Med en vald Box ritas greppet i varje kopia av Boxen där det får plats. Se tabellen över lager i specen.

**Blocked by:** –

**Status:** ready-for-agent

- [x] Tester genom `fretboardView` för varje rad i specens lagertabell: inget val, bara Box, bara Ackord, cell och cell med förminskat Ackord.
- [x] Prickarna anger vilken grundton de är (Skalans, Ackordets eller ingen), och vid Ackord I vinner Ackordets.
- [x] Ett grepp med vald Box ritas inne i Boxen, i varje kopia där det får plats (till exempel Box 4 i A mollpentatonik vid band 0–3 och 12–15).
- [x] Halsen ritar lagren med orange, blått och nedtoning, och grundtonerna med mörk kantlinje, i både ljust och mörkt tema.

## Comments

**Implementerad.**
- Prickarna har `layer` (`chord`, `box`, `scale` eller `muted`) och `rootRole` (`scale`, `chord` eller `none`) i stället för `emphasis` och `isRoot`. Lagret för orange heter `chord`, eftersom det också gäller Ackordets toner när inget grepp finns.
- Med en vald Box ritas greppet i varje kopia av Boxen, i det oktavläge som har flest toner inom kopians band. Om inget läge rör Boxen gäller v1:s regel (lägsta läget).
- v1-bokmärken som inte motsvarar en rad i lagertabellen:
  - Ackord + Box utan form visas som "Cell, förminskat Ackord": Ackordets toner i Boxen orange.
  - Ackord + form utan Box visar bara greppet orange och tonar ner resten.
- Ackordets grundton får mörkorange kantlinje även på nedtonade Prickar. Kantlinjen på nedtonade Prickar har halv opacitet.
- Begreppet Lager finns nu i CONTEXT.md, och CAGED-formens glosa är uppdaterad: formen visar ett grepp i varje kopia av Boxen.
- Verifierad med skärmdumpar i headless Chrome, i ljust och mörkt tema.
