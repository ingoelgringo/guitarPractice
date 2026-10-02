# 08: Utkast i webbläsaren

**What to build:** En Gäst förlorar aldrig arbete av misstag. Det aktuella Partituret sparas automatiskt som ett Utkast i webbläsaren och återställs nästa gång editorn öppnas. Det framgår tydligt att Utkastet bara finns i den här webbläsaren. Om man försöker lämna sidan med ändringar som inte är nedladdade varnar webbläsaren. "Nytt Partitur" frågar först om man vill ladda ner det nuvarande.

**Blocked by:** 07

**Status:** ready-for-agent

- [x] Utkastet sparas (i `.itab`-formatet) efter ändringar och återställs när editorn startar.
- [x] En diskret upplysning säger att Utkastet bara finns i den här webbläsaren och att man bör ladda ner en Partiturfil.
- [x] En varning vid `beforeunload` visas när det finns ändringar som inte är nedladdade.
- [x] "Nytt Partitur" frågar om nedladdning innan Utkastet ersätts.
- [x] Läsning och skrivning tål att lagringen saknas eller kastar fel (privat läge), och editorn fungerar ändå.
- [x] Ett Utkast med en äldre `schemaVersion` migreras vid återställning.
- [x] Utkastet kan bära Biblioteks-id och senast kända revision (används i 16).

## Comments

**Implementerad.** Val och noteringar att känna till:
- `lib/draft.ts` är en ny testseam (godkänd av användaren): `saveDraft(storage, draft)`, `loadDraft(storage)` och `browserStorage()`.
  - `storage` är en `localStorage`-liknande `DraftStorage` eller `null`. Att lagringen saknas eller kastar fel (privat läge, full kvot, blockerad webbplatsdata) sväljs, och då finns inget Utkast.
- Utkastet ligger i `localStorage` under nyckeln `guitarPractice.tabEditor.draft` som `{ itab, downloaded, library? }`.
  - `itab` är Partiturfilens text och läses med `parse`, så äldre `schemaVersion` migreras på samma sätt som filer.
  - Nyckeln och formatet ligger kvar i användarnas webbläsare mellan versioner och är därför ett kontrakt. Testerna skriver det direkt.
  - Ett Utkast som inte går att läsa (trasigt, eller från en senare version) återställs inte.
- `downloaded` lagras, så att ett återställt Utkast som redan har laddats ner inte ger en varning när man lämnar sidan. Det betyder "detsamma som när det senast laddades ner eller öppnades från en fil". Ett återställt Utkast med ändringar räknas som ej nedladdat.
- `TabEditor` äger nu jämförelsen mot den senaste Partiturfilen (`fileText`), som tidigare låg i `ScoreFileButtons`.
- Utkastet sparas efter varje ändring av Partituret eller nedladdningsstatusen, men inte vid start. Annars skulle ett Utkast som inte gick att läsa skrivas över tyst bara för att editorn öppnades.
- `library` (Biblioteks-id och senast kända revision) läses och skrivs av `lib/draft.ts`. Däremot för `TabEditor` inte vidare ett återställt `library` när Utkastet sparas igen. Det måste kopplas in i 16.
- Knappen "New" ligger först i verktygsraden (New, Open…, Download).
  - Finns det ändringar som inte är nedladdade öppnas en modal `<dialog>` med valen Cancel, Don't download och Download. Esc räknas som Cancel.
  - Open… använder fortfarande `confirm`, eftersom den frågan bara har två svar.
  - Kortkommandona ignoreras medan en dialog är öppen.
- Upplysningen "Your work is saved as a draft in this browser only…" står diskret under verktygsraden.
- Verifierat i headless Chrome:
  - Utkastet sparas och återställs efter omladdning.
  - `beforeunload` varnar bara när det finns ändringar som inte är nedladdade.
  - Dialogen för New fungerar med Cancel och Don't download.
  - Tangenter bakom dialogen ändrar inte Partituret.
  - Ett Utkast från en framtida version ligger kvar efter start och ersätts först vid första ändringen.
