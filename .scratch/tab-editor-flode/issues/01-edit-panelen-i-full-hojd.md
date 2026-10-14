# 01: Edit-panelen i full höjd

**What to build:** Edit-panelen blir en sidopanel mot högerkanten, från överkant till nederkant, utan marginal och rundade hörn. Sidan centreras i ytan till vänster om panelen och krymper när ytan är smalare än A4, utan att man skrollar i sidled. När panelen är ihopfälld centreras Sidan i hela fönstret. Kortkommandot står inte bredvid en knapp när det är samma tecken som på knappen (idag pilarna), men det finns kvar i tooltipen.

**Blocked by:** –

**Status:** ready-for-agent

- [ ] Test: i `SHORTCUT_GROUPS` saknar en genväg `keys` när `keys` skulle vara samma som `label` (pilarna), och övriga genvägar har kvar sina.
- [ ] `.help` är fäst mot högerkanten i full höjd. Partiturinställningarna är oförändrade.
- [ ] Sidan döljs aldrig av den öppna panelen och centreras i ytan bredvid den. Den krymper i stället för att skrolla i sidled.
- [ ] Sidan centreras i hela fönstret när panelen är ihopfälld.
- [ ] Verifierat manuellt i appen, i brett och smalt fönster och i ljust och mörkt tema.
