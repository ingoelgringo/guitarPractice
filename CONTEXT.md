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
En tidsenhet i ett Spår som avgränsas av taktstreck och har en taktart.
_Avoid_: Measure

**Slag** (`Beat`):
En tidpunkt i en Takt med ett Notvärde. Ett slag utan toner är en paus, och ett slag med flera toner är ett ackord.

**Ton** (`Note`):
Ett band på en sträng i ett Slag. Strängarna numreras från den ljusaste: sträng 1 är ljusa e i standardstämning.

**Markör** (`Cursor`):
Den position i Partituret (Spår, Takt, Slag, sträng) där nästa inmatning hamnar.

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
