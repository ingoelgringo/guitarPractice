# 07: Ackordföljder i Biblioteket

**What to build:** Ägaren sparar Ackordföljder i Biblioteket. De sparas automatiskt med revisionsnummer och kan öppnas, få nytt namn, kopieras och tas bort från en lista på sidan Chord Progressions. En Konflikt ger valen *Ladda om*, *Spara som kopia* och *Skriv över*. En Gäst ser ingen lista och har bara sitt Utkast.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] Migrering i `db/migrations/` för en tabell med Ackordföljder (`jsonb`, revision).
- [x] API-vägar som speglar `app/api/library`, bara för Ägaren (tester som `app/api/library.test.ts`).
- [x] Automatisk sparning och Konflikthantering med mönstret i `lib/librarySync.ts`.
- [x] Listan på sidan och knapparna för att öppna, byta namn, kopiera och ta bort.
