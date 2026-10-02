# 17: Bibliotek: duplicera, ta bort och ladda ner

**What to build:** Från Biblioteket kan Ägaren duplicera ett Partitur, ta bort ett (efter bekräftelse) och ladda ner vilket som helst som `.itab`. En nedladdad och återöppnad fil blir alltid ett nytt Partitur och skriver aldrig över originalet.

**Blocked by:** 15

**Status:** ready-for-agent

- [x] Det finns API för att duplicera och ta bort, med tester mot riktig Postgres (TDD), inklusive 401 utan session.
- [x] Biblioteksvyn har åtgärderna duplicera, ta bort (med bekräftelse) och ladda ner.
- [x] En nedladdad `.itab` innehåller ingen databasidentitet (testat).
- [x] En återöppnad fil hamnar utanför Biblioteket tills "Lägg i biblioteket" väljs.

## Comments

**Implementerad.** Val och noteringar att känna till:
- **API** (allt ger 401 utan session, och ett okänt eller ogiltigt id ger 404):
  - `POST /api/library/:id/duplicate` svarar 201 med `{ id, revision: 1 }`. Kopian får titeln "<titel> (copy)", eller "Untitled (copy)" om titeln saknas, så att raderna går att skilja åt i listan. "Save as copy" från 16 behåller däremot titeln.
  - `DELETE /api/library/:id` svarar 204.
  - `GET /api/library/:id/file` ger Partiturfilen med `content-disposition: attachment`. Filnamnet följer `fileName`, med en ASCII-reserv och det riktiga namnet kodat enligt RFC 5987. Filen är exakt `serialize(score)` och saknar id och revision, vilket är testat.
  - `loadScore(id)` i `lib/library.ts` hämtar och läser ett Partitur. Den används också av `/tab-editor?score=`.
- **UI:** varje rad i `/library` har Duplicate, Download och Delete (`components/LibraryActions.tsx`).
  - Delete frågar först med `confirm`.
  - Download hämtar filen med `fetch`, så att en utgången session eller ett borttaget Partitur visas som ett fel och inte sparas som en fil.
  - Nedladdningen i webbläsaren är utbruten till `lib/download.ts` och delas med editorns Download.
- **Borttaget Partitur i Utkastet:** om Utkastet i samma webbläsare var det borttagna Partituret blir det ett Partitur utanför Biblioteket som inte är nedladdat (`detachFromLibrary` i `lib/draft.ts`). Editorn varnar då innan det ersätts.
- **Återöppnad fil:** den hamnade redan utanför Biblioteket. Det sköts av `onReplaced` i TabEditor, som bara lägger i Biblioteket vid New, så ingen ny kod behövdes.
- **Kvarstående begränsningar:**
  - Är editorn öppen i en annan flik när Partituret tas bort skriver den fliken tillbaka id:t i Utkastet vid nästa ändring. Sparningen stoppas ändå med *Not saved (removed from library)*, så inget går förlorat.
  - Reservtiteln "Untitled" finns på tre ställen: listan, dubbletten och `fileName`.
- **Verifierat:**
  - Vitest (346 tester, varav API-testerna mot Postgres), typkontroll, lint och `next build`.
  - Mot `next dev` med curl: duplicera ger 201, nedladdningen ger rätt filnamn och innehåller inget id, en Gäst får 401, ta bort ger 204 och sedan 404, och `/library` visar åtgärderna.
  - Knapparna i webbläsaren är inte provade manuellt.
