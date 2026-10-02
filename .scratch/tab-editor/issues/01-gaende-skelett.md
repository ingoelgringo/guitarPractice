# 01: Gående skelett: skriv en ton och se den

**What to build:** En besökare öppnar landningssidan, klickar på kortet för Tab-editorn och kommer till editorn, där ett tomt Partitur visas som en A4-Sida i Vy-läget *Noter + tabulatur*. Med piltangenterna flyttar man markören mellan strängar och slag. När man skriver en siffra (0–9) läggs en ton in på markörens sträng som en fjärdedel och syns direkt i både notsystem och tabulatur. Det här är den tunnaste vägen genom alla lager: Partiturmodell → Editor (`apply(state, command)`) → Översättaren till alphaTab → notvy. Den lägger grunden som alla andra tickets bygger på. Se spec: `.scratch/tab-editor/spec.md`, ADR 0001.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Next.js 16-projekt (App Router, TypeScript) med Vitest. `npm test` kör testerna.
- [x] Landningssidan har ett kort per Verktyg, definierat som data. Just nu finns bara Tab-editorn.
- [x] Partiturmodellen (Partitur → Spår → Takt → slag och toner med Notvärde) är ren TypeScript utan beroende till alphaTab.
- [x] Editor-modulen exponerar `apply(state, command)`. Kommandona för att flytta markören (upp, ned, vänster, höger) och skriva ett band är utvecklade med TDD.
- [x] Översättaren `toAlphaTab(score)` är utvecklad med TDD. Tester verifierar att rätt tonhöjd uppstår i standardstämning.
- [x] Ett tunt tangentbordsskal översätter tangenttryck till Editor-kommandon. Det innehåller ingen domänlogik.
- [x] Notvyn renderar Partituret med alphaTab i A4-sidlayout och visar markörens position.
- [x] Modellen tillåter flera Spår, men editorn skapar exakt ett (6-strängad gitarr, standardstämning, 4/4).

## Comments

**Implementerad.** Noteringar från granskningen, att ta med i senare tickets:
- Höger pil från ett sista slag med toner skapar ett nytt slag i samma Takt utan gräns. Ticket 03 ersätter det med att Takter fylls och nya skapas.
- Taktarten 4/4 ligger i modellen som starttaktart för Partituret. Byten per Takt kommer i ticket 11.
- `locateCursor` i notvyn antar att tabbens BeatBounds kommer sist och att barens `visualBounds.h` motsvarar avståndet mellan sträng 1 och den sista strängen. Det ska kontrolleras igen när Vy-lägen (06) och speltekniker (10) införs.
- Konventionen för strängnumrering är utspridd över Editor, Översättare och notvy. Den kan samlas om den börjar skava.
- Stämningen är `number[]` (MIDI). En egen `Tuning`-typ kan komma i ticket 05.
- alphaTabs attribution "rendered by alphaTab" är medvetet kvar.
