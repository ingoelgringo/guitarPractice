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
En tidpunkt i en Takt med ett Notvärde. Ett slag utan toner är en paus, och ett slag med flera toner klingar som ett ackord. Ett slag kan också ha ett Ackordnamn och en Anteckning.

**Ackordnamn** (`chordName`):
En fri text ovanför ett Slag som namnger ackordet som spelas där, t.ex. "Am7" eller "G/B". Den tolkas inte och påverkar inte vilka Toner Slaget har eller hur det låter. Den kan stå på en paus.
_Avoid_: Ackord (Ackordnamnet tolkas inte), ackordsymbol

**Anteckning** (`annotation`):
En fri kort text vid ett Slag, t.ex. "let ring". Den står under notsystemet, eller ovanför tabulaturen när notsystemet inte visas. Den påverkar inte uppspelningen.
_Avoid_: Sångtext, kommentar, text

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

### Greppbräda

**Greppbräda** (`Fretboard`):
Verktyget som visar en liggande gitarrhals med Prickar för det man valt att se: en Skala och, utifrån den, Ackord, Boxar och CAGED-former.
_Avoid_: Gitarrhals, halskarta, skalverktyg

**Prick** (`Dot`):
En markerad position (sträng, band) på Greppbrädan, med en etikett (intervall eller tonnamn). En prick hör inte till något Slag.
_Avoid_: Ton, not, markering

**Grundton** (`root`):
Den ton som en Skala eller ett Ackord utgår från. Det kan vara vilken som helst av de tolv tonerna.

**Skala** (`Scale`):
En Grundton och ett mönster av intervall, t.ex. A mollpentatonik eller C-dur.

**Föräldraskala**:
Den sjutoniga skala som en pentatonisk skala eller en bluesskala hämtar sina Ackord från, t.ex. A naturlig moll för A mollpentatonik.

**Ackord** (`Chord`):
En treklang byggd på ett steg i en Skala (eller i dess Föräldraskala), angiven med steg och namn, t.ex. "ii – Dm".
_Avoid_: Ackordnamn (fri text i editorn)

**Box** (`Box`):
Ett av en Skalas fem lägen: ett område på några band där skalans toner spelas utan att flytta handen. Boxarna numreras 1–5 från det läge som har Grundtonen på sträng 6.
_Avoid_: Position, mönster

**CAGED-form** (`CagedShape`):
En av fem greppformer (C, A, G, E, D) för ett dur- eller mollackord, flyttad längs halsen till Ackordets Grundton. Den visar ett grepp, i varje kopia av den valda Boxen när Boxen syns på flera ställen. Ett förminskat Ackord har ingen CAGED-form.
_Avoid_: Grepp, shape

**Ackordets penta**:
Den pentatoniska skalan på Ackordets grundton: durpentatonik för ett durackord och mollpentatonik för ett mollackord, t.ex. D mollpentatonik för ii – Dm i C-dur. Ett förminskat Ackord har ingen penta.
_Avoid_: Ackordskala, arpeggio

**Penta-box**:
En av de fem Boxarna i Ackordets penta, numrerad 1–5 på samma sätt som Skalans Boxar men från Ackordets grundton.
_Avoid_: Penta-läge, penta-position

**Strängset** (`StringSet`):
De tre strängar som ett Treklangsgrepp spelas på: tre intilliggande strängar (6-5-4, 5-4-3, 4-3-2, 3-2-1) eller en basssträng följd av en överhoppad sträng och de två nästa (6-4-3, 5-3-2, 4-2-1).
_Avoid_: Stränggrupp, strängar

**Treklangsgrepp** (`Triad`):
Ett Ackords tre toner spelade på ett Strängset, en ton per sträng. Alla Ackord har Treklangsgrepp, även förminskade.
_Avoid_: Triad, voicing, shape, treklang (ett Ackord är redan en treklang)

**Omvändning** (`Inversion`):
Vilken av Ackordets toner som ligger lägst i ett Treklangsgrepp: grundtonen (grundläge), tersen (första omvändningen) eller kvinten (andra omvändningen).
_Avoid_: Inversion, läge

**Lager** (`Layer`):
Hur en Prick visas på Greppbrädan: i Ackordets lager (orange: greppet, Penta-boxen, Treklangsgreppet, Ackordets penta eller Ackordets toner), i Boxens lager (blått: Boxens övriga toner), i skalans lager (blått: alla skaltoner när inget är valt) eller nedtonad.
_Avoid_: Betoning, färg, nivå

**Flik** (`Tab`):
Ett sätt att välja i Greppbrädans panel. Flikarna är *CAGED*, *Penta* och *Treklanger*, och senare kan en flik för fyrklanger komma.
_Avoid_: Vy, läge, visningssätt

**CAGED-tabellen**:
CAGED-flikens tabell med Skalans Ackord som rader och Boxarna som kolumner. Varje cell är den CAGED-form för radens Ackord som ligger i kolumnens Box.
_Avoid_: Matris, rutnät

**Penta-tabellen**:
Penta-flikens tabell med samma rader och kolumner som CAGED-tabellen. Varje cell är numret på den Penta-box i radens Ackords penta som ligger i kolumnens Box.

**Treklangstabellen**:
Treklangsflikens tabell med samma rader och kolumner som CAGED-tabellen. Varje cell är det Treklangsgrepp för radens Ackord på det valda Strängsetet som ligger närmast kolumnens Box, angivet med Omvändningens lägsta ton (R, 3 eller 5).

**Notnamnsläge** (`NoteNameMode`):
Hur tonnamn skrivs: *svenskt* (H, och B för det som på engelska heter B♭) eller *engelskt*. I övrigt följer stavningen tonarten, så F-dur skrivs med B♭ och E-dur med D♯.

### Sajt

**Verktyg** (`Tool`):
En fristående funktion på sajten som nås från landningssidan, t.ex. Tab-editorn och Greppbrädan.
_Avoid_: Modul, app, sida

### Användare

**Gäst**:
Den som använder editorn utan att logga in. En gäst sparar endast genom att ladda ner en fil.

**Ägare**:
Det enda inloggade kontot (sajtens ägare). Ägaren kan även lägga Partitur i Biblioteket. Det finns ingen registrering.
_Avoid_: Admin, användare
