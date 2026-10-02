# 09: Uppspelning

**What to build:** Användaren kan spela upp Partituret. Spela och pausa, starta från markören, se en markör som följer tonerna medan vyn rullar med, ändra tempot i procent, slå på metronom och intalning. När man skriver in en ton hörs den direkt.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] alphaTabs synth är konfigurerad med en soundfont som serveras som statisk fil (med cachning via Nginx, se 02).
- [ ] Spela och pausa samt start från markörens position fungerar.
- [ ] Markören följer uppspelningen och vyn rullar automatiskt.
- [ ] Tempot kan ändras i procent (t.ex. 25–200 %).
- [ ] Metronom och intalning kan slås av och på.
- [ ] Tonen hörs vid inmatning och kan stängas av.
- [ ] Uppspelningen är ett tunt skal kring alphaTab utan domänlogik, enligt ADR 0001.
