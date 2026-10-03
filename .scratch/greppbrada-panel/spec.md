# Spec: Greppbrädans panel och CAGED-tabellen

Status: ready-for-agent

## Problem Statement

På Greppbrädan väljer man Ackord, Box och CAGED-form i tre separata dropdowns. Man ser inte hur de hänger ihop: vilken CAGED-form för ett Ackord som ligger i vilken Box. Att jämföra kräver många klick. Kontrollerna ligger dessutom i en rad ovanför halsen, och lagren på halsen (Ackord, Box, grepp) skiljs bara åt med ringar och nedtoning.

## Solution

Alla val flyttas till en panel till höger om halsen. Överst väljer man Grundton och Skala och nederst etiketter och Notnamnsläge. Emellan finns Fliken *CAGED* med CAGED-tabellen: Skalans Ackord som rader, Boxarna som kolumner och i varje cell den CAGED-form som ligger i Boxen. Hovring förhandsvisar en cell. Ett klick väljer den, och piltangenterna flyttar valet. På halsen lyser greppet orange och Boxen blått, och resten tonas ner.

## User Stories

1. Som gitarrist på dator vill jag ha alla val i en panel till höger om halsen, så att halsen och valen syns samtidigt.
2. Som gitarrist vill jag välja Grundton och Skala överst i panelen, så att det jag väljer först står först.
3. Som gitarrist vill jag välja etiketter och Notnamnsläge nederst i panelen, så att inställningarna inte står i vägen.
4. Som gitarrist på en laptop vill jag att halsen krymper så att den får plats bredvid panelen, så att jag slipper skrolla.
5. Som gitarrist på telefon vill jag att panelen ligger under halsen, så att båda går att använda.
6. Som gitarrist vill jag se en tabell med Skalans Ackord som rader och Box 1–5 som kolumner, så att jag ser alla kombinationer på en gång.
7. Som gitarrist vill jag att varje cell visar bokstaven för den CAGED-form som ligger i Boxen, så att jag lär mig vilken form som hör till vilket läge.
8. Som gitarrist vill jag att varje form förekommer exakt en gång per rad, så att tabellen speglar CAGED-systemets ordning längs halsen.
9. Som gitarrist vill jag att förminskade Ackord har en rad med "–" i cellerna, så att jag ser att ackordet finns men saknar CAGED-form.
10. Som gitarrist vill jag att hovring över en cell förhandsvisar Boxen och greppet på halsen, så att jag kan bläddra snabbt.
11. Som gitarrist vill jag att halsen visar mitt val igen när musen lämnar tabellen, så att hovring inte ändrar något.
12. Som gitarrist vill jag välja en cell med ett klick, så att Boxen och greppet ligger kvar.
13. Som gitarrist vill jag flytta valet med piltangenterna (upp/ner byter Ackord, vänster/höger byter Box, stopp vid kanten), så att jag kan öva utan mus.
14. Som gitarrist vill jag avmarkera med Escape eller genom att klicka på det valda igen, så att jag kommer tillbaka till bara skalan.
15. Som gitarrist vill jag klicka på en rads rubrik för att välja bara Ackordet, så att jag ser dess toner över hela halsen.
16. Som gitarrist vill jag klicka på en kolumns rubrik för att välja bara Boxen, så att jag ser läget utan ackord.
17. Som gitarrist vill jag att greppet lyser orange och Boxen blått medan resten tonas ner, så att lagren går att skilja åt med en blick.
18. Som gitarrist vill jag att greppet ritas inne i Boxen, även när Boxen syns på två ställen på halsen, så att orange alltid ligger i blått.
19. Som gitarrist vill jag att Skalans Grundton har mörkblå kantlinje och Ackordets grundton mörkorange, så att jag hittar båda.
20. Som gitarrist vill jag att Ackordets grundton vinner när den är samma ton som Skalans (Ackord I), så att greppets grundton syns.
21. Som gitarrist vill jag att ett förminskat Ackord i en Box visar sina toner i Boxen orange, så att jag ser ackordet i läget.
22. Som gitarrist vill jag se vilken cell som är vald (tydlig ram) och vilken jag hovrar över (svag bakgrund), så att jag vet var jag är.
23. Som gitarrist vill jag att mitt val fortfarande ligger i adressen (Ackord, Box, CAGED-form), så att bokmärken från v1 fungerar.

## Implementation Decisions

- **Ersätter v1:s dropdowns** för Ackord, Box och CAGED-form. Root, Scale, Labels och Note names blir kvar som dropdowns i panelen. Raden "Automatisk koppling mellan Box och CAGED-form" i v1-specens Out of Scope upphävs.
- **Cellens form**: för varje Ackord fördelas de fem formerna på de fem Boxarna som en rotation av C-A-G-E-D (formernas ordning uppåt längs halsen). Rotationen väljs så att greppens band överlappar Boxarnas band mest. Greppet får sticka ut något band utanför Boxen. Förminskade Ackord har inga former.
- **Greppets läge**: med en vald Box ritas greppet i varje kopia av Boxen där det får plats inom band 0–15. Utan Box gäller v1:s regel (lägsta läget).
- **Lager och färger**: fyllningen följer lagren, orange för greppet (eller Ackordets toner när inget grepp finns), blått för Boxen (eller skalan när ingen Box är vald) och nedtonat för resten. Grundtoner markeras med kantlinje: mörkblå för Skalans Grundton och mörkorange för Ackordets grundton, som vinner när båda är samma Prick. Den tjocka svarta ringen för framhävda Prickar försvinner.

  | Valt | Orange | Blått | Nedtonat |
  |---|---|---|---|
  | Inget | – | alla skaltoner | – |
  | Bara Box | – | Boxen | resten |
  | Bara Ackord | Ackordets toner över hela halsen | – | resten |
  | Cell | greppet | Boxen | resten |
  | Cell, förminskat Ackord | Ackordets toner i Boxen | Boxen | resten |

- **Gränssnittet** `fretboardView(selection) → view` behålls som enda söm. Prickarna beskriver lager och grundtonsroll, inte färger. Det kan till exempel vara ett lager (`grip` / `box` / `scale` / `muted`) och vilken grundton Pricken är (Skalans, Ackordets eller ingen). `view.options` får CAGED-tabellen: rader per Ackord med steg och namn, och per Box cellens form eller ingen.
- **Hovring** är bara tillstånd i klientkomponenten: halsen ritas från `fretboardView` med det hovrade urvalet, och adressen skrivs bara vid klick, piltangenter och Escape.
- **Fliken**: rubriken "CAGED" visas ovanför tabellen. Någon flikmekanik och någon parameter i adressen byggs först när en andra Flik finns.
- **Layout**: panelen ligger till höger från cirka 1060 px fönsterbredd, annars under halsen. Halsens SVG skalas med tillgänglig bredd ner till cirka 70 %, och skrollar i sidled därunder. Cellerna visar bara bokstaven. Kolumnrubrikerna är "Box 1"–"Box 5", eller "1"–"5" under rubriken "Box" om det är trångt.
- Adressparametrarna `chord`, `box` och `caged` är oförändrade.

## Testing Decisions

- Testerna går genom `fretboardView` som i v1. Exempel:
  - CAGED-tabellens rad för I i C-dur är E, D, C, A, G för Box 1–5.
  - Varje rad för dur- och mollackord innehåller varje form exakt en gång.
  - En cell i Box 4 i A mollpentatonik ritar greppet både vid band 0–3 och 12–15 när det får plats.
  - Skalans Grundton och Ackordets grundton får rätt roll, och vid Ackord I vinner Ackordets.
  - Lagren för ett förminskat Ackord i en Box.
- Panelen, tabellens hovring och tangentbordet verifieras manuellt i appen, som v1:s komponent.
- Test först med Vitest (TDD).

## Out of Scope

Flikar för treklanger och för fyrklanger och utökade ackord (7, 9, 11, 13). Flikmekanik och flik i adressen. Pekskärmsgester utöver tryck. Ändrade CAGED-grepp. Andra stämningar i gränssnittet.

## Further Notes

Flikbegreppet och CAGED-tabellen finns i `CONTEXT.md`. Nästa Flik blir troligen treklanger, och tabellen bör därför byggas så att panelen kan få fler Flikar utan att halsen ändras.
