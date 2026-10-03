# 01: Treklangstabellen

**What to build:** Flikarna blir "CAGED", "Penta" och "Triads". I Treklangsfliken finns dropdownen "Strings" ovanför tabellen, med sju Strängset (6-5-4, 5-4-3, 4-3-2, 3-2-1, 6-4-3, 5-3-2, 4-2-1) och 3-2-1 förvalt. Treklangstabellen har Skalans Ackord som rader och Box 1–5 som kolumner. Varje cell visar Omvändningen (R, 3 eller 5) för det Treklangsgrepp på Strängsetet som ligger närmast Boxen. Närmast betyder flest toner inne i Boxens band, sedan minst avstånd utanför och sedan lägst band. Förminskade Ackord har grepp. En vald cell visar Treklangsgreppet orange i varje kopia av den blå Boxen, utan ×-markeringar. Klick, hovring, piltangenter och Escape fungerar som i de andra Flikarna. Adressen får `tab=triads` och `strings`.

**Blocked by:** –

**Status:** ready-for-agent

- [ ] Tester genom `fretboardView`: varje cell är R, 3 eller 5 för alla Skalor, Ackord och Strängset. När en Omvändning ryms helt i Boxen ligger cellens grepp i Boxen, och annars sticker det ut.
- [ ] Tester genom `fretboardView`: en cell lägger en ton per sträng i Strängsetet i Ackordets lager, med cellens Omvändning lägst, i varje kopia av Boxen. Boxens övriga toner ligger i Boxens lager. Den överhoppade strängen i t.ex. 6-4-3 får ingen orange Prick. `caged` släpps och `mutedStrings` är tom.
- [ ] Tester för adressen: `tab=triads` och `strings` läses och skrivs. Saknas `strings`, eller är det ogiltigt, gäller 3-2-1.
- [ ] Dropdownen syns bara i Treklangsfliken, och Flikarna går att välja med klick och tangentbord.
