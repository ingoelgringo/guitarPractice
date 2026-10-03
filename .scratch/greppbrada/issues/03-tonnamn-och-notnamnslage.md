# 03: Tonnamn och Notnamnsläge

**What to build:** Man växlar Prickarnas etiketter mellan intervall och tonnamn. Tonnamnen stavas efter tonarten (F-dur ger B♭, E-dur ger D♯), även i grundtonsmenyn. Man väljer svenskt Notnamnsläge (H, och B för B♭) eller engelskt. Notnamnsläget kommer ihåg i webbläsaren med svenskt som standard. Etikettläget ligger i adressen när 02 är klar.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Tester genom `fretboardView`: F-dur i svenskt läge ger "B" för B♭ och engelskt läge ger "B♭". E-dur ger "D♯". H/B i svenskt läge.
- [ ] Grundtonsmenyn listar C, C♯/D♭, D, E♭, E, F, F♯/G♭, G, A♭, A, B♭, H/B enligt Notnamnsläget.
- [ ] Notnamnsläget sparas i localStorage (läsning och skrivning i try/catch). Sidan fungerar utan lagring.
