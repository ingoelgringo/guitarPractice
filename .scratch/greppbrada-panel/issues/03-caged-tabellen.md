# 03: CAGED-tabellen

**What to build:** Under rubriken "CAGED" i panelen visas CAGED-tabellen. Den har Skalans Ackord som rader ("ii – Dm"), Box 1–5 som kolumner och i varje cell bokstaven för den form som ligger i Boxen. Formerna fördelas per rad som en rotation av C-A-G-E-D, vald efter största överlapp mellan greppens och Boxarnas band. Förminskade Ackord har "–". Ett klick på en cell väljer Ackord, Box och form. Ett klick på en radrubrik väljer bara Ackordet och ett klick på en kolumnrubrik bara Boxen. Ett klick på det valda igen avmarkerar. Den valda cellen har en tydlig ram. Tabellen ersätter dropdowns för Chord, Box och CAGED.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [x] Tester genom `fretboardView`: raden för I i C-dur är E, D, C, A, G. Varje rad för dur- och mollackord har varje form exakt en gång. Raden för vii° i C-dur har inga former.
- [x] Tabellen följer Skalan: A mollpentatonik har raderna i–VII från A naturlig moll.
- [x] Klick på cell, radrubrik och kolumnrubrik väljer och avmarkerar som beskrivet, och valet skrivs i adressen (`chord`, `box`, `caged`).
- [x] Bokmärken från v1 öppnar rätt cell som vald.

## Comments

**Implementerad.**
- `view.options.cagedTable` har en rad per Ackord (steg, siffra, namn) med en cell per Box: `{ box, shape }`, där `shape` är `null` för förminskade Ackord. Den ersätter `options.chords` och `options.cagedShapes`.
- Rotationen av C-A-G-E-D väljs efter flest greppstoner inom Boxarnas band, summerat över de fem Boxarna. Vid lika poäng vinner den första rotationen. Greppen placeras med samma mått som halsen använder för greppet i en vald Box.
- Kolumnrubrikerna är alltid den kompakta formen: "1"–"5" under rubriken "Box".
- Ett v1-bokmärke markerar en cell när Ackord, Box och form motsvarar den. Annars markeras ingen cell men halsen visar urvalet. Det gäller till exempel Ackord och form utan Box, en form som inte ligger i Boxen, eller Ackord och Box utan form för ett dur- eller mollackord.
- Klicken på cell, radrubrik och kolumnrubrik, avmarkeringen och adressen är verifierade i headless Chrome via DevTools-protokollet.
