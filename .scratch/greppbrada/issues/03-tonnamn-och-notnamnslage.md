# 03: Tonnamn och Notnamnsläge

**What to build:** Man växlar Prickarnas etiketter mellan intervall och tonnamn. Tonnamnen stavas efter tonarten (F-dur ger B♭, E-dur ger D♯), även i grundtonsmenyn. Man väljer svenskt Notnamnsläge (H, och B för B♭) eller engelskt. Notnamnsläget kommer ihåg i webbläsaren med svenskt som standard. Etikettläget ligger i adressen när 02 är klar.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] Tester genom `fretboardView`: F-dur i svenskt läge ger "B" för B♭ och engelskt läge ger "B♭". E-dur ger "D♯". H/B i svenskt läge.
- [x] Grundtonsmenyn listar C, C♯/D♭, D, E♭, E, F, F♯/G♭, G, A♭, A, B♭, H/B enligt Notnamnsläget.
- [x] Notnamnsläget sparas i localStorage (läsning och skrivning i try/catch). Sidan fungerar utan lagring.

## Comments

**Implementerad** tillsammans med 02.
- Varje skalsteg får sin bokstav räknat från Grundtonens. Grundtonen stavas så att Föräldraskalan får minst förtecken (G♯-moll, D♭-dur). Vid lika gäller menyns stavning (E♭-moll, F♯-dur).
- Den blå tonen stavas som ♭5 (A-blues ger E♭). En ton som då skulle få dubbelförtecken stavas med grannbokstaven, så E♭-blues ger A. F-blues ger C♭ och B♭-blues F♭. **Att bekräfta:** ska det bli H/E i stället?
- Notnamnsläget läses med `useSyncExternalStore`: svenskt på servern, och det sparade valet efter hydreringen.
