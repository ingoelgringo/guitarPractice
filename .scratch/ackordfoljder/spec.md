# Spec: Ackordföljder – Tonnetz och Kvintcirkel

Status: ready-for-agent

## Problem Statement

Kortet *Chord Progressions* på Gitarrsidan leder ingenstans än. Den som vill förstå hur ackord hänger ihop, alltså vilka som är grannar, delar toner eller är parallella, har inget verktyg för det på sajten. Kvintcirkeln visar ackordens släktskap i kvinter, och Tonnetzen visar hur ackord delar toner. Men det är svårt att se sambandet mellan dem utan att de är kopplade till varandra.

## Solution

Verktyget *Chord Progressions* får en sida på `/guitar/chord-progressions` med två rutor. Den ena är en **Tonnetz**: en oändlig yta av trianglar som man drar runt i med mus eller finger. Den andra är en **Kvintcirkel** med de 24 dur- och mollackorden. När man hovrar ett Ackord i den ena lyser samma Ackord grönt i den andra, i Tonnetzen på alla synliga kopior av triangeln. Ett klick eller tryck låser markeringen. En dropdown väljer Notnamnsläge (svenskt/engelskt). Inställningen delas med Greppbrädan och har engelskt som förval. Ackordföljder och ljud kommer senare.

## User Stories

1. Som gitarrist vill jag klicka på kortet *Chord Progressions* på Gitarrsidan och komma till Verktyget.
2. Som gitarrist vill jag se en Kvintcirkel med durackorden ytterst och de parallella mollackorden innanför (C/Am, G/Em …), så att jag ser ackordens släktskap.
3. Som gitarrist vill jag se en Tonnetz med tonnamn i hörnen och ackordnamn mitt i varje triangel, så att jag ser vilka ackord som delar toner.
4. Som gitarrist vill jag dra Tonnetzen åt alla håll med mus eller finger utan att den tar slut, så att jag kan utforska fritt.
5. Som gitarrist vill jag att Tonnetzen startar med C-dur mitt i rutan.
6. Som gitarrist vill jag att ett Ackord som jag hovrar i Kvintcirkeln lyser grönt i Tonnetzen, på varje synlig triangel för det Ackordet och på dess tre hörn.
7. Som gitarrist vill jag att en triangel som jag hovrar i Tonnetzen gör att samma Ackord lyser grönt i Kvintcirkeln och på Tonnetzens övriga kopior.
8. Som gitarrist vill jag låsa ett Ackord med ett klick eller tryck och släppa det genom att klicka igen eller utanför, så att det fungerar på pekskärm.
9. Som gitarrist vill jag att en dragning i Tonnetzen inte räknas som ett klick.
10. Som gitarrist vill jag kunna välja Ackord i Kvintcirkeln med tangentbordet: vänster och höger går i kvintordning, upp och ner byter mellan dur och moll, Enter låser och Esc släpper.
11. Som gitarrist vill jag välja Notnamnsläge (svenskt med H, eller engelskt) i en dropdown, och att valet gäller både här och i Greppbrädan och sparas i webbläsaren.
12. Som gitarrist som besöker sajten första gången vill jag se engelska tonnamn.
13. Som gitarrist vill jag se rutorna bredvid varandra på bred skärm och Tonnetzen överst på smal skärm.

## Implementation Decisions

- **Termerna** Tonnetz, Kvintcirkel, Ackord (vidgat) och Notnamnsläge (för hela sajten, engelskt förval) står i `CONTEXT.md`.
- **Ackorden** är de 24 dur- och mollackorden. Ett Ackord identifieras av tonklass (0–11, C = 0) och kvalitet (`major`/`minor`).
- **Gittret**: hörnet `(i, j)` har tonklassen `(7i + 4j) mod 12` och ligger på `x = i + j/2`, `y = j·√3/2` (uppåt), skalat till en kantlängd i pixlar. `(0, 0)` är C. Triangeln `(i,j), (i+1,j), (i,j+1)` är durackordet på `(i,j)`. Triangeln `(i+1,j), (i,j+1), (i+1,j+1)` är mollackordet på `(i,j+1)`, alltså tersen i durackordet nedanför: C-durs granne är Em.
- **Synliga trianglar** räknas fram ur förskjutningen (dragningen) och rutans storlek, med en marginal så att inga hål syns vid kanterna. Inget lagras. Ytan ritas om under dragningen.
- **Stavningen** är fast per tonklass. Tonerna stavas C D♭ D E♭ E F F♯ G A♭ A B♭ B, och durackorden får samma namn. Mollackorden stavas Cm C♯m Dm E♭m Em Fm F♯m Gm G♯m Am B♭m Bm. I svenskt Notnamnsläge blir B → H och B♭ → B (t.ex. Hm, Bm för B♭m), på samma sätt som `noteName` i `lib/fretboard.ts`. I Kvintcirkeln står "F♯/G♭" på F♯-platsen. Tonnetzen visar en stavning.
- **Kvintcirkeln** har C överst och kvintordningen medurs: C G D A E B F♯ D♭ A♭ E♭ B♭ F. Den inre ringen har de parallella mollackorden: Am Em Bm F♯m C♯m G♯m E♭m B♭m Fm Cm Gm Dm.
- **Markeringen** har två nivåer: *låst* Ackord och *hovrat* Ackord. Det som visas är det hovrade om något hovras, annars det låsta. Ett klick på det låsta Ackordet eller utanför Ackorden släpper låsningen. En pekarrörelse på mer än cirka 5 px mellan nedtryckning och uppsläpp är en dragning och låser ingenting. Markeringen ligger inte i adressen och sparas inte.
- **Färgen** för markerat Ackord är grön, i en egen färgtoken som fungerar i både ljust och mörkt tema. Tonnetzen fyller trianglarna och markerar de tre hörnen. Kvintcirkeln fyller ackordets segment.
- **Tangentbordet** fungerar i Kvintcirkeln, som är fokuserbar. Fokus visas som ett hovrat Ackord. Tonnetzen kan bara dras med pekaren.
- **Notnamnsläget** flyttas från Greppbrädans egen nyckel till en gemensam nyckel i webbläsaren, och `DEFAULT_NOTE_NAME_MODE` blir `english`. Ett sparat val under Greppbrädans gamla nyckel läses som fallback, så att ingen tappar sitt val.
- **Modulen** blir ren TypeScript utan React, t.ex. `lib/chordProgressions.ts`: Kvintcirkelns 24 platser, ackordnamn, ackordets toner, gittrets synliga trianglar och hörn för en given förskjutning och storlek, och vilka trianglar som är ett visst Ackord. Komponenterna ritar SVG utifrån den.
- **Sajtspråk**: rubriker och etiketter (t.ex. dropdownen) översätts till engelska och svenska, liksom på andra sidor. Tonnamnen följer Notnamnsläget, inte Sajtspråket.
- **Kortet** i `lib/tools.ts` får `href: "/chord-progressions"`.

## Testing Decisions

- Testerna går genom den rena modulen. Exempel:
  - Hörnet `(0,0)` är C, `(1,0)` G, `(0,1)` E och `(-1,1)` A.
  - Durtriangeln på `(0,0)` är C-dur (C E G) och mollgrannen är Em (E G B).
  - Kvintcirkelns ordning, och att varje mollackord står innanför sitt parallella durackord.
  - Ackordnamn i båda Notnamnslägena: B♭ → B, B → H, B♭m → Bm och Bm → Hm i svenskt läge.
  - De synliga trianglarna för en ruta täcker rutan och innehåller C-dur i mitten vid förskjutning 0. En förskjutning med en hel period ger samma uppsättning Ackord.
  - Alla synliga kopior av ett Ackord hittas.
  - Skillnaden mellan klick och dragning (tröskeln) och nivåerna låst/hovrat, som rena funktioner.
- Notnamnslägets lagring: förvalet engelskt och fallback till Greppbrädans gamla nyckel.
- Kortets länk testas i `lib/tools.test.ts`.
- Dragning, hovring, tangentbord och layout verifieras manuellt i appen.
- Test först med Vitest (TDD).

## Out of Scope

Ackordföljder (att välja och stega igenom en följd). Ljud. Förminskade och utökade ackord, och fyrklanger. Zoom och knapp för centrering. Ackordet i adressen. Hovring på enskilda toner i Tonnetzen. Koppling till Greppbrädan (t.ex. "visa Ackordet på halsen").
