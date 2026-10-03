# 04: Ackord från skalan

**What to build:** Man väljer ett Ackord bland skalans diatoniska treklanger, visade med steg och namn ("ii – Dm"). Pentatonik och blues tar ackorden från sin Föräldraskala. Det valda Ackordets toner lyser över hela halsen och skalans övriga toner tonas ner. Ett Ackord som inte längre gäller efter ett skalbyte släpps. Ackordet ligger i adressen.

**Blocked by:** 02

**Status:** ready-for-agent

- [x] Tester genom `fretboardView`: C-dur erbjuder I–vii° (C, Dm, Em, F, G, Am, B°). A mollpentatonik erbjuder ackorden i A naturlig moll.
- [x] Prickarna får en betoning: ackordtoner framhävda och övriga skaltoner nedtonade.
- [x] Urvalet normaliseras, så att ett ogiltigt Ackord släpps.
- [x] Ackordet går att välja bort (bara skala).

## Comments

**Implementerad.**
- `fretboardView` tar `chord` (steg 1–7 i Föräldraskalan) och ger `options.chords` (steg, romersk siffra, namn stavat efter tonarten), `dot.emphasis` (`muted`/`scale`/`highlighted`) och det normaliserade `selection`.
- Ackordet ligger i adressen som `chord=2`.
- Ackordtoner utanför skalan visas också som framhävda Prickar, t.ex. H i ii° för A mollpentatonik. Annars skulle ackordet sakna toner på halsen.
- **Att bekräfta:** Ackordet lagras som steg, som specen säger. Ett skalbyte behåller därför steget, så V – G i C-dur blir v – Gm i C mollpentatonik. Alla v1-skalor har en sjutonig Föräldraskala, så i praktiken släpps bara steg som är ogiltiga i adressen (0, 8, 2.5). Om ett skalbyte i stället ska släppa ett Ackord vars namn ändras behövs en ändring.
- En ogiltig `chord` i adressen ignoreras vid laddning men står kvar i adressen tills nästa val.
