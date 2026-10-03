# 01: Greppbräda med skala

**What to build:** Ett kort för Greppbrädan på landningssidan leder till en ny sida med en länk tillbaka. Sidan visar en liggande hals (sträng 1 överst, band 0–15, bandmarkeringar på 3, 5, 7, 9 och 12). Man väljer Grundton (12) och Skala (dur, naturlig moll, durpentatonik, mollpentatonik, blues), och skalans toner visas som Prickar över hela halsen med intervalletiketter. Grundtonen har en egen färg. Det här är den första tunna skivan genom hela Verktyget.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Den rena sömmen `fretboardView(selection)` finns och tar Grundton, Skala och Stämning (MIDI per lös sträng, sträng 1 först). Den ger Prickar med sträng, band, etikett och om Prickan är Grundton.
- [x] Tester först genom sömmen: A mollpentatonik på sträng 6 ger band 0, 3, 5, 8, 10, 12, 15. Band 5 är Grundton med "1" och band 8 har "♭3". Inga Prickar utanför band 0–15 eller utanför skalan. Blues innehåller ♭5.
- [x] Ett nytt Verktyg syns som kort på landningssidan och leder till sidan, som är öppen för Gäster.
- [x] Halsen ritas liggande med bandmarkeringar. På smal skärm skrollar den horisontellt.
- [x] Byte av Grundton eller Skala ritar om Prickarna direkt.

## Comments

**Implementerad.**
- Sömmen `fretboardView` tar Grundton (tonklass), Skala och Stämning och ger Prickar med sträng, band, intervalletikett och `isRoot`. Den har fem tester, bland annat Drop D för att visa att halsen följer Stämningen.
- Halsen ritas som SVG: sadel, band 0–15, bandmarkeringar (dubbel på 12) och Grundtonen i egen färg. Den skrollar i sidled på smal skärm.
- Grundtonsnamnen är tillfälliga engelska namn tills Notnamnsläget kommer (03). Kortets text nämner bara skalor tills Ackord, Boxar och CAGED finns.
- "Läge" är reserverat för Box, så halsens inlays heter *bandmarkeringar*.
