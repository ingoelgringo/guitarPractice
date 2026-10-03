# 06: CAGED-former

**What to build:** När ett dur- eller mollackord är valt kan man välja en CAGED-form (C, A, G, E, D). Greppet, med exakt en Prick per sträng eller en dämpad sträng, visas med starkast betoning ovanpå skala, Ackord och eventuell Box. Förminskade Ackord har gråat CAGED-val. Formen ligger i adressen och släpps när den inte längre gäller.

**Blocked by:** 04

**Status:** ready-for-agent

- [x] Tester genom `fretboardView`: E-formen för A-dur har sin grundton på band 5 på sträng 6. Valet är gråat för B° i C-dur.
- [x] CAGED-formen och en Box kan visas samtidigt.
- [x] Formen släpps vid byte till ett Ackord utan form eller vid skalbyte.

## Comments

**Implementerad.**
- Varje form utgår från sitt öppna grepp i standardstämning och flyttas till Ackordets grundton, i det lägsta läget där hela greppet ryms inom band 0–15. Bara ett grepp visas. Dur: C `x32010`, A `x02220`, G `320003`, E `022100`, D `xx0232`. Moll: C `x3101x`, A `x02210`, G `310033`, E `022000`, D `xx0231` (sträng 6 först).
- Greppets Prickar har betoningen `strongest`, ovanpå Ackord och Box. Dämpade strängar ligger i `view.mutedStrings` och ritas som × i en egen kolumn till vänster om sadeln.
- `view.options.cagedShapes` gråar alla former när inget dur- eller mollackord är valt. Formen släpps i det normaliserade urvalet när Ackordet saknas eller blir förminskat, till exempel vid skalbyte.
- Formen ligger i adressen som `caged=E`.
- **Att bekräfta:**
  - Mollens G-form `310033` är svår att greppa. Ett alternativ är att dämpa en sträng.
  - × sitter alltid vid sadeln, även när greppet ligger högt upp på halsen.
