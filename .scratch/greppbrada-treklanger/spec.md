# Spec: Treklangsfliken

Status: ready-for-agent

## Problem Statement

I panelen ser man Ackorden som CAGED-former och som Ackordets penta, men inte som Treklangsgrepp: Ackordets tre toner på tre strängar. När man spelar kompet eller fyllnader i en Box vill man hitta det Treklangsgrepp för Ackordet som ligger närmast handen, på de strängar man vill spela på. Man ser inte heller vilken Omvändning det är.

## Solution

Panelen får en tredje Flik, *Triads*, bredvid *CAGED* och *Penta*. Ovanför tabellen väljer man ett Strängset i en dropdown. Treklangstabellen har samma rader (Skalans Ackord) och kolumner (Box 1–5) som de andra tabellerna. Varje cell visar Omvändningen (R, 3 eller 5) för det Treklangsgrepp på Strängsetet som ligger närmast kolumnens Box. Om ingen Omvändning ryms helt får greppet sticka ut. Ett val av en cell visar Treklangsgreppet orange inne i den blå Boxen. Flikarna fungerar likadant: hovring, klick, piltangenter och Escape.

## User Stories

1. Som gitarrist vill jag välja Fliken Triads bredvid CAGED och Penta, så att jag kan se Ackordet som Treklangsgrepp.
2. Som gitarrist vill jag välja ett Strängset i en dropdown, så att jag övar treklanger på de strängar jag vill.
3. Som gitarrist vill jag kunna välja både intilliggande Strängset (6-5-4, 5-4-3, 4-3-2, 3-2-1) och sådana som hoppar över en sträng efter bastonen (6-4-3, 5-3-2, 4-2-1), så att jag får båda sorternas grepp.
4. Som gitarrist vill jag att 3-2-1 är förvalt, så att jag kommer igång med de vanligaste treklangerna.
5. Som gitarrist vill jag se en tabell med Skalans Ackord som rader och Box 1–5 som kolumner i Treklangsfliken, så att jag ser alla kombinationer på en gång.
6. Som gitarrist vill jag att varje cell visar Omvändningen som bastonens intervall (R, 3 eller 5), så att jag lär mig vilken Omvändning som ligger i vilken Box.
7. Som gitarrist vill jag att cellen gäller det Treklangsgrepp som ligger närmast Boxen, så att jag inte behöver flytta handen.
8. Som gitarrist vill jag att greppet får sticka ut ur Boxen när inget ryms helt, så att varje cell ändå har ett grepp.
9. Som gitarrist vill jag att förminskade Ackord har Treklangsgrepp, så att alla sju Ackord går att öva.
10. Som gitarrist vill jag att en vald cell visar Treklangsgreppet orange i varje kopia av den blå Boxen, så att orange alltid ligger i blått.
11. Som gitarrist vill jag att en radrubrik visar alla Ackordets Treklangsgrepp på Strängsetet över hela halsen, så att jag ser hur Omvändningarna följer varandra.
12. Som gitarrist vill jag att hovring, klick, piltangenter och Escape fungerar som i de andra Flikarna, så att jag inte behöver lära om.
13. Som gitarrist vill jag att mitt Ackord, min Box och mitt Strängset ligger kvar när jag byter Flik, så att jag ser samma läge från flera håll.
14. Som gitarrist vill jag att Fliken och Strängsetet ligger i adressen, så att ett bokmärke öppnar rätt Flik, Strängset och cell.

## Implementation Decisions

- **Termerna** Strängset, Treklangsgrepp, Omvändning och Treklangstabellen står i `CONTEXT.md`.
- **Strängseten** är sju, i den här ordningen: 6-5-4, 5-4-3, 4-3-2, 3-2-1, 6-4-3, 5-3-2, 4-2-1. Förvalt är 3-2-1.
- **Treklangsgreppen** för ett Ackord på ett Strängset är alla placeringar inom band 0–15 där Ackordets tre toner ligger en per sträng. Tonerna stiger från bastonen: på intilliggande strängar i Ackordets ordning (R-3-5, 3-5-R, 5-R-3), och med en överhoppad sträng med mellantonen en oktav upp (R-5-3, 3-R-5, 5-3-R). Den lägsta strängens ton bestämmer Omvändningen. Varje Omvändning har normalt flera kopior längs halsen (var tolfte band).
- **Cellens Treklangsgrepp** väljs bland Ackordets Treklangsgrepp på Strängsetet i två steg:
  1. flest toner inne i Boxens band, i någon kopia av Boxen;
  2. vid lika: minst avstånd i band utanför Boxen och därefter lägst band.

  Samma Omvändning kan stå i flera celler på en rad, eftersom tre Omvändningar fördelas på fem Boxar. Cellen visar `R`, `3` eller `5`.
- **Greppets läge**: det valda greppet ritas i varje kopia av Boxen där det får plats inom band 0–15, som CAGED-greppet.
- **Halsen i Treklangsfliken**:

  | Valt | Orange | Blått | Nedtonat |
  |---|---|---|---|
  | Inget | – | alla skaltoner | – |
  | Bara Box | – | Boxen | resten |
  | Bara Ackord | alla Treklangsgrepp på Strängsetet över hela halsen | – | resten |
  | Cell | Treklangsgreppet i varje kopia av Boxen | Boxen | resten |

  Förminskade Ackord följer samma tabell. Ackordtoner utanför Skalan (som H i ii° för A mollpentatonik) visas som Prickar, som i dag. Strängar utanför Strängsetet får inga ×-markeringar (`mutedStrings` är tom). Grundtonernas kantlinjer är oförändrade.
- **Gränssnittet** `fretboardView(selection) → view` är fortfarande den enda sömmen. `selection` får Fliken `triads` och ett Strängset, som är 3-2-1 om det saknas eller är ogiltigt. `view.options` får Treklangstabellen bredvid de andra tabellerna, med rader per Ackord (steg och namn) och cellens Omvändning per Box. Det får också listan över Strängset.
- **Urvalet i Treklangsfliken**: en cell är Ackord och Box. Radrubriken är bara Ackordet och kolumnrubriken bara Boxen. `caged` gäller inte och släpps.
- **Flikbyte** behåller Ackord, Box och Strängset. Från en cell i Treklangsfliken till CAGED blir valet CAGED-tabellens cell för samma Ackord och Box, som från Penta.
- **Adressen**: `tab=triads` och `strings=321`, där siffrorna står i Strängsetets ordning, t.ex. `643`. `strings` ligger kvar i adressen också i andra Flikar. Ett saknat eller ogiltigt värde ger 3-2-1. `chord`, `box` och `caged` är oförändrade.
- **Panelen**: flikknapparna blir "CAGED", "Penta" och "Triads". Dropdownen "Strings" syns bara i Treklangsfliken, ovanför tabellen, med etiketten ovanför som för Root och Scale. Tabellkomponenten, hovringen och tangentbordet delas med de andra Flikarna.

## Testing Decisions

- Testerna går genom `fretboardView`, som tidigare. Exempel:
  - Varje cell i Treklangstabellen är R, 3 eller 5 för alla Skalor, Ackord och Strängset, även förminskade Ackord.
  - En vald cell lägger exakt en ton per sträng i Strängsetet i Ackordets lager, i varje kopia av Boxen. De tre tonerna är Ackordets toner, med cellens Omvändning lägst.
  - När en Omvändning ryms helt i Boxen ligger cellens grepp helt inne i Boxen.
  - Cellen visar ett grepp även när inget ryms helt (greppet sticker ut).
  - En radrubrik lägger alla Treklangsgrepp på Strängsetet i Ackordets lager över hela halsen, och inga Prickar på andra strängar.
  - `caged` släpps i Treklangsfliken, och `mutedStrings` är tom.
  - Ett Strängset som hoppar över en sträng (t.ex. 6-4-3) har inga Prickar i Ackordets lager på den överhoppade strängen.
- Adressens `tab=triads` och `strings` testas genom `choiceFromParams` och `choiceToParams`.
- Panelens dropdown, flikknapparna, hovring och tangentbord verifieras manuellt i appen.
- Test först med Vitest (TDD).

## Out of Scope

Fyrklanger. Strängset bredare än en överhoppad sträng (t.ex. 6-4-2). Att välja Omvändning direkt i stället för via Box. Drop-voicings. Att markera Strängsetet på halsen på något annat sätt än genom vilka Prickar som är orange.

## Further Notes

Bygger på `.scratch/greppbrada-panel/` och `.scratch/greppbrada-penta/`.
