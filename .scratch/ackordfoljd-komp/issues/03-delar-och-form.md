# 03: Delar och Form

**What to build:** Man skapar Delar med unika namn och valt antal Takter, och Formen bestämmer i vilken ordning de spelas. Formen visas som en rad med Delarnas namn: man lägger till en Del i slutet, drar för att ändra ordningen och tar bort med ett kryss. Att ta bort en Del tar bort den ur Formen. ↑/↓ byter Del i editorn. Uppspelningen följer Formen, och man kan loopa en enskild Del.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [x] Delar och Form i modellen: unika namn, ta bort ur Formen, förflyttning med ↑/↓ och ←/→ över gränsen mellan Delar (tester först).
- [x] Uppspelningsplanen rullar ut Formen och Ackord klingar vidare mellan Delar. Loop av en Del (tester).
- [x] Editorn för Delar (namn, antal Takter) och raden för Formen med dra och släpp.
- [x] Att minska antalet Takter tar bort Ackorden i de Takter som försvinner (tester).

## Comments

**2026-11-09:** Byggt. Modellen i `lib/progression.ts` har fått `addSection` (4 Takter, sist bland Delarna och i Formen, med ett unikt namn som "Verse 2"), `renameSection` och `sectionNameError` (tomt namn eller ett som en annan Del har, utan hänsyn till skiftläge), `setSectionBars` (1–64 Takter, Ackorden i Takter som försvinner tas bort), `removeSection` (tar bort Delen ur Formen, den sista Delen finns kvar), `addToForm`, `removeFromForm` och `moveInForm`. Förflyttningen över gränsen mellan Delar fanns redan från ticket 01. `playbackPlan(progression, { loop })` loopar en enskild Del och spelar Formen när Delen inte finns. Ackord klingar vidare in i nästa Del, och en Del som står två gånger spelas två gånger. I editorn har varje Del ett namnfält, ett fält för antal Takter och ett kryss. Under Delarna finns knappen *Ny del* och raden för Formen (`components/ProgressionFormRow.tsx`): man drar med pekare (mus och finger, med `touch-action: none`), flyttar med Alt+←/→ och tar bort med ett kryss. Valet *Loopa* (Hela formen eller en Del) ligger vid Play. Efter granskningen ändrar ett tömt fält för antal Takter ingenting. Tangenter i Delens rubrik når inte Takterna, och Escape ångrar det man skrivit i fälten. Obs inför ticket 05: rubrikens `stopPropagation` hindrar Ctrl+Z från att nå Takternas `onKeyDown`, så ångra bör lyssna högre upp. CONTEXT.md säger "_Avoid_: Loop" under Repris, men specen säger "loopa en Del". Det kan behöva en egen term. Kvar: att prova dra och släpp i webbläsaren, också på mobil.
