# 02: Penta-tabellen

**What to build:** Ovanför tabellen i panelen finns två Flikar, "CAGED" och "Penta". I Penta-fliken visas Penta-tabellen med Skalans Ackord som rader och Box 1–5 som kolumner. Varje cell visar numret på den Penta-box i Ackordets penta som ligger i Boxen. Numren fördelas per rad som en rotation av 1–5, vald efter största överlapp mellan Penta-boxarnas och Boxarnas band. Förminskade Ackord har "–". En vald cell visar Penta-boxen orange i varje kopia av den blå Boxen, och toner utanför Skalan syns. Klick, hovring, piltangenter och Escape fungerar som i CAGED-fliken. Fliken skrivs i adressen som `tab=penta`.

**Blocked by:** –

**Status:** ready-for-agent

- [x] Tester genom `fretboardView`: raden för I i C-dur är 1, 2, 3, 4, 5 och raden för ii – Dm är 5, 1, 2, 3, 4. Varje rad för dur- och mollackord har varje Penta-box exakt en gång för alla Skalor. Raden för vii° har inga.
- [x] Tester genom `fretboardView`: en cell lägger Penta-boxen i Ackordets lager och Boxens övriga toner i Boxens lager, i varje kopia av Boxen. `caged` släpps i Penta-fliken.
- [x] Tester för adressen: `tab=penta` läses och skrivs. Saknas den, eller är den ogiltig, gäller CAGED.
- [ ] Flikarna går att välja med klick och tangentbord, och den valda är markerad.
