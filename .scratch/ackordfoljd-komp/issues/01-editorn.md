# 01: Editorn med Takter, Taktslag och tonartens ackord

**What to build:** Under Tonnetzen och Kvintcirkeln finns en editor för en Ackordföljd med en Del ("Verse", 4 Takter). Takterna visas med taktstreck och en plats per Taktslag. Man väljer Tonart (markerad i Kvintcirkeln), taktart (4/4, 3/4, 2/4, 6/8, 12/8) och tempo (40–240, med tap tempo). Ett markerat Taktslag ger en lista med tonartens treklanger med steg, och i moll även dur-V. Siffrorna 1–7 väljer ett steg, `+`/`−` ger dur/moll, Backspace/Delete tar bort och ←/→ och Alt+←/→ flyttar. Gästens Ackordföljd sparas som Utkast i webbläsaren.

**Blocked by:** –

**Status:** ready-for-agent

- [x] Modellen i `lib/progression.ts` med ny Ackordföljd enligt förvalen, Taktslag per taktart och förflyttning (tester först).
- [x] Tonartens ackord i dur och moll (tester).
- [x] `+` och `−` på det markerade Ackordet (tester).
- [x] Editorn med taktstreck, markering, listan och tangentbordet.
- [x] Tonart, taktart och tempo med tap tempo. Tonarten markeras i Kvintcirkeln.
- [x] Utkast i webbläsaren med `schemaVersion`.
- [x] Texter på engelska och svenska.

## Comments

**2026-11-09:** Byggt. Modellen ligger i `lib/progression.ts` (Taktslag, Tonart med stavning efter Tonarten, tonartens ackord, `+`/`−`, förflyttning, taktart, tempo och tap tempo) och formatet och Utkastet i `lib/progressionDraft.ts` (`schemaVersion` 1, nyckeln `guitarPractice.chordProgressions.draft`). Editorn är `components/ProgressionEditor.tsx` och Utkastet läses med `components/useProgressionDraft.ts`, bara i webbläsaren. Tonarten markeras med en grön ring i Kvintcirkeln. Siffran 5 i moll ger v, och `+` gör det till V. Förflyttningen går redan över gränsen mellan Delar och ↑/↓ byter Del, inför ticket 03. Kvar: tangentbordet, layouten, mobil och teman i webbläsaren.
