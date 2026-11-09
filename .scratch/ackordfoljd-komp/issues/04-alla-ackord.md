# 04: Alla ackord: väljaren, ackordtext, tillägg och Bas

**What to build:** "Annat ackord…" öppnar en panel vid det markerade Taktslaget med grundton, ackordtyp (dur, moll, förminskad, överstigande, sus2, sus4), tillägg som kan kombineras (6, 7, maj7, 9, add9, 11, 13, ♭5, ♭9, ♯9, ♯11, ♭13) och Bas. En bokstav öppnar ett fält där man skriver t.ex. `F#m7/C` och trycker Enter, med tonartens ackord först bland förslagen. Bokstäverna följer Notnamnsläget. Elpianot och padden spelar tilläggen och basen spelar Basen.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [x] Ackordet med ackordtyp, tillägg och Bas, och ackordnamn i båda Notnamnslägena (tester först).
- [x] Tolkning av ackordtext, t.ex. `F#m7/C`, `Bbmaj7` och `Hm` i svenskt läge (tester).
- [x] `+`/`−` behåller tillägg och Bas (tester).
- [x] Uppspelningsplanen spelar tilläggen och Basen (tester).
- [x] Panelen och textfältet med förslag.

## Comments

**2026-11-09:** Byggt. `lib/progression.ts` har fått `EXTENSIONS` och typen `Extension`, `progressionChordName` med tillägg och Bas, `toggleExtension` och `chordTones`. I ackordnamnet står först 6 eller 6/9, sedan septiman med det högsta av 9, 11 och 13 (t.ex. "maj9"), sus, add9 och sist de förändrade tonerna. En förändrad ton direkt efter grundtonen skrivs inom parentes, t.ex. "C(♭9)". `toggleExtension` tar bort tillägg som inte går ihop med det som slås på, t.ex. 7 och maj7, 6 och 7, eller 9 och add9. 9, 11 och 13 har med septiman, och i ett förminskat ackord är 7 den förminskade septiman. `lib/chordText.ts` har `parseChordText`, som läser t.ex. `F#m7/C`, `Bbmaj7`, `Hm` (svenskt läge), `Bm7b5`, `Bø7`, `G7(b9,b13)` och `C6/9` och läser tillbaka varje namn som `progressionChordName` ger. Där finns också `chordSuggestions`, med tonartens ackord först, sedan det tolkade ackordet och sist vanliga ackord, och `opensChordText`, där bokstäverna följer Notnamnsläget. I svenskt läge tolkas `Bb` som B (B♭). Uppspelningsplanen spelar tilläggen i elpianot och padden, i tät stämföring nära föregående ackord, och basen spelar Basen. Utkastet tar bara emot kända tillägg och lägger dem i den fasta ordningen. Tonartens ackord, *Annat ackord…*, panelen och ackordfältet ligger nu under den markerade Delens Takter (`components/ChordPicker.tsx`). Panelen har grundton, ackordtyp, Bas och tilläggen som av/på-knappar. Ackordet placeras med *Placera*, och Escape avbryter. I fältet väljer man förslag med upp- och nedpil eller med ett klick. Enter placerar det valda förslaget, annars det tolkade ackordet. Obs: CONTEXT.md saknar en term för det man skriver i fältet. "Ackordnamn" betyder fri text som inte tolkas, så kanske "Ackordtext"? Kvar: att prova panelen, fältet och ljudet med tillägg i webbläsaren.
