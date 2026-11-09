# Spec: Ackordföljder att spela till

Status: ready-for-agent

## Problem Statement

På sidan *Chord Progressions* kan man utforska hur ackord hänger ihop i Tonnetzen och Kvintcirkeln, men man kan inte bygga en egen följd av ackord och höra den. Den som vill öva improvisation eller komp över en låtform (vers, refräng, stick) måste i dag använda ett annat program för att få ett komp att spela till.

## Solution

Under Tonnetzen och Kvintcirkeln finns en editor för en **Ackordföljd**. Den har en Tonart, ett tempo, en taktart, namngivna **Delar** med ett valt antal Takter och en **Form** som anger i vilken ordning Delarna spelas. Takterna visas med taktstreck, och ett **Ackord** kan placeras på varje **Taktslag**. Ett Ackord klingar tills nästa Ackord. Man väljer Ackord i en lista där tonartens ackord ligger först, med tangentbordet eller genom att klicka i Tonnetzen eller Kvintcirkeln. Alla ackordtyper, tillägg och en egen Bas finns. När man trycker på Play spelar fyra **Instrument** ett komp: trummor, bas, elpiano och synthpad. Varje Instrument kan bockas i eller ur under uppspelningen. Ägaren sparar Ackordföljder i Biblioteket, och en Gäst har sitt arbete kvar som ett Utkast i webbläsaren.

## User Stories

1. Som gitarrist vill jag se en editor för en Ackordföljd under Tonnetzen och Kvintcirkeln.
2. Som gitarrist vill jag att en ny Ackordföljd är i C-dur och 4/4, med tempo 100 och en Del "Verse" på 4 Takter.
3. Som gitarrist vill jag se Takterna med taktstreck och en plats för varje Taktslag: fyra i 4/4, tre i 3/4, två i 2/4, sex i 6/8 och tolv i 12/8.
4. Som gitarrist vill jag markera ett Taktslag med ett klick eller tryck och få en lista med tonartens ackord med steg (I C, ii Dm … vii° H°), och i moll även dur-V.
5. Som gitarrist vill jag kunna välja "Annat ackord…" och bygga vilket Ackord som helst: grundton, ackordtyp (dur, moll, förminskad, överstigande, sus2, sus4), tillägg (6, 7, maj7, 9, add9, 11, 13, ♭5, ♭9, ♯9, ♯11, ♭13) och Bas.
6. Som gitarrist vill jag flytta mellan Takter med ←/→, mellan Taktslag med Alt+←/→ och mellan Delar med ↑/↓.
7. Som gitarrist vill jag välja tonartens steg med siffrorna 1–7.
8. Som gitarrist vill jag börja skriva en bokstav och få ett fält där jag kan skriva t.ex. `F#m7/C` och trycka Enter, med tonartens ackord först bland förslagen.
9. Som gitarrist vill jag att bokstäverna följer Notnamnsläget, så att `H` är B och `B` är B♭ i svenskt läge.
10. Som gitarrist vill jag göra det markerade Ackordet till dur med `+` och till moll med `−`, och behålla tillägg och Bas.
11. Som gitarrist vill jag ta bort Ackordet på det markerade Taktslaget med Backspace eller Delete.
12. Som gitarrist vill jag placera en treklang på det markerade Taktslaget genom att klicka på den i Tonnetzen eller Kvintcirkeln.
13. Som gitarrist vill jag att ett Ackord klingar tills nästa Ackord, även över taktstreck och mellan Delar.
14. Som gitarrist vill jag välja Tonart (grundton och dur eller moll) och se den markerad i Kvintcirkeln.
15. Som gitarrist vill jag välja tempo mellan 40 och 240 bpm, med siffror eller genom att trycka in det (tap tempo). I 6/8 och 12/8 räknas tempot i punkterade fjärdedelar.
16. Som gitarrist vill jag välja taktart: 4/4, 3/4, 2/4, 6/8 eller 12/8.
17. Som gitarrist vill jag skapa Delar, ge dem namn som "Verse", "Pre-chorus" och "Chorus" och välja hur många Takter de har.
18. Som gitarrist vill jag bestämma Formen, alltså i vilken ordning Delarna spelas (Verse, Chorus, Verse, Chorus), och att en ändring i en Del gäller överallt där den står.
19. Som gitarrist vill jag lägga till Delar i Formen, dra dem till en annan plats och ta bort dem.
20. Som gitarrist vill jag trycka på Play och höra trummor, bas, elpiano och synthpad spela Ackordföljden i loop.
21. Som gitarrist vill jag bocka i och ur vilka Instrument som hörs, även medan musiken spelar.
22. Som gitarrist vill jag kunna loopa bara en Del.
23. Som gitarrist vill jag ha en takts inräkning, och kunna stänga av den.
24. Som gitarrist vill jag se vilket Ackord som klingar, på sitt Taktslag, i Tonnetzen och i Kvintcirkeln.
25. Som gitarrist vill jag att basen spelar Basen och att elpianot och padden spelar ackordet med tilläggen i lägen nära föregående ackord.
26. Som gitarrist vill jag att bara trummorna spelar före det första Ackordet.
27. Som gitarrist vill jag kunna ångra och göra om med Ctrl+Z och Ctrl+Y.
28. Som gitarrist vill jag att Ackord på Takter och Taktslag som försvinner, när jag minskar en Del eller byter taktart, tas bort och kan ångras.
29. Som Ägare vill jag att mina Ackordföljder sparas automatiskt i Biblioteket och att jag kan öppna, byta namn på, kopiera och ta bort dem.
30. Som Ägare vill jag få samma val vid en Konflikt som för ett Partitur: *Ladda om*, *Spara som kopia* eller *Skriv över*.
31. Som Gäst vill jag att min Ackordföljd finns kvar som ett Utkast när jag laddar om sidan.
32. Som gitarrist vill jag kunna använda editorn på mobil, med Takter som radbryts.

## Implementation Decisions

- **Termerna** Ackordföljd, Tonart, Del, Form, Taktslag, Instrument, Bas, Ackord (breddat med ackordtyp, tillägg och Bas), Takt (breddad), Bibliotek, Utkast och Konflikt (breddade till Ackordföljder) står i `CONTEXT.md`.
- **Ljudet** spelas med Tone.js, med samplingar för trummor och elpiano och syntes för bas och synthpad (ADR 0005). Samplingarna ligger under `public/` och har en licens som tillåter att vi lägger ut dem, t.ex. CC0. Licensen dokumenteras bredvid filerna. Tone.js laddas först när man trycker på Play, så att sidan inte blir tyngre för den som bara tittar.
- **Modellen** är ren TypeScript utan React, t.ex. `lib/progression.ts`. En Ackordföljd har Tonart, tempo, taktart, en lista med Delar (id, namn, antal Takter och Ackord per position Takt/Taktslag) och en Form som är en lista med Del-id. Delarnas namn är unika. Att ta bort en Del tar bort den ur Formen.
- **Ackordet** är grundton (0–11), ackordtyp, en mängd tillägg och Bas (0–11, förval grundtonen). Ackordnamnet och stavningen följer Tonarten och Notnamnsläget. Det gemensamma `Chord` i `lib/chordProgressions.ts` (tonklass och dur/moll) blir treklangen i ett Ackord, som Tonnetzen och Kvintcirkeln visar.
- **Tolkningen av ackordtext**, t.ex. `F#m7/C`, `Bbmaj7` och `Hm` i svenskt läge, är en ren funktion med tester.
- **Tonartens ackord** är de sju treklangerna på skalans steg, och i moll även dur-V.
- **Uppspelningsplanen** är en ren funktion: Ackordföljden (Formen utrullad, eller en enskild Del) blir en lista med händelser per Instrument i tid räknat i Taktslag. Den avgör vilket Ackord som klingar var (till nästa Ackord, över taktstreck och Delar, med bara trummor före det första Ackordet), stämföringen för elpiano och pad, basens toner och trummönstret per taktart. Tone.js-lagret spelar bara upp planen och slår av och på Instrument genom att stänga av ljudet för dem, utan att starta om.
- **Kompet** har ett fast mönster per taktart: trummor (bastrumma, virvel, hi-hat), bas på Basen, elpiano i en rytm och pad som ligger kvar.
- **Ångra och gör om** finns för hela Ackordföljden, som i Tab-editorn.
- **Lagringen** använder en ny tabell för Ackordföljder (en migrering i `db/migrations/`) med `jsonb`, `schemaVersion` och revisionsnummer, och API-vägar som speglar `app/api/library`. Den automatiska sparningen och Konflikthanteringen återanvänder mönstret i `lib/librarySync.ts`. Gästens Utkast ligger i webbläsaren, som `lib/draft.ts`. Ackordföljden är ingen `.itab`-fil och omfattas inte av ADR 0002.
- **Sajtspråk**: alla knappar och etiketter översätts till engelska och svenska i `lib/messages.ts`. Delarnas namn är fri text.

## Testing Decisions

- Testerna går genom de rena modulerna, test först med Vitest (TDD):
  - Antal Taktslag per taktart, och förflyttning med ←/→, Alt+←/→ och ↑/↓, också över gränser mellan Takter och Delar.
  - Tonartens ackord i dur och moll, med dur-V i moll.
  - Ackordnamn och tolkning av ackordtext i båda Notnamnslägena.
  - `+` och `−` behåller tillägg och Bas.
  - Uppspelningsplanen: Ackord klingar till nästa Ackord över taktstreck och Delar, bara trummor före det första, en Del som står två gånger i Formen spelas två gånger, och loop av en Del.
  - Stämföringen för elpiano och pad ligger nära föregående ackord, och basen spelar Basen.
  - Ackorden försvinner när en Del minskar eller taktarten byts, och ångra återställer dem.
  - Serialiseringen med `schemaVersion`.
  - API-vägarna för Biblioteket på samma sätt som `app/api/library.test.ts`.
- Ljudet, tangentbordet, layouten och mobil verifieras manuellt i appen.

## Out of Scope

Olika kompstilar (rock, ballad, shuffle). Volym per Instrument. Tonart, tempo och taktart per Del. Kyrkotonarter. Export till ljudfil, MIDI eller `.itab`. Fyrklanger i tonartens lista. Att Greppbrädan visar ackorden i en Ackordföljd. Att dela en Ackordföljd med en länk.
