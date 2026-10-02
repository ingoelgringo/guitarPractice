# 06: Vy-lägen

**What to build:** Användaren kan växla mellan Vy-lägena *Noter + tabulatur*, *Bara noter* och *Rytmtab* (tabulatur med rytmskaft, utan notsystem). Vy-läget är en egenskap hos Partituret, så det följer med när Partituret sparas och påverkar utskriften.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] Vy-läget ingår i Partiturmodellen och ändras via ett Editor-kommando som kan ångras.
- [x] Översättaren tar varje Vy-läge till rätt inställningar för stavar och visning i alphaTab (testat för alla tre).
- [x] Det finns en väljare i editorn, och notvyn ritas om direkt.
- [x] Markören och inmatningen fungerar i alla tre lägen. I *Bara noter* fortsätter inmatningen att vara tab-först, och markören visar strängen.

## Comments

**Implementerad.** Val och noteringar att känna till:
- Partiturmodellen har fått `viewMode`: `"scoreAndTab"`, `"scoreOnly"` eller `"rhythmTab"`. Ett nytt Partitur visas som noter + tabulatur.
- Editor-kommandot `setViewMode` byter Vy-läge och kan ångras. Ett okänt värde avvisas tyst. Det skyddar inför inläsning från fil (07).
- Översättaren sätter `showStandardNotation` och `showTablature` på staven per Vy-läge. `configureStaves(settings)` i `lib/toAlphaTab.ts` sätter `StaveProfile.Default`, så att stavarna styrs av varje stav, och `TabRhythmMode.Automatic`, så att alphaTab ritar rytmskaft i tabben när notsystemet saknas. Det är Rytmtab. Notvyn och utskriften (13) ska använda samma funktion.
- Väljaren ligger ovanför Sidan som tre knappar. Knappar och inte radioknappar, så att siffror och piltangenter fortsätter att styra editorn efter ett klick.
- Markören:
  - I *Noter + tabulatur* och *Rytmtab* står markören på strängen i tabben.
  - I *Bara noter* är markören en kolumn över slaget i notsystemet med etiketten "String N". Inmatningen är tab-först i alla lägen.
- I *Bara noter* ritar alphaTab inte stämningen i huvudet, eftersom det inte finns någon tabulatur.
- När `.itab` byggs (07) behöver `viewMode` finnas i formatet. Utskriften (13) bör ha ett kriterium om att Vy-läget följs.
- Verifierat i headless Chrome: alla tre lägena ritas, markören hamnar rätt, och ångra återställer Vy-läget.
