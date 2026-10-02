# 03: Notvärden och rytm

**What to build:** Användaren kan styra rytmen fullt ut medan hen skriver. Man väljer Notvärde (helnot till trettiotvåondel) med kortkommandon, punkterar, markerar trioler och lägger in pauser. Tvåsiffriga band (t.ex. 12) fungerar. När en Takt är full och man fortsätter skriva skapas en ny Takt automatiskt. Takter med för få eller för många slag flaggas visuellt men rättas aldrig tyst.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Editor-kommandon finns för att sätta Notvärde, växla punktering, växla triol och lägga in paus, utvecklade med TDD.
- [ ] Tvåsiffriga band tolkas i Editorn (t.ex. "1" följt av "2" inom kort tid blir band 12), med tester för gränsfallen.
- [ ] En ny Takt skapas automatiskt när den aktuella är full.
- [ ] En härledd valideringsfunktion pekar ut Takter med fel antal slag, och notvyn markerar dem.
- [ ] Översättaren tar Notvärden, punktering, trioler och pauser till alphaTab (testat).
- [ ] Kortkommandona är dokumenterade i en hjälpruta eller ett hjälpfönster i editorn.
