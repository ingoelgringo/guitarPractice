# Spec: Penta-fliken

Status: ready-for-agent

## Problem Statement

I panelen kan man bara se Ackorden genom CAGED-tabellen. När man improviserar över ett Ackord vill man ofta spela Ackordets penta, t.ex. D mollpentatonik över ii – Dm i C-dur. Man ser inte vilken box i den pentan som ligger i den Box man redan spelar i. Grundton och Skala står dessutom under varandra med etiketterna framför, så valet läses inte som "C Major".

## Solution

Panelen får en andra Flik, *Penta*, bredvid *CAGED*. Penta-tabellen har samma rader (Skalans Ackord) och kolumner (Box 1–5) som CAGED-tabellen. Varje cell visar numret på den Penta-box i Ackordets penta som ligger i kolumnens Box. Ett val av en cell visar den Penta-boxen orange inne i den blå Boxen. Flikarna fungerar likadant: hovring, klick, piltangenter och Escape. Grundton och Skala står bredvid varandra med etiketterna ovanför.

## User Stories

1. Som gitarrist vill jag ha Root och Scale bredvid varandra med etiketterna ovanför, så att valet läses som "C Major".
2. Som gitarrist vill jag välja mellan Flikarna CAGED och Penta i panelen, så att jag kan byta perspektiv på samma Ackord.
3. Som gitarrist vill jag se en tabell med Skalans Ackord som rader och Box 1–5 som kolumner i Penta-fliken, så att jag ser alla kombinationer på en gång.
4. Som gitarrist vill jag att varje cell visar numret på den Penta-box i Ackordets penta som ligger i Boxen, så att jag lär mig hur pentorna hänger ihop med skalans lägen.
5. Som gitarrist vill jag att dur-Ackord har durpentatonik och moll-Ackord mollpentatonik, så att pentan passar Ackordet (C-dur penta, D-moll penta, E-moll penta …).
6. Som gitarrist vill jag att varje Penta-box förekommer exakt en gång per rad, så att tabellen speglar boxarnas ordning längs halsen.
7. Som gitarrist vill jag att förminskade Ackord har en rad med "–", så att jag ser att ackordet finns men saknar penta.
8. Som gitarrist vill jag att en vald cell visar Penta-boxen orange inne i den blå Boxen, så att jag ser vilka toner som skiljer.
9. Som gitarrist vill jag att Penta-boxen ritas i varje kopia av Boxen, så att orange alltid ligger i blått.
10. Som gitarrist vill jag att en radrubrik i Penta-fliken visar Ackordets penta över hela halsen, så att jag ser den utan att välja Box.
11. Som gitarrist vill jag att tonerna i Ackordets penta syns även när de ligger utanför Skalan (som F i D mollpentatonik över A mollpentatonik), så att pentan är hel.
12. Som gitarrist vill jag att hovring, klick, piltangenter och Escape fungerar som i CAGED-fliken, så att jag inte behöver lära om.
13. Som gitarrist vill jag att mitt Ackord och min Box ligger kvar när jag byter Flik, så att jag ser samma läge från två håll.
14. Som gitarrist vill jag att Fliken ligger i adressen, så att ett bokmärke öppnar rätt Flik och cell.

## Implementation Decisions

- **Ackordets penta**: durpentatonik på Ackordets grundton för ett durackord, mollpentatonik för ett mollackord. Förminskade Ackord har ingen. Termerna står i `CONTEXT.md`.
- **Cellens Penta-box**: för varje Ackord fördelas pentans fem Penta-boxar på Skalans fem Boxar som en rotation av 1–5 (boxarnas ordning uppåt längs halsen). Rotationen väljs så att Penta-boxarnas band överlappar Boxarnas band mest, på samma sätt som formerna i CAGED-tabellen. Penta-boxarna byggs som Skalans Boxar, med Ackordets grundton och pentatonik.
- **Halsen i Penta-fliken**:

  | Valt | Orange | Blått | Nedtonat |
  |---|---|---|---|
  | Inget | – | alla skaltoner | – |
  | Bara Box | – | Boxen | resten |
  | Bara Ackord | Ackordets penta över hela halsen | – | resten |
  | Cell | Penta-boxen i varje kopia av Boxen | Boxen | resten |
  | Cell, förminskat Ackord | Ackordets toner i Boxen | Boxen | resten |

  Toner i Ackordets penta som ligger utanför Skalan visas som Prickar, som Ackordets toner gör i dag. Grundtonernas kantlinjer är oförändrade: Ackordets grundton vinner över Skalans.
- **Gränssnittet** `fretboardView(selection) → view` är fortfarande den enda sömmen. `selection` får Fliken (`caged` eller `penta`, CAGED om den saknas). `view.options` får Penta-tabellen bredvid CAGED-tabellen: rader per Ackord med steg och namn, och per Box cellens Penta-box eller ingen.
- **Urvalet i Penta-fliken**: en cell är Ackord och Box. Radrubriken är bara Ackordet och kolumnrubriken bara Boxen. `caged` gäller inte i Penta-fliken och släpps där.
- **Flikbyte** behåller Ackord och Box. Från en cell i Penta-fliken till CAGED blir valet CAGED-tabellens cell för samma Ackord och Box, dvs. dess form väljs.
- **Adressen**: `tab=penta` för Penta-fliken. Saknas parametern gäller CAGED, så bokmärken från tidigare fungerar. `chord`, `box` och `caged` är oförändrade.
- **Flikarna** visas som två knappar ovanför tabellen ("CAGED" och "Penta") där den valda är markerad, med flik-roller för skärmläsare. Tabellens komponent delas mellan Flikarna. Hovring och tangentbord är desamma.
- **Root och Scale**: två kolumner bredvid varandra i panelens översta grupp, med etiketten ovanför respektive dropdown.

## Testing Decisions

- Testerna går genom `fretboardView`, som tidigare. Exempel:
  - Penta-tabellens rad för I i C-dur är 1, 2, 3, 4, 5.
  - Raden för ii – Dm i C-dur är 5, 1, 2, 3, 4.
  - Varje rad för dur- och mollackord innehåller varje Penta-box exakt en gång, för alla Skalor.
  - Raden för vii° i C-dur har inga Penta-boxar.
  - En cell i Penta-fliken lägger Penta-boxen i Ackordets lager och Boxens övriga toner i Boxens lager, i varje kopia av Boxen.
  - En radrubrik i Penta-fliken lägger Ackordets penta i Ackordets lager över hela halsen, också toner utanför Skalan.
  - `caged` släpps i Penta-fliken.
- Adressens `tab` testas genom `choiceFromParams` och `choiceToParams`.
- Panelens layout, flikknapparna, hovring och tangentbord verifieras manuellt i appen.
- Test först med Vitest (TDD).

## Out of Scope

Penta för förminskade Ackord. Bluesskalan som Ackordets penta. Flikar för treklanger och fyrklanger. Att visa pentans namn ("D mollpentatonik") i tabellen utöver radens Ackord.

## Further Notes

Bygger på `.scratch/greppbrada-panel/`. Specen där sa att flikmekanik och flik i adressen byggs först när en andra Flik finns, och det är nu.
