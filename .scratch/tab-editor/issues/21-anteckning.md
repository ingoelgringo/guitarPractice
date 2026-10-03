# 21: Anteckning

**What to build:** Användaren kan skriva en Anteckning (fri kort text, t.ex. "let ring") vid ett Slag. `A` öppnar samma slags textfält som för Ackordnamn (ticket 20), med samma Enter, Esc och Tab. Anteckningen påverkar inte uppspelningen.

**Blocked by:** 20

**Status:** ready-for-agent

- [x] `Beat` har det valfria fältet `annotation`, högst 40 tecken efter trim.
- [x] Editor-kommandot `setBeatText` (field `annotation`) sätter eller tar bort Anteckningen på Markörens Slag (även en paus) och går att ångra. Den följer Slaget vid kopiera, klistra in och ta bort.
- [x] `.itab` läser och validerar fältet. Det hamnar i samma `schemaVersion` som ticket 20 om de levereras tillsammans.
- [x] Översättaren visar Anteckningen i alla tre Vy-lägen: under notsystemet, eller ovanför tabben i Rytmtab (alphaTabs placering av sångtext, godkänd av Ägaren).
- [x] `A` öppnar fältet, och hjälprutan visar kortkommandot.

## Comments

**Implementerad** tillsammans med 20 (samma kommando, samma fält, samma v4).
- Anteckningen ritas som `beat.lyrics`. alphaTab lägger sångtext under notsystemet, och utan notsystem (Rytmtab) ovanför tabben. I Noter + tabulatur hamnar den alltså mellan stavarna. Ägaren har godkänt den placeringen framför att rita en egen rad, som inte skulle få plats i alphaTabs layout.
