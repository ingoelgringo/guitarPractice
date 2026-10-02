# 09: Uppspelning

**What to build:** Användaren kan spela upp Partituret. Spela och pausa, starta från markören, se en markör som följer tonerna medan vyn rullar med, ändra tempot i procent, slå på metronom och intalning. När man skriver in en ton hörs den direkt.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] alphaTabs synth är konfigurerad med en soundfont som serveras som statisk fil (med cachning via Nginx, se 02).
- [x] Spela och pausa samt start från markörens position fungerar.
- [x] Markören följer uppspelningen och vyn rullar automatiskt.
- [x] Tempot kan ändras i procent (t.ex. 25–200 %).
- [x] Metronom och intalning kan slås av och på.
- [x] Tonen hörs vid inmatning och kan stängas av.
- [x] Uppspelningen är ett tunt skal kring alphaTab utan domänlogik, enligt ADR 0001.

## Comments

**Implementerad.** Val och noteringar att känna till:
- **alphaTabs skriptfil.** Spelaren kör synthen i en Web Worker och ljudet i en AudioWorklet, och båda startas från alphaTabs eget skript. Inne i Turbopack-bundlen hittar alphaTab inte det skriptet, och då blir spelaren aldrig redo.
  - `scripts/copy-alphatab-assets.mjs` kopierar därför `alphaTab.js` (UMD) till `public/alphatab/`, och `core.scriptFile` pekar ut den.
  - Filen måste vara samma version som alphaTab i bundlen. Båda kommer från samma `node_modules`.
  - Renderingen körs fortfarande utan workers (`useWorkers = false`).
- **Soundfont.** Soundfonten är `sonivox.sf2` från alphaTab-paketet. Den kopieras till `public/alphatab/soundfont/` av samma skript.
- **Nginx** (`deploy/nginx/guitar-practice.conf`):
  - `/alphatab/` serveras från disk (`current/public/alphatab/`) med 30 dagars cachning.
  - **Avvikelse från specen:** specen säger "lång `immutable`-cachning", men filnamnen saknar hash och därför används inte `immutable`.
  - `alphaTab.js` får `no-cache`, så att den alltid matchar bundlen.
  - **Servern måste uppdateras för hand** (se runbooken). `vps-infra/apps/guitar-practice.md` är uppdaterad men inte committad.
- **Översättaren** (testad):
  - Spåret spelas med General MIDI-program 25 (stålsträngad akustisk gitarr).
  - Varje Spår får två egna MIDI-kanaler. Trumkanalen (index 9) hoppas över.
  - `beatAt` och `noteAt` hittar slaget och tonen vid en Markör i alphaTabs modell.
- **`PlaybackControls`** är ett tunt skal:
  - Play och Pause. Play börjar vid Markören. En pausad uppspelning fortsätter där den var, så länge Markören inte har flyttats.
  - Tempo från 25 till 200 % i steg om 5.
  - Metronom och intalning har volym 1 när de är på.
  - Ljud vid inmatning är på som standard.
  - Inställningarna sparas inte.
  - Knappen är inaktiv tills soundfonten har laddats.
- **Ljud vid inmatning:**
  - Tonen spelas efter `typeDigit` när notvyn har renderat det nya Partituret.
  - Under uppspelning hörs inget, eftersom `playNote` avbryter uppspelningen.
  - Ett tvåsiffrigt band ger först tonen för den första siffran och sedan tonen för hela bandet.
- **Spelmarkören:**
  - Den är alphaTabs egen. Takten är gul, slaget har en orange linje och klingande toner är orange.
  - Vyn rullar i editorns scrollyta, med plats för den fästa uppspelningsraden (`PLAYBACK_BAR_SPACE`).
  - `.page` isolerar staplingsordningen, eftersom alphaTabs markörlager har `z-index: 1000`.
- `enableUserInteraction = false`, så ett klick i notvyn flyttar inte uppspelningen. Markören är den enda startpunkten.
- **Intalning:** alphaTab räknar troligen in vid varje start, även när en paus återupptas. Det är inte kontrollerat.
- **Verifierat i headless Chrome**, både i dev och i standalone-bygget:
  - Spelaren blir redo, och Play och Pause fungerar. Efter en paus fortsätter uppspelningen där den var.
  - Start från sista Takten fungerar.
  - Spelmarkören syns och vyn rullar.
  - Tempoetiketten följer reglaget.
  - Tonen vid inmatning har rätt tonhöjd och tystnar när valet stängs av.
  - Ljudet i sig har inte gått att lyssna på.
