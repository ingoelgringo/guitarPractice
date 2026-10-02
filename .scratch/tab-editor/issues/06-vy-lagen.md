# 06: Vy-lägen

**What to build:** Användaren kan växla mellan Vy-lägena *Noter + tabulatur*, *Bara noter* och *Rytmtab* (tabulatur med rytmskaft, utan notsystem). Vy-läget är en egenskap hos Partituret, så det följer med när Partituret sparas och påverkar utskriften.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Vy-läget ingår i Partiturmodellen och ändras via ett Editor-kommando som kan ångras.
- [ ] Översättaren tar varje Vy-läge till rätt inställningar för stavar och visning i alphaTab (testat för alla tre).
- [ ] Det finns en väljare i editorn, och notvyn ritas om direkt.
- [ ] Markören och inmatningen fungerar i alla tre lägen. I *Bara noter* fortsätter inmatningen att vara tab-först, och markören visar strängen.
