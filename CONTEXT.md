# Guitar Practice

En webbplats med verktyg för gitarrister. Det första verktyget är en editor där man skriver gitarrtabulatur med noter, spelar upp det och skriver ut det i A4-format.

## Language

### Partitur

**Partitur** (`Score`):
Det kompletta verk som användaren skriver: det som sparas, laddas ner, öppnas igen och skrivs ut. Det består av ett eller flera Spår.
_Avoid_: Tab, projekt, dokument, låt

**Spår** (`Track`):
En stämma för ett instrument i ett Partitur, med egen Stämning och Capo. Version 1 har exakt ett spår per partitur: en 6-strängad gitarr.
_Avoid_: Instrument, stämma

**Takt** (`Bar`):
En tidsenhet i ett Spår som avgränsas av taktstreck och har en taktart. Taktarten och tempot gäller från Partiturets start eller från det senaste Bytet före.
_Avoid_: Measure

**Byte** (`BarChange`):
En ny taktart eller ett nytt tempo från och med en viss Takt, till nästa byte. Första Takten har inga byten, där gäller Partiturets starttaktart och starttempo.
_Avoid_: Ändring, övergång

**Repris** (`repeatStart`, `repeatEnd`):
En följd av Takter som spelas flera varv. Den börjar med en reprisstart och slutar med ett reprisslut som anger antalet varv sammanlagt. Utan reprisstart går reprisen tillbaka till början. Repriser kan ligga i varandra.
_Avoid_: Loop, upprepning

**Slag** (`Beat`):
En tidpunkt i en Takt med ett Notvärde. Ett slag utan toner är en paus, och ett slag med flera toner är ett ackord.

**Ton** (`Note`):
Ett band på en sträng i ett Slag. Strängarna numreras från den ljusaste: sträng 1 är ljusa e i standardstämning.

**Markör** (`Cursor`):
Den position i Partituret (Spår, Takt, Slag, sträng) där nästa inmatning hamnar.

**Markering** (`Selection`):
En följd av Slag i markörens Spår, från där markeringen började till Markören, eventuellt över flera Takter. Den kopieras, klistras in och tas bort som en enhet. Det kopierade (`clipboard`) finns kvar tills något annat kopieras.
_Avoid_: Urval, region

**Stämning** (`Tuning`):
Tonhöjden för varje lös sträng i ett Spår, t.ex. standard (EADGBE) eller Drop D.

**Capo**:
Det band som kapodastern sitter på. Bandnummer i tabben anges relativt capot.

**Notvärde** (`Duration`):
Hur länge en ton eller paus varar (fjärdedel, åttondel osv., eventuellt punkterad eller i triol). Varje ton har ett notvärde, även när bara tabulatur visas.

**Speltekniker**:
Hur en Ton spelas: hammer-on och pull-off, slide, bend med mål i halvtoner och palm mute. Hammer-on, pull-off och slide är *förbindelser* (`Connection`) från en Ton till Tonen på samma sträng i nästa Slag.
_Avoid_: Effekter, artikulation

### Visning

**Vy-läge** (`ViewMode`):
Hur ett Partitur visas. Det är en egenskap hos partituret och styr både skärm och utskrift. Det finns tre lägen: *Noter + tabulatur*, *Bara noter* och *Rytmtab* (tabulatur med rytmskaft, utan notsystem).

**Sida** (`Page`):
En renderad A4-sida av ett Partitur. Den är ett resultat av layouten och sparas inte.
_Avoid_: Ark, blad

### Lagring

**Partiturfil** (`.itab`):
En nedladdad fil som innehåller ett Partitur. När den öppnas igen blir den alltid ett nytt Partitur och skriver aldrig över ett befintligt.
_Avoid_: Export, sparfil

**Bibliotek** (`Library`):
Ägarens samling av Partitur i databasen. Ett Partitur i Biblioteket sparas automatiskt och har ett revisionsnummer. Ett Partitur utanför Biblioteket finns bara som Utkast och Partiturfil.
_Avoid_: Molnet, databasen, mina projekt

**Konflikt** (`conflict`):
När ett Partitur i Biblioteket har sparats på en annan flik eller enhet sedan den revision man utgick från. Den automatiska sparningen stoppas tills Ägaren väljer *Ladda om* (ta den sparade versionen), *Spara som kopia* (ett nytt Partitur i Biblioteket) eller *Skriv över* (spara oavsett revision).
_Avoid_: Krock, versionsfel

**Utkast** (`Draft`):
Den automatiskt sparade kopian av det Partitur man arbetar med. Den finns bara i den aktuella webbläsaren och är inte en säker lagring.
_Avoid_: Autosave, cache

### Sajt

**Verktyg** (`Tool`):
En fristående funktion på sajten som nås från landningssidan, t.ex. Tab-editorn.
_Avoid_: Modul, app, sida

### Användare

**Gäst**:
Den som använder editorn utan att logga in. En gäst sparar endast genom att ladda ner en fil.

**Ägare**:
Det enda inloggade kontot (sajtens ägare). Ägaren kan även lägga Partitur i Biblioteket. Det finns ingen registrering.
_Avoid_: Admin, användare
