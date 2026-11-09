# 01: Editorn med Takter, Taktslag och tonartens ackord

**What to build:** Under Tonnetzen och Kvintcirkeln finns en editor för en Ackordföljd med en Del ("Verse", 4 Takter). Takterna visas med taktstreck och en plats per Taktslag. Man väljer Tonart (markerad i Kvintcirkeln), taktart (4/4, 3/4, 2/4, 6/8, 12/8) och tempo (40–240, med tap tempo). Ett markerat Taktslag ger en lista med tonartens treklanger med steg, och i moll även dur-V. Siffrorna 1–7 väljer ett steg, `+`/`−` ger dur/moll, Backspace/Delete tar bort och ←/→ och Alt+←/→ flyttar. Gästens Ackordföljd sparas som Utkast i webbläsaren.

**Blocked by:** –

**Status:** ready-for-agent

- [ ] Modellen i `lib/progression.ts` med ny Ackordföljd enligt förvalen, Taktslag per taktart och förflyttning (tester först).
- [ ] Tonartens ackord i dur och moll (tester).
- [ ] `+` och `−` på det markerade Ackordet (tester).
- [ ] Editorn med taktstreck, markering, listan och tangentbordet.
- [ ] Tonart, taktart och tempo med tap tempo. Tonarten markeras i Kvintcirkeln.
- [ ] Utkast i webbläsaren med `schemaVersion`.
- [ ] Texter på engelska och svenska.
