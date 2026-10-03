# 02: Urvalet i adressen

**What to build:** Grundton och Skala ligger i adressens query-parametrar, så att man kan bokmärka och dela ett urval. En adress med saknade eller ogiltiga värden faller tillbaka på standardval (A mollpentatonik) utan att sidan går sönder. Senare tickets lägger till sina egna parametrar på samma sätt.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] Ett byte av Grundton eller Skala uppdaterar adressen utan en ny post i historiken per klick (eller enligt ett medvetet val).
- [x] När man öppnar en adress med parametrar visas samma urval.
- [x] Ogiltiga eller saknade värden ger standardvalet. Tolkningen testas.

## Comments

**Implementerad** tillsammans med 03.
- En andra testsöm, godkänd av Ägaren: `choiceFromParams` och `choiceToParams`. Valet ligger i `?root=Eb&scale=blues&labels=notes`.
- Grundtonen skrivs i adressen med engelska namn och ♭ för de svarta tangenterna, men tolkas utan hänsyn till skiftläge och även med `#`. Ogiltiga värden faller tillbaka var för sig till A mollpentatonik.
- Sidan läser parametrarna på servern, som Tab-editorn gör med `?score=`. Ett byte skrivs med `history.replaceState`, så historiken får ingen ny post per klick.
