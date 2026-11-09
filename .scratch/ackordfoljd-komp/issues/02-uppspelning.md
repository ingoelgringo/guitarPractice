# 02: Uppspelning med Tone.js

**What to build:** Play och Stop spelar Ackordföljden i loop med trummor, bas, elpiano och synthpad, med en takts inräkning som kan stängas av. Instrumenten bockas i och ur under uppspelning utan att musiken startar om. Det Ackord som klingar markeras på sitt Taktslag. Tone.js laddas först vid Play. Se ADR 0005.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] Uppspelningsplanen som ren funktion: Ackord klingar till nästa, bara trummor före det första, fast mönster per taktart, tempo i punkterade fjärdedelar i 6/8 och 12/8 (tester först).
- [x] Stämföring för elpiano och pad nära föregående ackord, och basen på Basen (tester).
- [x] Samplingar för trummor och elpiano under `public/` med licens (t.ex. CC0) dokumenterad bredvid filerna. Syntes för bas och pad.
- [x] Play/Stop, inräkning och Instrument att bocka i och ur.
- [x] Det klingande Ackordet markeras på sitt Taktslag.

## Comments

**2026-11-09:** Byggt. Uppspelningsplanen är `lib/progressionPlayback.ts` (`playbackPlan`, `pulseSeconds`, `countIn`): Formen rullas ut, ett Ackord klingar till nästa och det sista till loopens slut, bara trummor före det första, fasta mönster per taktart, och elpiano och pad i tät stämföring nära föregående ackord mellan E3 och G5 (det första nära C-dur kring mittenC). Basen spelar Basen mellan E1 och D♯2. Ljudlagret är `components/progressionAudio.ts` och laddas med `import()` vid första Play; ett Taktslag är en fjärdedel i Tone.js transport, så tempot ändras utan att planen räknas om. Instrument stängs av med `Channel.mute`. Ändringar under uppspelning schemaläggs om utan att positionen nollställs. Samplingarna kommer ur VCSL (CC0) och skapas med `scripts/prepare-progression-samples.mjs`; licensen står i `public/sounds/progression/LICENSE.md`. Trumman är en konsertbastrumma kortad till 0,6 s och elpianot ett FM-elpiano (TX81Z), eftersom VCSL saknar trumset och Rhodes. Tilläggen spelas inte ännu (ticket 04). Kvar: att lyssna och kontrollera markeringen i webbläsaren.
