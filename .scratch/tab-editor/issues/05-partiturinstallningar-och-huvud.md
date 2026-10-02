# 05: Partiturinställningar och huvud

**What to build:** Användaren kan ange titel, undertitel, artist och "tabbad av", välja Stämning (förval som standard, Drop D och DADGAD, eller egen per sträng), Capo, starttempo och starttaktart. Huvudet på första Sidan visar titel, undertitel, artist, "tabbad av", Stämning, Capo och tempo. Tonhöjden i notsystemet och vid uppspelning följer Stämning och Capo. Bandnumren i tabben är relativa till Capo.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] Det finns en panel eller dialog för metadata, Stämning, Capo, tempo och taktart.
- [x] Ändringarna går genom Editor-kommandon och kan ångras.
- [x] Översättaren beräknar rätt tonhöjd för alla förvalda stämningar, en egen stämning och flera capolägen (testat).
- [x] Huvudet på första Sidan visar alla fälten, och tomma fält utelämnas.
- [x] En ändrad starttaktart påverkar valideringen av Takter (när 03 är klar).

## Comments

**Implementerad.** Val och noteringar att känna till:
- Partiturmodellen har fått `metadata` (titel, undertitel, artist, "tabbad av"), `tempo` (starttempo i BPM, 120 som standard) och `capo` per Spår (0 utan Capo).
- Nya Editor-kommandon: `setMetadata`, `setTuning`, `setCapo`, `setTempo` och `setTimeSignature`. Alla går att ångra. Ogiltiga värden avvisas tyst:
  - Capo: 0–24.
  - Tempo: heltal 20–400.
  - Taktart: 1–32 slag, med halvnot till sextondel som slagets Notvärde.
  - Stämning: lika många strängar som förut och MIDI-tonhöjd 0–127.
  Metadata trimmas, så ett fält med bara mellanslag blir tomt.
- Panelen "Score settings" ligger uppe till vänster:
  - Text- och sifferfält skickas när man lämnar fältet eller trycker Enter, så varje tangenttryck blir inte ett eget ångra-steg. Ett tomt sifferfält eller ett avvisat värde visar det gamla värdet igen.
  - Stämningen väljs bland förvalen eller per sträng (E1–E5). Panelen visar "Custom" när stämningen inte matchar något förval.
  - Panelen visar markörens Spår, samma Spår som kommandona ändrar.
- Ctrl+Z och Ctrl+Y fungerar även när fokus står i en rullgardin i panelen. I textfält gäller fältets eget ångra.
- Huvudet ritas av alphaTab utifrån översättarens modell. Titel, undertitel och artist står centrerat. "Tabbed by" står till höger; alphaTab döljer raden som standard, så översättaren slår på den. Tomma fält utelämnas av alphaTab.
- Stämningen visas med namn för förvalen. Utom för standardstämningen ritas också strängarna. För en egen Stämning sätter alphaTab ett eget namn när den känner igen den (t.ex. "Guitar Open G Tuning"), annars visas bara strängarna.
- Tempo och Capo ritas av alphaTab som tempomarkering och "Capo. fret N" ovanför första Takten, inte i själva titelblocket. De står ändå överst på första Sidan.
- Tonhöjden: alphaTab räknar lös sträng + Capo + band, och bandnumren i tabben står kvar relativt Capo. Uppspelningen (ticket 09) använder samma modell.
- `Metadata` saknas i ordlistan i CONTEXT.md.
- Verifierat i headless Chrome: huvudet med alla fält, egen Stämning, Capo och tempo, ångra med Ctrl+Z och tömt Capo-fält.

