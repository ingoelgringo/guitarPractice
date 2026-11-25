# Spec: Stämmaren

Status: ready-for-agent

## Problem Statement

Gitarrdelen har verktyg för att skriva tabulatur, utforska greppbrädan och spela till ackordföljder, men ingen stämmare. Den som övar måste byta till en annan app för att stämma, och de appar som finns har ofta bara standardstämning, saknar egna stämningar eller kräver nät.

## Solution

Ett nytt Verktyg, **Stämmaren**, på `/guitar/tuner` med ett kort på Gitarrsidan. Den lyssnar via mikrofonen och visar hur långt den tonen man spelar ligger från målet, i cent. Man väljer först ett **Stränginstrument** (gitarr 6, gitarr 7, gitarr 12, bas 4, bas 5, ukulele, mandolin) och sedan en **Stämning**. Förvalet är gitarr 6 i standardstämning. Man kan trycka på en sträng för att stämma just den. Utan vald sträng väljer Stämmaren den sträng i stämningen som ligger närmast tonen. Man kan skapa, redigera och ta bort egna stämningar. Stämmaren går att installera som app på hemskärmen och fungerar helt offline.

## User Stories

1. Som gitarrist vill jag öppna Stämmaren från ett kort på Gitarrsidan.
2. Som gitarrist vill jag att Stämmaren startar med gitarr 6 i standardstämning första gången.
3. Som gitarrist vill jag starta mikrofonen med en Starta-knapp, och att den stängs av när fliken döljs.
4. Som gitarrist vill jag få en kort förklaring om hur jag tillåter mikrofonen om jag har nekat åtkomst.
5. Som gitarrist vill jag välja Stränginstrument: gitarr 6, gitarr 7, gitarr 12, bas 4, bas 5, ukulele eller mandolin.
6. Som gitarrist vill jag välja bland färdiga stämningar för det valda Stränginstrumentet (se Implementation Decisions).
7. Som gitarrist vill jag se strängarna från grövst till vänster till ljusast till höger, med tonnamn, som i "EADGBE".
8. Som gitarrist vill jag trycka på en sträng för att stämma just den, och trycka igen för att släppa den.
9. Som gitarrist vill jag att Stämmaren väljer den närmaste strängen i stämningen när ingen sträng är vald, och visar den kromatiska tonen (t.ex. F#2) när jag är långt från alla strängar.
10. Som gitarrist vill jag se tonnamn, avvikelse i cent (−50 till +50) och frekvens i Hz.
11. Som gitarrist vill jag kunna växla mellan en stapel och en halvcirkelformad nål med rätt ton i mitten, och att valet sparas.
12. Som gitarrist vill jag att visaren blir grön inom ±3 cent och att strängen får en bock när den har legat stämd i ungefär en halv sekund.
13. Som gitarrist vill jag att bockarna sitter kvar tills jag byter stämning, så att jag ser vilka strängar som är klara.
14. Som gitarrist med 12-strängad gitarr eller mandolin vill jag att ett strängpar med samma ton visas som en knapp, och ett par med oktavsträng som två knappar i en grupp.
15. Som gitarrist vill jag skapa en egen stämning genom att utgå från en befintlig, stämma varje sträng upp eller ner i halvtoner med tonnamnet synligt och ge den ett namn.
16. Som gitarrist vill jag redigera, byta namn på och ta bort mina egna stämningar. De färdiga stämningarna går inte att ändra.
17. Som gitarrist vill jag ändra referenstonen A4 mellan 430 och 450 Hz, med 440 Hz som förval.
18. Som gitarrist vill jag att Stämmaren öppnas med samma Stränginstrument, stämning, visning och referenston som förra gången.
19. Som gitarrist vill jag att texterna följer Sajtspråket och att tonnamnen följer Notnamnsläget.
20. Som gitarrist vill jag installera Stämmaren på hemskärmen och använda den helt utan nät.
21. Som gitarrist vill jag använda Stämmaren på mobilen med stora strängknappar och en stor visare, och den ska fungera bra på datorn också.
22. Som gitarrist vill jag kunna spela upp den valda strängens ton för att stämma på gehör (senare del).

## Implementation Decisions

- **Termerna** Stämmare, Stränginstrument och Strängpar läggs till i `CONTEXT.md`, och Stämning breddas till att gälla både ett Spår och Stämmaren. Strängnumreringen ändras: sträng 1 är den som sitter närmast golvet när man spelar, normalt den ljusaste. Det spelar roll för ukulele med hög G.
- **Tonhöjdsdetektering** är en egen ren funktion i `lib/pitch.ts` (McLeod Pitch Method eller YIN). Den tar en `Float32Array` och en samplingsfrekvens och returnerar frekvens och klarhet, eller `null`. Den testas med Vitest mot syntetiska signaler: sinus, sågtand, signaler med övertoner och svag grundton, brus och tystnad. Inget nytt beroende. Analysfönstret ska vara så långt att bas 5:s låga B (cirka 31 Hz) går att detektera. Att den reagerar lite trögare där är okej.
- **Stämmarlogiken** ligger i `lib/tuner.ts` som rena funktioner: frekvens till MIDI och cent givet A4, närmaste sträng i en stämning, låsning med hysteres så att den automatiska strängen inte fladdrar mellan två strängar, och logiken för "stämd" (±3 cent i ungefär 0,5 s).
- **Stränginstrument och färdiga stämningar** ligger i `lib/tuning.ts`. Varje Stränginstrument har en lista med Strängpar eller strängar i MIDI-tonhöjd, sträng 1 först. De färdiga stämningarna är:
  - **Gitarr 6:** Standard, Eb standard, D standard, Drop D, Drop C#, Drop C, DADGAD, Open D, Open E, Open G, Open C
  - **Gitarr 7:** Standard (B E A D G B E), Drop A
  - **Gitarr 12:** Standard (oktavsträngar på de fyra grövsta paren, samma ton på de två ljusaste)
  - **Bas 4:** Standard, Drop D, Eb standard
  - **Bas 5:** Standard (B E A D G)
  - **Ukulele:** Standard GCEA med hög G, Low G, Baritone (DGBE)
  - **Mandolin:** Standard GDAE (fyra par med samma ton)
- **Tabbeditorn** använder den utbyggda listan för gitarr 6 och inget annat. `TUNING_PRESETS` och `findTuningPreset` fortsätter att fungera för editorn.
- **Egna stämningar** hör till ett Stränginstrument och sparas i `localStorage`, under en nyckel i stil med `guitarPractice.tuner.customTunings` och med `schemaVersion`. De syns bara i Stämmaren. Inställningarna (Stränginstrument, stämning, visning, A4) sparas under en egen nyckel.
- **Ljudet** kommer från `getUserMedia` med `echoCancellation`, `noiseSuppression` och `autoGainControl` avstängda, och analyseras via en `AnalyserNode` i en `requestAnimationFrame`-loop. Mikrofonspåret stoppas på `visibilitychange` (hidden) och när man lämnar sidan.
- **Offline:** `app/manifest.ts` med `start_url` och `scope` för `/guitar/tuner`. `public/sw.js` registreras med `basePath`-prefix och scope `/guitar/tuner`, eller `/guitar/` om Next-chunkarna kräver det. Den cachar Stämmarsidan med network-first och `/guitar/_next/static/*` med cache-first. Följ `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`. Nginx-reglerna ägs av Landningssidans repo. Kontrollera att `sw.js` och manifestet serveras under `/guitar/` och att `sw.js` inte cachas länge.
- **Referenston** (senare del) spelas med Tone.js, som redan används för Ackordföljder (ADR 0005).

## Testing Decisions

- TDD med Vitest för `lib/pitch.ts`, `lib/tuner.ts`, `lib/tuning.ts` och lagringen av egna stämningar (formatet, `schemaVersion`, ogiltig data).
- UI, mikrofon och service worker prövas i webbläsaren: på datorn och på en mobil, både med nät och i flygplansläge efter installation.

## Out of Scope

- Synk av egna stämningar mellan enheter och lagring i Biblioteket.
- Egna Stränginstrument (t.ex. 8-strängad gitarr) och fler instrument än de sju.
- Egna stämningar i tabbeditorn.
- Offline för resten av gitarrdelen.
- Strobe-läge och polyfon stämning (alla strängar på en gång).
