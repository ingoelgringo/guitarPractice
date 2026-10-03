# Spec: Greppbräda (version 1)

Status: ready-for-agent

## Problem Statement

En gitarrist som vill lära sig halsen har ingen plats på sajten där man ser var en skalas toner ligger, vilka ackord som hör till skalan, eller hur boxarna och CAGED-formerna ligger. Det finns bara Tab-editorn.

## Solution

Ett nytt Verktyg, **Greppbrädan**, som nås från landningssidan. Det visar en liggande gitarrhals. Man väljer Grundton och Skala och sedan valfritt ett Ackord från skalan, en Box och en CAGED-form. Halsen visar Prickar i lager: skalan som bakgrund och det valda framhävt. Musikteorin byggs ut efter hand utan att halsen behöver ändras.

## User Stories

1. Som Gäst vill jag se ett kort för Greppbrädan på landningssidan, så att jag hittar verktyget.
2. Som Gäst vill jag använda Greppbrädan utan att logga in, så att alla kan öva.
3. Som gitarrist vill jag se en liggande hals med sträng 1 (ljusa e) överst, så att den läses som tabulatur.
4. Som gitarrist vill jag se band 0–15 med bandmarkeringar på 3, 5, 7, 9 och 12, så att jag hittar på halsen.
5. Som gitarrist vill jag välja vilken av de 12 Grundtonerna som helst, så att jag kan öva i alla tonarter.
6. Som gitarrist vill jag välja Skala bland dur, naturlig moll, durpentatonik, mollpentatonik och blues, så att jag ser de vanligaste skalorna.
7. Som gitarrist vill jag att alla skalans toner visas som Prickar över hela halsen, så att jag ser helheten.
8. Som gitarrist vill jag att Grundtonen alltid har en egen färg, så att jag orienterar mig.
9. Som gitarrist vill jag växla etiketter mellan intervall (1, ♭3, 5 …) och tonnamn, så att jag lär mig både funktion och namn.
10. Som gitarrist vill jag att tonnamnen stavas efter tonarten (F-dur ger B♭, E-dur ger D♯), så att de stämmer med teorin.
11. Som svensk gitarrist vill jag ha svenskt Notnamnsläge (H, och B för B♭), så att namnen känns igen.
12. Som gitarrist vill jag kunna byta till engelskt Notnamnsläge, så att namnen stämmer med engelska källor.
13. Som återkommande användare vill jag att Notnamnsläget kommer ihåg i webbläsaren, så att jag slipper välja om.
14. Som gitarrist vill jag se de diatoniska treklangerna för skalan med steg och namn ("ii – Dm"), så att jag vet vilka ackord som hör till.
15. Som gitarrist vill jag att pentatonik och blues erbjuder ackorden från sin Föräldraskala, så att jag ser vad jag kan spela över.
16. Som gitarrist vill jag att ett valt Ackords toner lyser över hela halsen medan skalans övriga toner tonas ner, så att jag ser ackordet i skalan.
17. Som gitarrist vill jag välja Box 1–5, så att jag övar ett läge i taget.
18. Som gitarrist vill jag att boxen framhävs på alla ställen den finns inom band 0–15, medan resten av skalan tonas ner, så att jag ser både läget och sammanhanget.
19. Som gitarrist vill jag att fem boxar finns för alla skalor, så att systemet är detsamma oavsett skala.
20. Som gitarrist vill jag välja en CAGED-form (C, A, G, E, D) när ett Ackord är valt, så att jag ser ett konkret grepp.
21. Som gitarrist vill jag att CAGED-greppets Prickar är starkast, så att greppet syns över skalan och boxen.
22. Som gitarrist vill jag att CAGED-valet är gråat för förminskade Ackord, så att jag förstår att det inte finns någon form.
23. Som gitarrist vill jag kunna visa en Box och en CAGED-form samtidigt, så att jag ser hur greppet ligger i läget.
24. Som gitarrist vill jag att valt Ackord, Box och CAGED-form nollställs när de inte längre gäller efter ett skalbyte, så att halsen aldrig visar något ogiltigt.
25. Som gitarrist vill jag att mitt urval (Grundton, Skala, Ackord, Box, CAGED-form, etikettläge) ligger i adressen, så att jag kan bokmärka och dela det.
26. Som gitarrist vill jag att en adress med ogiltiga värden faller tillbaka på rimliga standardval, så att sidan aldrig går sönder.
27. Som gitarrist på surfplatta eller dator vill jag se hela halsen, så att jag kan öva vid gitarren.
28. Som gitarrist på telefon vill jag kunna skrolla halsen horisontellt, så att den fungerar även där.
29. Som gitarrist vill jag kunna ta mig tillbaka till landningssidan, precis som från Tab-editorn.

## Implementation Decisions

- **Ny ren modul för Greppbrädan** (TypeScript, utan React och DOM) med ett enda djupt gränssnitt: `fretboardView(selection) → view`.
  - `selection`: Grundton, Skala, valfritt Ackord (steg), valfri Box (1–5), valfri CAGED-form, Stämning, etikettläge (intervall/tonnamn) och Notnamnsläge (svenskt/engelskt).
  - `view.dots`: Prickar med sträng, band, etikett, om den är Grundton, och betoning (t.ex. nedtonad / skala / framhävd / starkast).
  - `view.options`: vilka Ackord (steg + namn), Boxar och CAGED-former som går att välja, och vilka som är gråade.
  - Gränssnittet ger ett normaliserat urval, så att val som blivit ogiltiga efter skalbyte släpps.
- Teorin (skalmönster, Föräldraskala, diatoniska treklanger, boxar, CAGED-former, enharmonisk stavning) ligger bakom gränssnittet och kan delas upp internt efter behov.
- **Stämning**: halsen tar Stämningen som MIDI-tonhöjd per lös sträng, sträng 1 först (samma representation som Partiturets Spår, och standardstämningen återanvänds). I v1 finns bara standardstämning i gränssnittet.
- **Route och kort**: ett nytt Verktyg läggs i verktygslistan som landningssidan renderar. Sidan läser valet ur query-parametrarna på servern. Klientkomponenten skriver tillbaka det med `history.replaceState` och renderar halsen som SVG från `view`.
- **Notnamnsläget** sparas i webbläsarens localStorage (läsning och skrivning i try/catch). Svenskt är standard. Det ligger inte i adressen.
- Ingen databas och ingen inloggning krävs.

## Testing Decisions

- Ett bra test kontrollerar extern effekt: givet ett urval, vilka Prickar visas och med vilken etikett och betoning, och vilka val som erbjuds. Testerna känner inte till den interna uppdelningen av teorin.
- **En testsöm**: `fretboardView`. Exempel: A mollpentatonik ger Prickar på band 5 och 8 på sträng 6. C-dur med valt steg vii ger B° och gråad CAGED. Svenskt läge i F-dur ger etiketten "B" för B♭. Skalbyte släpper ett ogiltigt Ackord.
- Sidan och halskomponenten testas inte med enhetstester. De verifieras manuellt i appen.
- Förebild: den rena editormodulen och dess tester (`apply(state, command)`), plus övriga rena moduler i `lib/` med Vitest, test först (TDD).

## Out of Scope

Ljud och uppspelning. Egna Prickar genom klick. Igenkänning av ackord eller skala från prickar. Fyrklanger. Modi, harmonisk och melodisk moll. 3 toner per sträng. Andra stämningar än standard i gränssnittet. Vänsterhänt läge. Koppling till Tab-editorn. Utskrift. Sparande i Biblioteket. Automatisk koppling mellan Box och CAGED-form. Fingersättning.

## Further Notes

Musikteorin kommer att byggas ut efter hand. Därför ska nya skalor, ackordtyper eller visningslager kunna läggas till bakom `fretboardView` utan att halskomponenten ändras.
