# 03: CAGED-tabellen

**What to build:** Under rubriken "CAGED" i panelen visas CAGED-tabellen. Den har Skalans Ackord som rader ("ii – Dm"), Box 1–5 som kolumner och i varje cell bokstaven för den form som ligger i Boxen. Formerna fördelas per rad som en rotation av C-A-G-E-D, vald efter största överlapp mellan greppens och Boxarnas band. Förminskade Ackord har "–". Ett klick på en cell väljer Ackord, Box och form. Ett klick på en radrubrik väljer bara Ackordet och ett klick på en kolumnrubrik bara Boxen. Ett klick på det valda igen avmarkerar. Den valda cellen har en tydlig ram. Tabellen ersätter dropdowns för Chord, Box och CAGED.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [ ] Tester genom `fretboardView`: raden för I i C-dur är E, D, C, A, G. Varje rad för dur- och mollackord har varje form exakt en gång. Raden för vii° i C-dur har inga former.
- [ ] Tabellen följer Skalan: A mollpentatonik har raderna i–VII från A naturlig moll.
- [ ] Klick på cell, radrubrik och kolumnrubrik väljer och avmarkerar som beskrivet, och valet skrivs i adressen (`chord`, `box`, `caged`).
- [ ] Bokmärken från v1 öppnar rätt cell som vald.
