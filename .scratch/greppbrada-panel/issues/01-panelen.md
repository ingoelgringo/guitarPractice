# 01: Panelen

**What to build:** Valen flyttas till en panel till höger om halsen från cirka 1060 px fönsterbredd, och under halsen på smalare skärm. Överst ligger Root och Scale, i mitten tills vidare de nuvarande dropdowns för Chord, Box och CAGED, och nederst Labels och Note names. Halsens SVG skalas med tillgänglig bredd ner till cirka 70 % och skrollar i sidled därunder.

**Blocked by:** –

**Status:** ready-for-agent

- [x] Panelen ligger till höger på en 1280 px bred skärm, och halsen ryms utan skrollning.
- [x] På telefonbredd ligger panelen under halsen, och halsen skrollar i sidled.
- [x] Alla val fungerar som förut och skrivs i adressen.

## Comments

**Implementerad.**
- Panelen ligger till höger från 1060 px fönsterbredd. Med 1000 px skulle halsen skrolla mellan 1000 och cirka 1045 px, eftersom den inte får krympa under 70 %.
- Panelen är 260 px bred med tre grupper avdelade med linjer: Root/Scale, Chord/Box/CAGED och Labels/Note names. Under brytpunkten radbryts valen i varje grupp.
- Halsens SVG tar tillgänglig bredd, med minsta bredd 70 % av sin naturliga storlek, och växer upp till sidans maxbredd. Sidans maxbredd höjdes från 1160 till 1440 px för att ge plats åt panelen.
- Verifierad med skärmdumpar i headless Chrome vid 600, 1280 och 1600 px.
