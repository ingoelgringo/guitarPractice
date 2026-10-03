# 04: Hovring och tangentbord

**What to build:** Hovring över en cell, en radrubrik eller en kolumnrubrik förhandsvisar det urvalet på halsen, med en svag bakgrund på det hovrade. När musen lämnar tabellen visas det valda igen. Hovring skrivs inte i adressen. Med fokus i tabellen flyttar piltangenterna valet: upp och ner byter Ackord och vänster och höger byter Box, och valet stannar vid kanten. Escape avmarkerar.

**Blocked by:** 03

**Status:** ready-for-agent

- [x] Hovring ändrar halsen men inte adressen. Att lämna tabellen återställer det valda.
- [x] Piltangenterna flyttar valet och skriver det i adressen, och stannar vid kanten.
- [x] Escape avmarkerar, och tabben når tabellen.

## Comments

**Implementerad.**
- Hovringen är tillstånd i `Fretboard`. Halsen ritas från `fretboardView` med det hovrade urvalet ovanpå det valda, medan tabellen och adressen följer det valda. Det hovrade får en svag bakgrund (`data-hovered`). Ett val (klick, piltangent, Escape) släpper hovringen, så halsen visar det valda direkt.
- Piltangenterna utgår från det valda Ackordets rad och den valda Boxens kolumn. Upp och ner byter Ackord och vänster och höger byter Box, och valet stannar vid kanten. Utan valt Ackord väljer upp och ner det första. Utan vald Box väljer vänster och höger Box 1. Bara det man har valt flyttas: en vald rad förblir en rad, och en vald cell förblir en cell där formen följer med (inget för förminskade Ackord). Fokus följer med till den valda knappen.
- Escape avmarkerar när fokus är i tabellen. Tabellens knappar ligger i tabbordningen.
- Logiken för tangentbordet ligger i komponenten och har inga enhetstester, eftersom specen bara har `fretboardView` som söm. Hovring, adressen, kanterna, Escape och tabben är verifierade i headless Chrome via DevTools-protokollet.

