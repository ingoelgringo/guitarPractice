# Slag flödar över taktstrecken när de Skjuts

Ursprungligen fylldes Takter bara framåt vid inmatning, och en Takt med fel längd markerades röd men rättades aldrig automatiskt. Nu Skjuts alla följande Slag fram eller tillbaka genom hela Spåret, över taktstrecken, när ett Slag infogas eller tas bort eller när ett Notvärde ändras med Shift. Ett Slag med toner som hamnar över ett taktstreck delas i två Slag med en Bindebåge. Vi valde det för att Takterna alltid ska bli fulla när man redigerar mitt i musiken, i stället för att man ska behöva laga röda Takter för hand.

## Considered Options

- **Skjuta bara inom Takten** och markera Takten röd. Det är enkelt och påverkar ingenting utanför Takten, men en enda ändrad sextondel kräver då handpåläggning i varje Takt efter.
- **Stoppa en Skjutning som skulle dela ett Slag** i stället för att införa Bindebågar. Det gör att Skjutning nästan aldrig går, eftersom nästan varje Skjutning delar något Slag.

## Consequences

- Byten och repriser sitter kvar på sin Takt, och Slagen flödar igenom dem.
- Partiturmodellen får Bindebågar, och notvyn och uppspelningen måste hantera dem.
- En triolgrupp kan inte delas av ett taktstreck, så en Skjutning som skulle göra det stoppas.
- Den röda markeringen av Takter med fel längd finns kvar som skyddsnät, för gamla filer och för Klistra in, som fortfarande skriver över Slag för Slag.
