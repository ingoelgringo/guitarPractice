# 05: Skjuta: infoga, ta bort och Shift + Notvärde

**What to build:** Följande Slag Skjuts genom hela Spåret, över taktstrecken. `I` och `Insert` infogar ett tomt Slag före Markören med samma Notvärde som Slaget där, och allt efter Skjuts fram. Shift+Delete och Delete med Markering tar bort och Skjuter tillbaka. Shift + Notvärdestangent ändrar bara Slaget och Skjuter allt efter med skillnaden. En ton över ett taktstreck delas med en Bindebåge, och bundna halvor i samma Takt slås ihop. Byten och repriser sitter kvar på sin Takt.

**Blocked by:** 03, 04

**Status:** ready-for-agent

- [ ] Skjutningen som en ren funktion i partiturmodellen, med tester: Slagen läggs om efter taktarterna. En paus över ett taktstreck delas enligt Pausregeln och en ton i bundna delar. Bundna halvor i samma Takt slås ihop när summan är ett Notvärde. Byten och repriser stannar på sin Takt.
- [ ] Slutet av Spåret: vid flytt tillbaka fylls sista Takten med pauser, och vid flytt fram skapas nya Takter. En tom sista Takt som uppstår tas bort, om den inte är den enda.
- [ ] En triolgrupp som skulle delas av ett taktstreck stoppar Skjutningen med en notis.
- [ ] `insertBeat` (`I`, `Insert`), med en knapp i Edit-panelen. Markören står på det nya Slaget.
- [ ] `deleteBeat` och borttagning av en Markering Skjuter tillbaka. Hela Takter i en Markering tas bort som idag.
- [ ] `setDuration` med Shift för alla sex Notvärdena. `keyToCommand` skiljer Shift+bokstav från bokstav. Test i `keyboard.test.ts`.
- [ ] Tester genom `apply`: Shift+S i åtta åttondelar, en infogad sextondel i fyra fjärdedelar (Bindebåge över taktstrecket) och samma par som slås ihop när det Skjuts tillbaka, och en Skjutning förbi ett byte till 3/4.
