# 05: Partiturinställningar och huvud

**What to build:** Användaren kan ange titel, undertitel, artist och "tabbad av", välja Stämning (förval som standard, Drop D och DADGAD, eller egen per sträng), Capo, starttempo och starttaktart. Huvudet på första Sidan visar titel, undertitel, artist, "tabbad av", Stämning, Capo och tempo. Tonhöjden i notsystemet och vid uppspelning följer Stämning och Capo. Bandnumren i tabben är relativa till Capo.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Det finns en panel eller dialog för metadata, Stämning, Capo, tempo och taktart.
- [ ] Ändringarna går genom Editor-kommandon och kan ångras.
- [ ] Översättaren beräknar rätt tonhöjd för alla förvalda stämningar, en egen stämning och flera capolägen (testat).
- [ ] Huvudet på första Sidan visar alla fälten, och tomma fält utelämnas.
- [ ] En ändrad starttaktart påverkar valideringen av Takter (när 03 är klar).
