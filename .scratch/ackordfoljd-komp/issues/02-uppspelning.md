# 02: Uppspelning med Tone.js

**What to build:** Play och Stop spelar Ackordföljden i loop med trummor, bas, elpiano och synthpad, med en takts inräkning som kan stängas av. Instrumenten bockas i och ur under uppspelning utan att musiken startar om. Det Ackord som klingar markeras på sitt Taktslag. Tone.js laddas först vid Play. Se ADR 0005.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Uppspelningsplanen som ren funktion: Ackord klingar till nästa, bara trummor före det första, fast mönster per taktart, tempo i punkterade fjärdedelar i 6/8 och 12/8 (tester först).
- [ ] Stämföring för elpiano och pad nära föregående ackord, och basen på Basen (tester).
- [ ] Samplingar för trummor och elpiano under `public/` med licens (t.ex. CC0) dokumenterad bredvid filerna. Syntes för bas och pad.
- [ ] Play/Stop, inräkning och Instrument att bocka i och ur.
- [ ] Det klingande Ackordet markeras på sitt Taktslag.
