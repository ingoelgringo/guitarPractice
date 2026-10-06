# Spec: Intervallfliken

Status: ready-for-agent

## Problem Statement

I panelen ser man Skalans Ackord på flera sätt, men inte dess intervall. När man övar ett intervall (t.ex. sexter) i en Box vill man se två toner i taget: en baston och tonen ett visst antal skalsteg ovanför. Man vill också kunna gå uppåt och nedåt i skalan med samma intervall utan att leta upp nästa par själv.

## Solution

Panelen får en fjärde Flik, *Intervals*. Intervalltabellen har intervallen (sekund till oktav) som rader och Box 1–5 som kolumner. En cell väljer ett Intervall och en Box. Halsen visar då ett Tonpar orange i den blå Boxen. Paret börjar med Boxens lägsta Grundton som baston. Höger och vänster (piltangenterna i tabellen, eller knapparna ◀ ▶ ovanför den) flyttar Tonparet ett skalsteg upp eller ner. Efter Boxens sista Tonpar börjar det om från Boxens lägsta Grundton.

## User Stories

1. Som gitarrist vill jag välja Fliken Intervals bredvid CAGED, Penta och Triads, så att jag kan öva intervall i Skalan.
2. Som gitarrist vill jag se en tabell med intervallen (2nd–Octave) som rader och Box 1–5 som kolumner, så att jag väljer Intervall och Box med ett klick.
3. Som gitarrist vill jag att ett valt Intervall och en vald Box visar ett Tonpar, med Boxens lägsta Grundton som baston, så att jag vet var jag börjar.
4. Som gitarrist vill jag gå ett skalsteg upp med höger och ett ner med vänster, så att jag spelar intervallet genom hela Skalan.
5. Som gitarrist vill jag att Tonparet fortsätter in i nästa oktav efter skalans sjunde ton, så länge Boxen räcker.
6. Som gitarrist vill jag att höger efter Boxens sista Tonpar börjar om från Boxens lägsta Grundton, så att jag kan gå runt utan att stanna.
7. Som gitarrist vill jag se Tonparets namn och intervall (t.ex. "C – A, M6") ovanför tabellen, så att jag vet vad jag spelar.
8. Som gitarrist vill jag att intervallen i pentatonik och blues räknas i Föräldraskalan, så att en sext alltid är en sext.
9. Som gitarrist vill jag att Intervall och Box ligger i adressen men inte steget, så att ett bokmärke öppnar rätt cell från början.

## Implementation Decisions

- **Termerna** Intervall, Tonpar, Intervallfliken och Intervalltabellen står i `CONTEXT.md`.
- **Intervallet** är 2–8 (sekund till oktav) och räknas i skalsteg: Tonparets övre ton ligger `intervall − 1` steg ovanför bastonen i Föräldraskalan. Med 6 och baston C i C-dur blir det C och A.
- **Boxens toner** för Tonparen är Föräldraskalans toner i Boxen, byggda som Boxen för Föräldraskalan (för dur och naturlig moll är det samma Box). I tonhöjdsordning är det en obruten följd av skaltoner.
- **Tonparen** i en Box: bastonen går från Boxens lägsta Grundton uppåt så länge den övre tonen finns i Boxen. Steget är 0 för det första Tonparet. Höger ökar steget och vänster minskar det, och båda går runt: efter det sista kommer det första, och före det första kommer det sista.
- **Steget** återgår till 0 när Grundton, Skala, Intervall eller Box ändras. Det ligger inte i adressen och sparas inte.
- **Halsen i Intervallfliken**:

  | Valt | Orange | Blått | Nedtonat |
  |---|---|---|---|
  | Inget | – | alla skaltoner | – |
  | Bara Box | – | Boxen | resten |
  | Cell | Tonparet i varje kopia av Boxen där det ryms | Boxens övriga toner | resten |

  En ton i Tonparet utanför Skalan (som H i A mollpentatonik) syns bara i Tonparet. Grundtonernas kantlinjer är oförändrade.
- **Gränssnittet** `fretboardView(selection) → view` är fortfarande den enda sömmen. `selection` får Fliken `intervals`, `interval` (2–8) och `intervalStep`. `view.selection.intervalStep` är steget inom Boxens Tonpar. `view.intervalPair` har Tonparets namn och intervall, eller är `null`. `view.options.intervalTable` har en rad per Intervall med intervallet från Grundtonen i varje cell (t.ex. M6).
- **Ackordet** gäller inte i Intervallfliken och släpps, och Intervallet släpps i de andra Flikarna. Boxen ligger kvar vid flikbyte.
- **Adressen**: `tab=intervals` och `interval=6`. Steget ligger inte i adressen.
- **Panelen**: flikknappen heter "Intervals". Radrubrikerna är inga knappar, eftersom ett Intervall utan Box inte visar något. Med en vald cell flyttar vänster och höger Tonparet, och upp och ner byter Intervall. Utan vald cell fungerar tangenterna som i de andra Flikarna. Knapparna ◀ ▶ och Tonparets namn står ovanför tabellen.

## Testing Decisions

- Testerna går genom `fretboardView`. Exempel:
  - Sext i Box 1 av C-dur: steg 0 är C (sträng 6, band 8) och A (sträng 4, band 7). Steg 1 är D och H.
  - Steget går runt i båda riktningarna.
  - I A mollpentatonik räknas sekunden i Föräldraskalan: A och H, och H syns bara i Tonparet.
  - Ackordet släpps i Intervallfliken, och Intervallet i de andra.
- Adressens `tab=intervals` och `interval` testas genom `choiceFromParams` och `choiceToParams`.
- Panelen, knapparna och tangentbordet verifieras manuellt i appen.
- Test först med Vitest (TDD).

## Out of Scope

Intervall större än en oktav. Kromatiska intervall utanför Föräldraskalan. Tonpar över hela halsen utan Box. Att spela upp tonerna.
