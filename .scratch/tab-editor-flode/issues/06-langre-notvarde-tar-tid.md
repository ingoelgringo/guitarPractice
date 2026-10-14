# 06: Längre Notvärde tar tid från följande Slag

**What to build:** Ett längre Notvärde (W/H/Q/E/S/T, punktering på, triol av) utan Shift bevarar tiden genom att ta den från de följande Slagen, även över taktstreck. Det går bara om tiden består av pauser eller av Slag med exakt samma (sträng, band), och om inget av de Slag som tas har ett eget Ackordnamn eller en egen Anteckning. Det sista Slaget som berörs får kortas, så att resten står kvar på samma tidpunkt. Går det inte visas en notis som säger varför, och ingenting ändras.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Sextondel C och sextondelspaus, E ger åttondel C.
- [ ] Sextondel C och sextondel C, E ger åttondel C med det förstas tekniker och texter.
- [ ] Sextondel C och fjärdedelspaus, E ger åttondel C, och resten av pausen fylls med Pausregeln så att följande Slag står kvar.
- [ ] Sextondel C och fjärdedel C, E kortar fjärdedelen så att den slutar på samma tidpunkt.
- [ ] Sextondel C och sextondel D stoppas med notisen "nästa Slag har en annan ton". Ett senare Slag med eget Ackordnamn eller egen Anteckning stoppas med en egen notis.
- [ ] Den sista sextondelen i en Takt som blir åttondel tar från nästa Takt, och det förlängda Slaget delas med en Bindebåge över taktstrecket.
- [ ] Punktering på och triol av följer samma regler.
- [ ] Alla tester genom `apply`.
