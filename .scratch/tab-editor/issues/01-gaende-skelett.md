# 01: Gående skelett: skriv en ton och se den

**What to build:** En besökare öppnar landningssidan, klickar på kortet för Tab-editorn och kommer till editorn, där ett tomt Partitur visas som en A4-Sida i Vy-läget *Noter + tabulatur*. Med piltangenterna flyttar man markören mellan strängar och slag. När man skriver en siffra (0–9) läggs en ton in på markörens sträng som en fjärdedel och syns direkt i både notsystem och tabulatur. Det här är den tunnaste vägen genom alla lager: Partiturmodell → Editor (`apply(state, command)`) → Översättaren till alphaTab → notvy. Den lägger grunden som alla andra tickets bygger på. Se spec: `.scratch/tab-editor/spec.md`, ADR 0001.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Next.js 16-projekt (App Router, TypeScript) med Vitest. `npm test` kör testerna.
- [ ] Landningssidan har ett kort per Verktyg, definierat som data. Just nu finns bara Tab-editorn.
- [ ] Partiturmodellen (Partitur → Spår → Takt → slag och toner med Notvärde) är ren TypeScript utan beroende till alphaTab.
- [ ] Editor-modulen exponerar `apply(state, command)`. Kommandona för att flytta markören (upp, ned, vänster, höger) och skriva ett band är utvecklade med TDD.
- [ ] Översättaren `toAlphaTab(score)` är utvecklad med TDD. Tester verifierar att rätt tonhöjd uppstår i standardstämning.
- [ ] Ett tunt tangentbordsskal översätter tangenttryck till Editor-kommandon. Det innehåller ingen domänlogik.
- [ ] Notvyn renderar Partituret med alphaTab i A4-sidlayout och visar markörens position.
- [ ] Modellen tillåter flera Spår, men editorn skapar exakt ett (6-strängad gitarr, standardstämning, 4/4).
