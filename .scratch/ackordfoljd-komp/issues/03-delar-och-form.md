# 03: Delar och Form

**What to build:** Man skapar Delar med unika namn och valt antal Takter, och Formen bestämmer i vilken ordning de spelas. Formen visas som en rad med Delarnas namn: man lägger till en Del i slutet, drar för att ändra ordningen och tar bort med ett kryss. Att ta bort en Del tar bort den ur Formen. ↑/↓ byter Del i editorn. Uppspelningen följer Formen, och man kan loopa en enskild Del.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [ ] Delar och Form i modellen: unika namn, ta bort ur Formen, förflyttning med ↑/↓ och ←/→ över gränsen mellan Delar (tester först).
- [ ] Uppspelningsplanen rullar ut Formen och Ackord klingar vidare mellan Delar. Loop av en Del (tester).
- [ ] Editorn för Delar (namn, antal Takter) och raden för Formen med dra och släpp.
- [ ] Att minska antalet Takter tar bort Ackorden i de Takter som försvinner (tester).
