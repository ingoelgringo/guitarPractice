# 13: Utskrift och mobilvisning

**What to build:** Användaren kan skriva ut Partituret via webbläsaren. Utskriften innehåller bara de renderade A4-Sidorna (med huvudet), en Sida per papper, och fungerar med "Spara som PDF". På mobil kan man visa och spela upp ett Partitur men inte redigera det.

**Blocked by:** 05

**Status:** ready-for-agent

- [x] Det finns en utskriftsknapp i editorn.
- [x] Print-CSS döljer verktygsfält, paneler och markör och ger A4 med sidbrytning per Sida.
- [x] Utskriften följer Partiturets Vy-läge.
- [ ] Resultatet är verifierat manuellt i Chrome och Firefox, inklusive "Spara som PDF".
- [x] På smal skärm eller pekenhet döljs redigeringsverktygen. Visning och uppspelning fungerar.

## Comments

**Implementerad.** Val och noteringar att känna till:
- **Print…** i verktygsraden anropar `window.print()`. Ingen PDF skapas på servern.
- **Print-CSS** (`@media print` i `TabEditor.module.css`, `@page` i `globals.css`):
  - Allt i editorn utom `.page` döljs, liksom markören, markeringen, Takter med fel längd och alphaTabs spelmarkör. Spelmarkören har `display` som inline-stil från alphaTab och kräver `!important`.
  - `@page` är A4 med 15 mm marginal, samma som Sidan på skärmen, så notbilden är lika bred (680 px) och radbrytningarna blir desamma.
  - Systemen flyttas från absolut positionering in i flödet med `break-inside: avoid`, nästan samma recept som alphaTabs egen `print()`. Systemen blir `display: block` i stället för alphaTabs inline-block, så att `break-inside` gäller även i Firefox. Sidbrytningen hamnar då mellan system, och huvudet står överst på första Sidan.
  - Klingande toner färgas bara på skärmen. Utskriften är ljus även i mörkt läge.
- **Lazy loading i alphaTab är avstängd**, annars ritas bara de system som syns och resten blir tomma på papperet.
- **Verifierat i headless Chrome** (`Page.printToPDF`, A4): ett Partitur med 60 Takter ger 11 Sidor i *Noter + tabulatur*, 5 i *Bara noter* och 4 i *Rytmtab*. Inga verktyg syns, och mörkt läge ger vit utskrift.
  - **Firefox och dialogen "Spara som PDF" är inte verifierade.** Firefox finns inte på maskinen. Ägaren behöver kontrollera det för hand.
- **Mobil:** Vid `max-width: 640px` eller `pointer: coarse` döljs Score settings, kortkommandona, Vy-läget och knapparna för Takter. Kvar finns New, Open…, Download, Print… och uppspelningen. Ett tryck i notbilden flyttar markören, som är uppspelningens startpunkt.
  - Kortkommandona är avstängda i samma läge (`VIEW_ONLY_MEDIA` i `TabEditor.tsx`, samma fråga som i CSS:en). Ett smalt skrivbordsfönster går alltså inte heller att redigera i.
  - Verifierat i headless Chrome med 390 px bredd och touch: verktygen är dolda, ett tryck flyttar markören och Play startar uppspelningen.
- **Smal skärm:** Sidan krymper till skärmens bredd med A4:s proportioner, och alphaTab bryter raderna efter bredden. Det blir läsbart på en telefon, men radbrytningen är inte densamma som på papper.
  - En nedskalning med alphaTabs `display.scale` provades. Under ungefär 80 % gav den ändå andra radbrytningar än på papper, och noterna blev mycket små.
  - Skriver man ut från ett fönster smalare än A4 följer utskriften fönstrets radbrytning.
