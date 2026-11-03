# 02: Gitarrsidan

**What to build:** Startsidan blir Gitarrsidan med rubriken "Guitar" och en kort introduktion om gitarrverktygen. Korten är Tab Editor, Fretboard Practice och Chord Progressions. Chord Progressions saknar länk och visas nedtonat med "Coming soon". Spelkortet (Spring i Stenhagen) och fältet `external` i `lib/tools.ts` tas bort. Log in/Library ligger kvar diskret i sidfoten. "← Guitar Practice" i `components/TabEditor.tsx` och `components/Fretboard.tsx` blir "← Guitar". Sidtitlarna blir t.ex. "Fretboard · Guitar", och sajttiteln i `app/layout.tsx` blir "Guitar".

**Blocked by:** 01

**Status:** done

- [x] Test: listan med Verktyg innehåller de tre korten, och Chord Progressions har ingen länk.
- [x] Gitarrsidan visar korten, och det nedtonade kortet går inte att klicka på eller tabba till.
- [x] Inget kvar som säger "Guitar Practice" i gränssnittet.
