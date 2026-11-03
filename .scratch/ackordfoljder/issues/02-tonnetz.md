# 02: Tonnetz

**What to build:** En ruta med fast höjd bredvid Kvintcirkeln (överst på smal skärm) med en Tonnetz. Hörnen visar tonnamn och varje triangel visar ackordnamnet i mitten. Kvinter ligger vågrätt och terserna längs diagonalerna, enligt gittret i specen. C-dur står mitt i rutan från början. Ytan dras åt alla håll med mus eller finger och tar aldrig slut, eftersom de synliga trianglarna räknas fram ur förskjutningen.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Tester för gittret: tonklassen för ett hörn, dur- och molltrianglarna (C-dur och grannen Em), att de synliga trianglarna täcker rutan med C-dur i mitten vid förskjutning 0 och att en hel period ger samma Ackord.
- [ ] Tester för skillnaden mellan klick och dragning (tröskel cirka 5 px).
- [ ] Tonnetzen som SVG med Pointer Events för mus och pekskärm. Sidan scrollar inte medan man drar.
- [ ] Notnamnsläget styr tonnamnen och ackordnamnen.
- [ ] Layouten: bredvid varandra på bred skärm, Tonnetz överst på smal.
