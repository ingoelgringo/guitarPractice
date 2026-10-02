# Spec: Landningssida och Tab-editor (version 1)

Status: ready-for-agent

## Problem Statement

Jag spelar gitarr och vill kunna skriva ner låtar och övningar som gitarrtabulatur med riktiga noter, höra hur det låter och skriva ut det snyggt på A4. Befintliga verktyg är antingen dyra skrivbordsprogram, kräver konto eller låser in det man skrivit i någon annans moln.

Jag vill också att andra ska kunna använda verktyget fritt, utan konto. Men deras arbete får inte hamna i min databas eller belasta min server, så de behöver ett sätt att spara lokalt och fortsätta senare. Själv vill jag däremot ha mina Partitur sparade centralt på min egen VPS, så att jag kommer åt dem från vilken dator som helst.

Sajten ska dessutom kunna växa med fler Verktyg över tid. Därför behövs en landningssida som samlar dem.

## Solution

En webbplats med en enkel landningssida som hubb för **Verktyg**. Det första Verktyget är **Tab-editorn**.

- I Tab-editorn skriver man ett **Partitur** tab-först med tangentbordet: bandnummer på strängar, varje ton med ett **Notvärde**.
- Partituret visas som **Sidor** i A4-format i valt **Vy-läge**: *Noter + tabulatur*, *Bara noter* eller *Rytmtab*.
- Man kan spela upp Partituret med en markör som följer tonerna och skriva ut det via webbläsaren.
- En **Gäst** arbetar helt i webbläsaren. Arbetet sparas automatiskt som ett **Utkast**, och man kan ladda ner Partituret som en **Partiturfil** (`.itab`) och öppna den igen senare.
- **Ägaren** loggar in och har ett **Bibliotek** i databasen på VPS:en, där Partitur sparas automatiskt med skydd mot konflikter mellan flera flikar eller enheter.

## User Stories

### Landningssida

1. Som besökare vill jag se en landningssida med ett kort per Verktyg, så att jag förstår vad sajten erbjuder och kan välja Verktyg.
2. Som besökare vill jag kunna klicka på Tab-editorns kort och komma direkt till editorn, så att jag kan börja skriva utan omvägar.
3. Som besökare vill jag kunna använda Tab-editorn utan att skapa konto eller logga in, så att tröskeln blir så låg som möjligt.
4. Som Ägare vill jag ha en diskret inloggningslänk på landningssidan, så att jag kan logga in utan att den stör andra besökare.
5. Som Ägare vill jag att nya Verktyg kan läggas till som nya kort utan att landningssidan behöver göras om, så att sajten kan växa.

### Skapa och ställa in ett Partitur

6. Som Gäst vill jag öppna editorn och få ett tomt Partitur direkt, så att jag kan börja skriva genast.
7. Som användare vill jag ange titel, undertitel, artist och "tabbad av" för Partituret, så att huvudet på första Sidan blir korrekt.
8. Som användare vill jag välja Stämning för Spåret (standard, Drop D, DADGAD eller egen per sträng), så att tabben stämmer med hur jag spelar.
9. Som användare vill jag ange Capo, så att bandnumren är relativa till kapodastern och uppspelningen låter rätt.
10. Som användare vill jag ange starttempo, så att uppspelningen går i rätt takt.
11. Som användare vill jag ange starttaktart, så att Takterna får rätt längd.
12. Som användare vill jag välja Vy-läge för Partituret, så att det visas och skrivs ut så som jag vill läsa det.
13. Som användare vill jag att Vy-läget sparas i Partituret, så att det ser likadant ut nästa gång jag öppnar det och när jag skriver ut.

### Inmatning (tab-först)

14. Som användare vill jag flytta en markör mellan strängar och slag med piltangenterna, så att jag kan navigera utan mus.
15. Som användare vill jag skriva ett bandnummer (även tvåsiffrigt, t.ex. 12) på markörens sträng, så att en ton läggs in.
16. Som användare vill jag välja Notvärde (helnot, halvnot, fjärdedel, åttondel, sextondel, trettiotvåondel) med kortkommandon, så att rytmen blir rätt.
17. Som användare vill jag kunna punktera ett Notvärde, så att jag kan skriva punkterade rytmer.
18. Som användare vill jag kunna markera toner som triol, så att jag kan skriva triolrytmer.
19. Som användare vill jag lägga flera toner på samma slag på olika strängar, så att jag kan skriva ackord.
20. Som användare vill jag lägga in en paus med valt Notvärde, så att tystnad blir en del av rytmen.
21. Som användare vill jag ta bort en ton eller ett slag, så att jag kan rätta fel.
22. Som användare vill jag höra tonen när jag skriver in den, så att jag direkt hör om det blev rätt.
23. Som användare vill jag att en ny Takt skapas automatiskt när den aktuella är full och jag fortsätter skriva, så att jag inte behöver hantera taktstreck själv.
24. Som användare vill jag se tydligt när en Takt har för få eller för många slag, så att jag kan rätta rytmen.
25. Som användare vill jag klicka på en position i notbilden för att flytta markören dit, så att jag snabbt kan hoppa till ett ställe.

### Speltekniker och notation

26. Som användare vill jag markera hammer-on och pull-off mellan två toner, så att legato syns och hörs.
27. Som användare vill jag markera slide mellan två toner, så att glidningar syns och hörs.
28. Som användare vill jag markera bend med mål (t.ex. ½ eller hel ton), så att bends syns och hörs.
29. Som användare vill jag markera palm mute på toner, så att dämpat spel syns och hörs.
30. Som användare vill jag ändra taktart från en viss Takt, så att låtar med taktartsbyten kan skrivas.
31. Som användare vill jag ändra tempo från en viss Takt, så att tempobyten följs vid uppspelning.
32. Som användare vill jag markera början och slut på en repris (med antal varv), så att repetitioner inte behöver skrivas ut.

### Redigering

33. Som användare vill jag ångra och göra om ändringar, så att jag vågar experimentera.
34. Som användare vill jag markera ett eller flera slag eller hela Takter, så att jag kan arbeta med större delar.
35. Som användare vill jag kopiera och klistra in en markering, så att jag slipper skriva upprepade figurer flera gånger.
36. Som användare vill jag ta bort en markering, så att jag snabbt kan rensa bort material.
37. Som användare vill jag infoga en tom Takt före eller efter den aktuella, så att jag kan bygga ut låten mitt i.
38. Som användare vill jag ta bort en hel Takt, så att jag kan korta ner låten.

### Visning och Sidor

39. Som användare vill jag se Partituret uppdelat i A4-Sidor på skärmen, så att jag ser exakt hur utskriften blir.
40. Som användare vill jag se notsystem och tabulatur staplade i Vy-läget *Noter + tabulatur*, så att jag kan läsa båda samtidigt.
41. Som användare vill jag se bara notsystem i Vy-läget *Bara noter*, så att jag kan ge noterna till icke-gitarrister.
42. Som användare vill jag se tabulatur med rytmskaft i Vy-läget *Rytmtab*, så att jag får kompakt tab som ändå visar rytmen.
43. Som användare vill jag att titel, undertitel, artist, "tabbad av", Stämning, Capo och tempo visas överst på första Sidan, så att Partituret är självförklarande.
44. Som mobilanvändare vill jag kunna visa och spela upp ett Partitur, så att jag kan öva från telefonen även om jag inte kan redigera där.

### Uppspelning

45. Som användare vill jag spela upp och pausa Partituret, så att jag hör hur det låter.
46. Som användare vill jag att en markör följer tonerna under uppspelning och att vyn rullar med, så att jag kan följa med.
47. Som användare vill jag starta uppspelningen från markörens position, så att jag kan lyssna på ett visst ställe.
48. Som användare vill jag ändra uppspelningstempot i procent, så att jag kan öva långsamt.
49. Som användare vill jag slå på en metronom, så att jag kan spela med i rätt tempo.
50. Som användare vill jag slå på en intalning före uppspelningen, så att jag hinner förbereda mig.
51. Som användare vill jag att repriser, tempobyten och speltekniker följs vid uppspelning, så att det jag hör motsvarar det som står.

### Utskrift

52. Som användare vill jag skriva ut Partituret på A4 via webbläsaren, så att jag får det på papper.
53. Som användare vill jag kunna välja "Spara som PDF" i webbläsarens utskriftsdialog, så att jag kan dela en PDF.
54. Som användare vill jag att utskriften bara innehåller Sidorna och inte editorns knappar och paneler, så att resultatet blir rent.

### Utkast och Partiturfil (Gäst)

55. Som Gäst vill jag att mitt arbete sparas automatiskt som Utkast i webbläsaren, så att jag inte förlorar något om fliken stängs av misstag.
56. Som Gäst vill jag att Utkastet återställs när jag öppnar editorn igen, så att jag kan fortsätta där jag var.
57. Som Gäst vill jag få en tydlig upplysning om att Utkastet bara finns i den här webbläsaren, så att jag förstår att jag bör ladda ner en Partiturfil.
58. Som Gäst vill jag ladda ner Partituret som en `.itab`-fil, så att jag kan spara det på min egen dator.
59. Som Gäst vill jag öppna en `.itab`-fil från min dator i editorn, så att jag kan fortsätta redigera.
60. Som Gäst vill jag få en varning om jag försöker lämna sidan när ändringar inte har laddats ner, så att jag inte tappar arbete.
61. Som Gäst vill jag få ett begripligt felmeddelande om en fil är trasig eller inte är en Partiturfil, så att jag förstår vad som gick fel.
62. Som Gäst vill jag kunna öppna en Partiturfil som skapats med en äldre version av editorn, så att gamla filer aldrig blir oläsbara.
63. Som Gäst vill jag att filnamnet vid nedladdning utgår från Partiturets titel, så att filerna blir lätta att hitta.
64. Som Gäst vill jag kunna skapa ett nytt tomt Partitur och få frågan om jag vill ladda ner det nuvarande först, så att jag inte råkar skriva över mitt Utkast.
65. Som Gäst vill jag kunna använda hela editorn utan att något skickas till servern, så att mitt material stannar hos mig.

### Inloggning (Ägare)

66. Som Ägare vill jag logga in med användarnamn och lösenord, så att jag kommer åt mitt Bibliotek.
67. Som Ägare vill jag förbli inloggad mellan besök, så att jag slipper logga in varje gång.
68. Som Ägare vill jag kunna logga ut, så att ingen annan kommer åt mitt Bibliotek på en delad dator.
69. Som Ägare vill jag att upprepade felaktiga inloggningsförsök begränsas, så att ingen kan gissa sig till mitt lösenord.
70. Som besökare vill jag inte se någon möjlighet att registrera mig, eftersom sajten bara har ett konto.

### Bibliotek (Ägare)

71. Som Ägare vill jag se en lista över alla Partitur i mitt Bibliotek med titel, artist och senast ändrad, så att jag hittar det jag söker.
72. Som Ägare vill jag öppna ett Partitur från Biblioteket i editorn, så att jag kan fortsätta arbeta på det.
73. Som Ägare vill jag att ett nytt Partitur jag skapar läggs i Biblioteket direkt, så att jag aldrig glömmer att spara det.
74. Som Ägare vill jag att en importerad Partiturfil inte hamnar i Biblioteket automatiskt, så att jag kan titta på andras filer utan att fylla min databas.
75. Som Ägare vill jag kunna välja "Lägg i biblioteket" för ett Partitur som inte finns där, så att det därefter sparas centralt.
76. Som Ägare vill jag att ändringar i ett Partitur i Biblioteket sparas automatiskt cirka 2 sekunder efter senaste ändringen, så att jag aldrig behöver tänka på att spara.
77. Som Ägare vill jag att det också sparas när jag stänger eller döljer fliken, så att sista ändringen inte går förlorad.
78. Som Ägare vill jag se en statusindikator ("Sparat", "Sparar…" eller "Ej sparat (offline)"), så att jag vet om mitt arbete ligger säkert.
79. Som Ägare vill jag att ändringar som görs offline ligger kvar i Utkastet och sparas när jag är online igen, så att jag kan arbeta med instabilt nät.
80. Som Ägare vill jag att den automatiska sparningen stoppas och att en banner visas om Partituret har ändrats på en annan flik eller enhet, så att ingen version tyst skriver över en annan.
81. Som Ägare vill jag i den bannern kunna välja "Ladda om", "Spara som kopia" eller "Skriv över", så att jag själv avgör vad som gäller.
82. Som Ägare vill jag kunna ta bort ett Partitur från Biblioteket, så att jag kan städa bort sådant jag inte behöver.
83. Som Ägare vill jag kunna ladda ner vilket Partitur som helst i Biblioteket som `.itab`-fil, så att jag kan dela det eller ha en egen kopia.
84. Som Ägare vill jag att en nedladdad och sedan återöppnad Partiturfil blir ett nytt Partitur och aldrig skriver över originalet, så att jag inte råkar förstöra något.
85. Som Ägare vill jag kunna duplicera ett Partitur i Biblioteket, så att jag kan göra varianter.

### Drift och integritet

86. Som Ägare vill jag att sajten nås via `guitar.berghult.com` med HTTPS, så att den är säker och lätt att hitta.
87. Som Ägare vill jag att sajten belastar min VPS så lite som möjligt, så att mina andra appar inte påverkas.
88. Som Ägare vill jag att push till `main` deployar automatiskt efter gröna tester, så att det är enkelt att släppa nya versioner.
89. Som Ägare vill jag att Biblioteket säkerhetskopieras dagligen, så att jag kan återställa om något går fel.
90. Som besökare vill jag att det inte finns några skrivbara API:er utan inloggning, så att ingen kan fylla Ägarens databas.

## Implementation Decisions

### Stack och arkitektur
- Next.js 16 (App Router) i TypeScript, i en enda process. Frontend och Ägarens API ligger i samma app.
- **alphaTab** används för rendering (notsystem, tabulatur, rytmtab), A4-layout och uppspelning med synth och soundfont. **Partiturmodellen är egen** och är källan till sanningen. Den översätts till alphaTabs modell vid varje rendering (ADR 0001). Editorlogiken känner aldrig till alphaTab.
- All logik för Gäster (editor, uppspelning, utskrift, Utkast, Partiturfil) körs i webbläsaren. Servern serverar sidor och statiska filer och har API endast för Ägaren.
- UI-språket är engelska. Ordlistan i `CONTEXT.md` styr ändå namn i koden (`Score`, `Track`, `Bar`, `Duration`, `Tuning`, `ViewMode`, `Library`, `Draft` osv.).

### Moduler

1. **Partiturmodell** (ren domän, inga beroenden). Typerna för Partitur → Spår → Takt → slag och toner, med Notvärde, punktering, triol, speltekniker (hammer-on/pull-off, slide, bend med mål, palm mute), takt- och tempobyten, repriser med antal varv, Stämning, Capo, metadata (titel, undertitel, artist, "tabbad av") och Vy-läge. Modellen tillåter flera Spår, men version 1 skapar och redigerar bara ett (6-strängad gitarr).
2. **Editor** (ren logik, djup modul). Gränssnittet är i princip `apply(editorState, command) → editorState`. Editorstate består av Partituret, markören (Spår, Takt, slag, sträng), markeringen, aktuellt Notvärde och historiken för ångra och gör om.
   - Kommandona är semantiska ("skriv band 5", "markören höger", "sätt Notvärde åttondel", "växla punktering", "lägg till hammer-on", "kopiera markering", "klistra in", "infoga Takt efter", "ångra" …), inte tangenter.
   - Tvåsiffriga band hanteras i editorn (t.ex. "1" följt av "2" inom kort tid blir band 12).
   - Takter fylls automatiskt, och en ny Takt skapas när den aktuella är full. Takter med fel antal slag flaggas i en härledd valideringsfunktion och korrigeras inte tyst.
   - Ett tunt tangentbordsskal (utanför modulen) översätter tangenttryck till kommandon. Ett tunt klickskal översätter klick i alphaTabs notbild till kommandot "flytta markören till position".
3. **Partiturfil** (`.itab`, ADR 0002). `serialize(score) → text` och `parse(text) → score | fel`.
   - Versionerad JSON med `schemaVersion`. Kedjade migreringsfunktioner tar äldre versioner till den aktuella.
   - Filen innehåller ingen databasidentitet.
   - `parse` avvisar ogiltigt innehåll med ett strukturerat fel som UI:t kan visa begripligt.
   - Samma format lagras i databasen.
4. **Översättaren till alphaTab**: `toAlphaTab(score) → alphaTab Score`. Den täcker alla notationselement i version 1 och tar Vy-läget till alphaTabs inställningar för stavar och visning (Noter + tabulatur, Bara noter, Rytmtab).
5. **Notvy och uppspelning** (tunt skal kring alphaTab).
   - Renderar Sidor i A4-layout och synkar markören med editorns markör.
   - Uppspelning: spela och pausa, start från markören, en markör som följer tonerna och rullar vyn, tempo i procent, metronom och intalning.
   - Tonen spelas vid inmatning.
   - Soundfonten serveras som statisk fil.
6. **Utskrift**: print-CSS som döljer allt utom de renderade Sidorna, A4-format och sidbrytning per Sida. Ingen PDF genereras på servern.
7. **Utkastlagring** (webbläsaren).
   - Sparar det aktuella Partituret och, om det finns, dess Biblioteks-id och senast kända revision i IndexedDB eller `localStorage`.
   - Återställer vid start och varnar vid stängning om ändringarna inte har laddats ner (Gäst) eller inte har sparats (Ägare).
   - Läsning och skrivning ska tåla att lagringen saknas, t.ex. i privat läge.
8. **Bibliotekssynk** (klient). Gäller Partitur i Biblioteket.
   - Sparar automatiskt 2 sekunder efter senaste ändringen, vid `visibilitychange`/`pagehide` och när nätet återkommer.
   - Statustillstånden är *Sparat*, *Sparar…*, *Ej sparat (offline)* och *Konflikt*.
   - Vid konflikt stoppas den automatiska sparningen och en banner visas med valen Ladda om, Spara som kopia och Skriv över.
9. **Bibliotekets API** (Next.js route handlers, kräver inloggning):
   - lista Partitur (id, titel, artist, senast ändrad, revision)
   - hämta ett Partitur
   - skapa (från ett Partitur-dokument, ger id och revision 1)
   - spara (id, dokument och förväntad revision, ger ny revision eller **409 Conflict** med serverns aktuella revision)
   - skriv över (sparar oavsett revision)
   - duplicera
   - ta bort
   - Alla anrop utan giltig session ger 401. Det finns inga skrivbara endpoints utan inloggning.
10. **Inloggning**
    - Ett enda konto. Användarnamn och bcrypt-hashat lösenord ligger i miljövariabler (`OWNER_USERNAME`, `OWNER_PASSWORD_HASH`).
    - Lyckad inloggning ger en signerad, httpOnly, secure sessionscookie (`SESSION_SECRET`) med lång livslängd. Utloggning rensar den.
    - Inloggningsförsök begränsas per IP i appen och med `limit_req` i Nginx.
    - Det finns ingen användartabell och ingen registrering.
11. **Landningssida**: en enkel hubb med ett kort per Verktyg, definierade i en lista så att nya Verktyg läggs till som data, plus en diskret inloggnings- och utloggningslänk. Den slutliga designen bestäms senare.

### Databas
- En ny databas `guitarpractice` med egen användare i den befintliga containern `folkbibeln-postgres` (postgres:18, localhost:5435). Det blir ingen ny container, och databasen delas inte med Folkbibeln.
- Åtkomst med `pg` utan ORM. Migreringarna är numrerade SQL-filer.
- En tabell för Partitur i Biblioteket: id (uuid), titel och artist (avnormaliserade för listan), dokument (`jsonb`, `.itab`-formatet), `schemaVersion`, revision (heltal, ökar för varje sparning), `created_at` och `updated_at`.
- Revisionskontrollen sker atomiskt i en `UPDATE … WHERE id = $1 AND revision = $2`.

### Drift (följer mönstret i `vps-infra`, med avvikelser)
- PM2-processen `guitar-practice` kör Next.js `standalone` på port **3004** med `max_memory_restart: '250M'`.
- **Bygget görs i GitHub Actions, inte på servern.** CI kör tester, bygger `standalone` och skickar resultatet med `rsync`. Servern kör bara SQL-migreringar och `pm2 restart`. Det här avviker från K9 och Folkbibeln och ska dokumenteras.
- Nginx proxar till 3004. `/_next/static` och soundfonten serveras direkt från disk med lång `immutable`-cachning. `limit_req` gäller inloggningen. Certbot sköter SSL för `guitar.berghult.com`, som får ett A-record hos Oderland.
- Backup-cron kör `pg_dump` av `guitarpractice` dagligen kl. 03:00 och sparar dumparna i 30 dagar.
- I `vps-infra` skapas `apps/guitar-practice.md` och rader läggs till i tabellerna i `SERVER.md` och `README.md`. I `apps/folkbibeln.md` noteras att containern nu även hyser `guitarpractice`.
- Kodrepot behöver en GitHub-remote för Actions-deployen. Issue tracker förblir lokal markdown.

## Testing Decisions

- **Arbetssättet är TDD** (röd–grön–refaktorera) med Vitest. Varje beteende börjar med ett felande test.
- **Ett bra test** verifierar externt beteende genom en modulgräns: indata (kommandon, dokument, HTTP-anrop) mot observerbart utfall (Partiturets innehåll, markören, fel, HTTP-status). Tester får inte känna till interna datastrukturer, privata hjälpfunktioner eller i vilken ordning saker görs internt. En refaktorering som inte ändrar beteendet ska inte bryta något test.
- **Fyra testgränser** (seams). Rendering, uppspelning, utskrift och tangentbordsskalet är tunna skal utan egen seam i version 1.
  1. **Editor**: `apply(state, command)`. Merparten av testerna ligger här:
     - inmatning (band, tvåsiffriga band, ackord, pauser, Notvärden, punktering, triol)
     - automatisk ny Takt och valideringen av Takter
     - speltekniker, takt- och tempobyten, repriser
     - markering, kopiera, klistra in och ta bort, infoga och ta bort Takter
     - ångra och gör om (även för sammansatta operationer)
  2. **Partiturfil**: `serialize`/`parse`.
     - Rundtur för varje notationselement.
     - Migrering från varje tidigare `schemaVersion`. Fixturfiler för gamla versioner sparas i repot och får aldrig ändras.
     - Avvisning av trasig JSON, fel format och framtida okänd version.
  3. **Översättaren till alphaTab**: `toAlphaTab(score)`. Assertions görs mot alphaTabs publika modell (rätt tonhöjd utifrån Stämning och Capo, Notvärden, effekter, repriser, taktart, tempo och stavinställningar per Vy-läge).
  4. **Bibliotekets API**: route handlers testas mot en riktig Postgres (`postgres:18` i Docker lokalt och som service-container i CI).
     - 401 utan session.
     - Skapa, hämta, lista, spara med rätt revision och 409 vid fel revision.
     - Skriv över, duplicera och ta bort.
     - Inloggning med rätt och fel lösenord samt begränsning av försök.
- Playwright för end-to-end (inmatning i webbläsaren, uppspelning, utskriftsvy) skjuts upp.
- **Prior art**: Repot har ingen kod ännu. För API-tester mot riktig Postgres i CI finns mönster i K9 Solutions (test-jobb före deploy-jobb i GitHub Actions).
- CI kör alla tester som ett test-jobb. Deploy-jobbet körs bara om det är grönt.

## Out of Scope

- Landningssidans slutliga design. Version 1 är en funktionell hubb.
- Flera Spår, 7-strängad gitarr, bas och andra instrument (modellen tillåter det, men UI:t gör det inte).
- Sångtext, ackordnamn och ackorddiagram, volta (1:a/2:a slut), vibrato, döda toner och andra tekniker utöver de som räknas upp ovan.
- Transponering och loop av en markerad del (planerade till version 1.1).
- Not-först-inmatning (att placera toner i notsystemet).
- Redigering på mobil och surfplatta (visning och uppspelning fungerar).
- Registrering, flera konton och delning via publik länk.
- Versionshistorik för Partitur i databasen.
- Import och export av Guitar Pro och MusicXML.
- PDF-generering på servern.
- Svenskt gränssnitt (det kan läggas till senare).
- Andra Verktyg än Tab-editorn.
- Playwright och end-to-end-tester.

## Further Notes

- Ordlista: `CONTEXT.md`. Arkitekturbeslut: ADR 0001 (egen partiturmodell, alphaTab bara för rendering och uppspelning) och ADR 0002 (`.itab` som enda lagringsformat). Avvikelser från dem ska flaggas uttryckligen.
- Serverns uppsättning finns i syskonrepot `vps-infra` (`SERVER.md`, `RUNBOOK-new-app.md`). Där behöver dokumentationen uppdateras enligt avsnittet Drift.
- Formatet för `.itab` är ett publikt kontrakt så fort första filen har laddats ner. Ändringar i schemat kräver alltid en ny `schemaVersion` och en migrering.
- Bygget i CI med `standalone` och `rsync` är ett nytt deploymönster för servern. Om det fungerar bra kan K9 och Folkbibeln flyttas över senare för att minska belastningen vid deploy.
- En naturlig ordning för att dela upp arbetet i tickets: Partiturmodell och Editor-kärna → Partiturfil → Översättare och notvy → uppspelning → utskrift → Utkast → inloggning → Bibliotek och synk → landningssida → drift.
