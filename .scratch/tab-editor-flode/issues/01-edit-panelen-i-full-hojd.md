# 01: Edit-panelen i full höjd

**What to build:** Edit-panelen blir en sidopanel mot högerkanten, från överkant till nederkant, utan marginal och rundade hörn. Sidan centreras i ytan till vänster om panelen och krymper när ytan är smalare än A4, utan att man skrollar i sidled. När panelen är ihopfälld centreras Sidan i hela fönstret. Kortkommandot står inte bredvid en knapp när det är samma tecken som på knappen (idag pilarna), men det finns kvar i tooltipen.

**Blocked by:** –

**Status:** done

- [x] Test: i `SHORTCUT_GROUPS` saknar en genväg `keys` när `keys` skulle vara samma som `label` (pilarna), och övriga genvägar har kvar sina.
- [x] `.help` är fäst mot högerkanten i full höjd. Partiturinställningarna är oförändrade.
- [x] Sidan döljs aldrig av den öppna panelen och centreras i ytan bredvid den. Den krymper i stället för att skrolla i sidled.
- [x] Sidan centreras i hela fönstret när panelen är ihopfälld.
- [x] Verifierat manuellt i appen, i brett och smalt fönster och i ljust och mörkt tema.

## Comments

**Implementerad.** Den öppna panelen ger editorns scrollyta en högermarginal med panelens bredd (`.editor:has(> .help[open])`), så Sidan centreras och krymper bredvid den och alphaTab bryter om raderna. Pilarna har inget kortkommando bredvid sig, men tooltipen visar alltid kortkommandot. Verifierat i appen i 1600 och 1000 px bredd, med panelen öppen och ihopfälld.

**Tillägg (Ägarens önskemål):** Score settings ligger nu i samma sidopanel, med flikarna *Edit* och *Score settings* överst (`EditorPanel`). Knappen » fäller ihop panelen till bara flikarna, och en flik öppnar den igen. Båda flikarna står kvar i DOM:en och den inaktiva döljs, så att ett textfält som inte är klart inte försvinner vid flikbyte. Flikknapparna tar inte fokus, så tangentbordet styr fortfarande editorn.
