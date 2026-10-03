# 02: Lager och färger

**What to build:** Prickarna får lager i stället för v1:s betoning: orange (greppet, eller Ackordets toner när inget grepp finns), blått (Boxen, eller skalan när ingen Box är vald) och nedtonat. Grundtoner får en kantlinje: mörkblå för Skalans Grundton och mörkorange för Ackordets grundton, som vinner när båda är samma Prick. Den tjocka svarta ringen försvinner. Med en vald Box ritas greppet i varje kopia av Boxen där det får plats. Se tabellen över lager i specen.

**Blocked by:** –

**Status:** ready-for-agent

- [ ] Tester genom `fretboardView` för varje rad i specens lagertabell: inget val, bara Box, bara Ackord, cell och cell med förminskat Ackord.
- [ ] Prickarna anger vilken grundton de är (Skalans, Ackordets eller ingen), och vid Ackord I vinner Ackordets.
- [ ] Ett grepp med vald Box ritas inne i Boxen, i varje kopia där det får plats (till exempel Box 4 i A mollpentatonik vid band 0–3 och 12–15).
- [ ] Halsen ritar lagren med orange, blått och nedtoning, och grundtonerna med mörk kantlinje, i både ljust och mörkt tema.
