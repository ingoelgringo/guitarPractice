# Spec: Edit-panelen, Täthet och Slag som Skjuts

Status: ready-for-agent

## Problem Statement

Edit-panelen är en flytande ruta som kan ligga över Sidan, och flera knappar har kortkommandot skrivet bredvid fast det redan står på knappen (pilarna). När man ändrar ett Notvärde mitt i musiken ändras bara det Slaget, så Takten blir för kort eller för lång och markeras röd, och man får laga den och varje Takt efter för hand. Det går inte att infoga ett Slag mitt i, och avståndet mellan noterna är fast, så få Takter får plats på en rad.

## Solution

Edit-panelen blir en sidopanel i full höjd mot högerkanten, och Sidan centreras i ytan bredvid. Kortkommandon som är samma tecken som knappen skrivs inte ut bredvid den.

Att ändra Notvärde bevarar tiden: ett kortare Notvärde delar Slaget i tonen och pauser, och ett längre tar tid från de följande Slagen när det är pauser eller samma ton. Med Shift ändras bara Slaget, och alla följande Slag Skjuts fram eller tillbaka genom hela Spåret, över taktstrecken. Detsamma händer när man infogar ett Slag (`I` eller `Insert`) eller tar bort ett (Shift+Delete, Delete med Markering). En ton som hamnar över ett taktstreck delas i två Slag med en Bindebåge (ADR 0003). När en ändring inte går visas en kort notis vid Markören som förklarar varför.

Partituret får en Täthet, som ställs med ett reglage i Partiturinställningarna och avgör hur tätt Slagen står och hur många Takter som får plats på en rad, på skärmen och i utskriften.

## User Stories

1. Som tabbare vill jag att Edit-panelen tar upp hela fönstrets höjd vid högerkanten, så att alla knappar syns utan att panelen skrollar i onödan.
2. Som tabbare vill jag att Sidan aldrig döljs av Edit-panelen, utan centreras i ytan till vänster om den, så att jag ser hela Sidan.
3. Som tabbare vill jag att Sidan krymper när ytan är smalare än A4, så att jag aldrig behöver skrolla i sidled.
4. Som tabbare vill jag att Sidan centreras i hela fönstret när jag fäller ihop Edit-panelen.
5. Som tabbare vill jag att kortkommandot inte står bredvid en knapp när det är samma tecken som på knappen (som pilarna), så att panelen blir luftigare. Det finns kvar i tooltipen.
6. Som tabbare vill jag att en åttondel som blir sextondel blir en sextondel med tonen och en sextondelspaus, så att Takten fortfarande är full.
7. Som tabbare vill jag att pauserna efter en delad ton blir så få och stora som möjligt, men börjar på jämna platser för sitt värde (fjärdedel till sextondel blir sextondel, sextondelspaus, åttondelspaus), så att det ser ut som vanlig notskrift.
8. Som tabbare vill jag att ett längre Notvärde tar tid från de följande Slagen när de är pauser eller har samma toner, så att jag kan slå ihop t.ex. sextondel och sextondelspaus till en åttondel.
9. Som tabbare vill jag att en paus eller ett Slag med samma toner kortas när bara en del av det behövs, så att resten står kvar på samma tidpunkt.
10. Som tabbare vill jag få en notis som säger varför när ett längre Notvärde inte går (t.ex. att nästa Slag har en annan ton eller ett eget Ackordnamn), så att jag förstår vad jag ska ändra.
11. Som tabbare vill jag att punktering och triol följer samma regler som Notvärdet, så att tiden bevaras även då.
12. Som tabbare vill jag kunna trycka Shift + en Notvärdestangent för att bara ändra Slaget och Skjuta alla följande Slag, så att jag kan ta bort eller lägga till tid mitt i.
13. Som tabbare vill jag kunna infoga ett tomt Slag före Markören med `I` eller `Insert`, med samma Notvärde som Slaget under Markören, så att jag kan lägga till en ton mitt i musiken.
14. Som tabbare vill jag att Shift+Delete och Delete med Markering drar tillbaka allt efter, så att det inte blir hål i Takterna.
15. Som tabbare vill jag att Slagen flödar över taktstrecken när de Skjuts, så att alla Takter är fulla efteråt.
16. Som tabbare vill jag att en ton som hamnar över ett taktstreck delas med en Bindebåge, så att den fortfarande klingar som en ton.
17. Som tabbare vill jag att två bundna halvor slås ihop igen när de hamnar i samma Takt, så att det inte blir onödiga bågar.
18. Som tabbare vill jag att Bindebågen bryts när jag ändrar ena halvan, så att det är tydligt vad som händer.
19. Som tabbare vill jag att taktartsbyten, tempobyten och repriser sitter kvar på sin Takt när Slagen Skjuts.
20. Som tabbare vill jag att slutet av Spåret fylls ut med pauser, eller får nya Takter, när Slagen Skjuts, och att en tom sista Takt som uppstår tas bort.
21. Som tabbare vill jag få en notis när en Skjutning skulle dela en triol över ett taktstreck, så att jag vet varför inget hände.
22. Som tabbare vill jag kunna göra noterna tätare med ett reglage i Partiturinställningarna, så att fler Takter får plats på en rad.
23. Som tabbare vill jag att Tätheten sparas i Partituret och gäller utskriften, så att det utskrivna ser ut som skärmen.

## Implementation Decisions

- **Termerna** Skjuta, Bindebåge och Täthet står i `CONTEXT.md`. Beslutet att Slag flödar över taktstreck står i `docs/adr/0003-slag-flodar-over-taktstreck.md`. Det ersätter meningen "Takter med fel antal slag … korrigeras inte tyst" i `.scratch/tab-editor/spec.md`.
- **Edit-panelen** (`.help`) blir fäst vid fönstrets högerkant, `top: 0` till `bottom: 0`, utan marginal och rundade hörn. Editorns scrollyta lämnar plats till höger för panelen när den är öppen, och Sidan (`--page-width: min(210mm, 100%)`) centreras och krymper i den ytan. Ihopfälld panel tar ingen plats. Partiturinställningarna ändras inte.
- **Kortkommandot bredvid knappen** utelämnas när `keys === label`. Regeln läggs i `SHORTCUT_GROUPS` (som redan utelämnar `keys` för siffrorna), inte i komponenten. Tooltipen behåller kortkommandot.
- **Pausregeln**: tid som ska fyllas med pauser från en viss tidpunkt fylls med det största Notvärdet som ryms och som börjar på en jämn multipel av sitt eget värde räknat från Taktens början, upprepat tills tiden är fylld. Punkterade pauser används inte. Tid som inte går att fylla med vanliga Notvärden (efter triol) fylls med triolpauser på samma sätt. Pausregeln används vid delning, vid förkortning av en paus, vid utfyllnad i slutet av Spåret och för pausdelen av ett Slag som delas av ett taktstreck.
- **Kortare Notvärde utan Shift** (`setDuration`, `toggleDot`, `toggleTriplet` när längden minskar): Slaget behåller toner, tekniker och texter med det nya Notvärdet, och resten av den gamla längden fylls efter det enligt Pausregeln. Inget Skjuts.
- **Längre Notvärde utan Shift** (när längden ökar): den tid som behövs tas från de följande Slagen, även över taktstreck. Det går bara om varje Slag i den tiden är en paus eller har exakt samma uppsättning (sträng, band), och om inget av dem utom det första har ett eget Ackordnamn eller en egen Anteckning. Det sista Slaget som berörs får kortas: en paus fylls med Pausregeln, och ett Slag med samma toner får den kortare längden (eller delas enligt Pausregelns indelning, med Bindebåge mellan delarna). Det förlängda Slaget behåller sina egna tekniker och texter. Hamnar det förlängda Slaget över ett taktstreck delas det med en Bindebåge. Går det inte ändras ingenting och en notis visas.
- **Shift + Notvärde** (`setDuration` med `shift: true`, för alla sex Notvärdena): bara Slaget ändras, och skillnaden i längd Skjuter allt efter. Punktering och triol har inget Shift-läge. `keyToCommand` skiljer Shift+bokstav från bokstav, vilket den inte gör idag.
- **Infoga** (`insertBeat`, tangenterna `I` och `Insert`): ett tomt Slag med samma Notvärde (inklusive punktering och triol) som Slaget under Markören infogas före Markören, och allt efter Skjuts fram. Markören står på det nya Slaget. En knapp läggs i Edit-panelen.
- **Ta bort med Skjutning**: `deleteBeat` (Shift+Delete) och borttagning av en Markering tar bort Slagen och Skjuter tillbaka allt efter med den borttagna tiden. Hela Takter i en Markering tas bort som idag.
- **Skjutning** är en ren funktion i partiturmodellen: Spårets Slag från en viss tidpunkt läggs om i Takterna efter deras taktarter (Byten och repriser sitter kvar på sin Takt). Ett Slag som hamnar över ett taktstreck delas: en paus enligt Pausregeln och en ton i bundna delar. Två bundna halvor i samma Takt slås ihop om summan är ett enda Notvärde (eventuellt punkterat). Vid flytt tillbaka fylls sista Takten med Pausregeln, och vid flytt fram skapas nya Takter med pauser. En tom sista Takt som uppstår tas bort, om det inte är den enda. Skulle en triolgrupp delas av ett taktstreck stoppas Skjutningen och en notis visas.
- **Bindebåge** i modellen: `Beat` får det valfria fältet `tiedFromPrevious` (utelämnas när det inte gäller), som betyder att Slaget fortsätter föregående Slags toner. Slaget har samma Toner som det föregående. Palm mute finns på båda halvorna, medan bend och förbindelse bara finns på den sista halvan. Ackordnamn och Anteckning finns bara på den första. Ett nytt band, en borttagen ton eller ett nytt Notvärde på någon av halvorna bryter bågen (fältet tas bort). Översättaren ritar bågen och uppspelningen låter tonen klinga vidare (alphaTabs `isTieDestination`). En Bindebåge skapas bara automatiskt, inte med en tangent.
- **Täthet** i modellen: Partituret får `spacing`, ett heltal 0–3 där 0 är dagens avstånd och högre värden är tätare. Översättaren eller `ScoreView` mappar steget till alphaTabs inställning för horisontellt avstånd (`display.stretchForce` eller motsvarande, se `node_modules/@coderline/alphatab`). Reglaget ligger i Partiturinställningarna och kan ångras som andra partiturändringar.
- **`.itab`**: nästa `schemaVersion` med en migrering som sätter `spacing: 0`, och validering av `spacing` och `tiedFromPrevious`. Levereras Täthet och Bindebåge i olika commits får de var sin version.
- **Notisen** är ett gränssnittselement vid Markören med `role="status"`, som inte tar fokus och försvinner efter cirka 4 sekunder eller vid nästa tangenttryck. Editorn ger skälet: ett kommando som inte går lämnar Partituret orört och sätter ett meddelande i `EditorState` (t.ex. `notice`) som skalet visar.
- **Den röda markeringen** av Takter med fel längd finns kvar. Klistra in skriver fortfarande över Slag för Slag.

## Testing Decisions

- Editorns beteende testas genom `apply(state, command)` i `lib/editor.test.ts`. Exempel:
  - Fjärdedel med ton till sextondel ger sextondel (ton), sextondelspaus och åttondelspaus. Punkterad fjärdedel till åttondel ger åttondel och två åttondelspauser.
  - Sextondel C och sextondelspaus, E ger en åttondel C. Sextondel C och sextondel D, E stoppas med en notis och lämnar Partituret orört.
  - Sextondel C och fjärdedelspaus, E ger åttondel C och resten som pauser på samma tidpunkt som förut.
  - Shift+S på första åttondelen i 4/4 med åtta åttondelar Skjuter allt en sextondel tillbaka. Den sista Takten fylls med en sextondelspaus.
  - Infoga en sextondel i en Takt med fyra fjärdedelar, följd av en tom Takt: den sista fjärdedelen delas med en Bindebåge över taktstrecket.
  - Skjuts det bundna paret tillbaka slås det ihop till en fjärdedel igen.
  - En Skjutning förbi ett byte till 3/4 lägger Slagen i 3/4-Takten och lämnar bytet kvar på Takten.
  - Ett nytt band på andra halvan bryter Bindebågen.
  - En triol som skulle delas av ett taktstreck stoppar Skjutningen med en notis.
- `keyToCommand` testas för Shift + Notvärde, `I` och `Insert`. `SHORTCUT_GROUPS` testas för att pilarna saknar `keys`.
- `toAlphaTab` testas för Bindebåge (`isTieDestination`) och Täthet.
- `.itab` testas med en fixtur av förra versionen som migreras till `spacing: 0`, och för validering av de nya fälten.
- Panelens layout, Sidans placering, notisen och reglaget verifieras manuellt i appen.
- Test först med Vitest (TDD).

## Out of Scope

Klistra in som Skjuter eller bevarar tid. Bindebåge med tangent eller mellan Slag i samma Takt för hand. Shift-läge för punktering och triol. Partiturinställningarna som sidopanel. Fast antal Takter per rad.
