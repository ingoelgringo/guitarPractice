# 03: Notvärden och rytm

**What to build:** Användaren kan styra rytmen fullt ut medan hen skriver. Man väljer Notvärde (helnot till trettiotvåondel) med kortkommandon, punkterar, markerar trioler och lägger in pauser. Tvåsiffriga band (t.ex. 12) fungerar. När en Takt är full och man fortsätter skriva skapas en ny Takt automatiskt. Takter med för få eller för många slag flaggas visuellt men rättas aldrig tyst.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] Editor-kommandon finns för att sätta Notvärde, växla punktering, växla triol och lägga in paus, utvecklade med TDD.
- [x] Tvåsiffriga band tolkas i Editorn (t.ex. "1" följt av "2" inom kort tid blir band 12), med tester för gränsfallen.
- [x] En ny Takt skapas automatiskt när den aktuella är full.
- [x] En härledd valideringsfunktion pekar ut Takter med fel antal slag, och notvyn markerar dem.
- [x] Översättaren tar Notvärden, punktering, trioler och pauser till alphaTab (testat).
- [x] Kortkommandona är dokumenterade i en hjälpruta eller ett hjälpfönster i editorn.

## Comments

**Implementerad.** Val och noteringar att känna till:
- Kortkommandon: W/H/Q/E/S/T för helnot till trettiotvåondel, `.` för punktering, `/` för triol och R för paus. Hjälprutan ("Keyboard shortcuts", uppe till höger) byggs från samma tabell som tangentbordsskalet.
- Notvärdet ligger på slaget. "Aktuellt Notvärde" är alltså slaget under markören och inte ett eget fält i editorns state, som spec-modul 2 beskriver. `setDuration`, punktering och triol ändrar slaget under markören. Nya slag ärver Notvärdet från slaget före.
- Om det ärvda Notvärdet inte ryms i Takten får det nya slaget det längsta vanliga Notvärde som ryms. Till exempel blir det en fjärdedel efter en punkterad halvnot i 4/4. Editorn skapar alltså aldrig själv en för lång Takt. Gör användaren den för lång flaggas den, men rättas inte.
- En paus (R) gör slaget under markören tyst och går vidare. Höger på ett tomt sista slag skapar inget nytt slag.
- Tvåsiffriga band: en andra siffra inom 1000 ms på samma ställe slås ihop med den första om resultatet är högst 24. Annars ersätter den andra siffran den första. Alla andra kommandon bryter sammanslagningen.
- Valideringen (`invalidBars`) flaggar inte den sista Takten i ett Spår när den är för kort, eftersom det är där man skriver. Är den för lång flaggas den. Valideringen testas direkt som ren funktion och inte via `apply`, vilket avviker lite från specens fyra testgränser.
- Markeringen i notvyn är ett överlägg ovanpå alphaTabs `MasterBarBounds`. Den är inte visuellt verifierad i webbläsaren än.
