# 03: Kortare Notvärde delar Slaget, och notisen

**What to build:** Ett kortare Notvärde (W/H/Q/E/S/T, punktering av, triol på) bevarar tiden. Slaget behåller toner, tekniker och texter med det nya Notvärdet, och resten av den gamla längden fylls med pauser enligt Pausregeln: det största Notvärdet som ryms och som börjar på en jämn multipel av sitt värde, och triolpauser för tid som vanliga Notvärden inte räcker till. Här införs också notisen vid Markören, som visar skälet när ett kommando inte går.

**Blocked by:** –

**Status:** ready-for-agent

- [ ] Pausregeln som en ren funktion, med tester: fjärdedel till sextondel ger sextondel, sextondelspaus och åttondelspaus. Punkterad fjärdedel till åttondel ger åttondel och två åttondelspauser. Halvnot till sextondel ger sextondel, sextondelspaus, åttondelspaus och fjärdedelspaus.
- [ ] `setDuration`, `toggleDot` och `toggleTriplet` delar Slaget när längden minskar. Test genom `apply`, även för en paus och för ett Slag med Ackordnamn.
- [ ] När längden ökar beter sig kommandona som idag tills ticket 06 är klar.
- [ ] `EditorState` kan bära ett meddelande om varför ett kommando inte gick. Ett sådant kommando lämnar Partituret orört och skapar ingen ångra-punkt.
- [ ] Notisen vid Markören (`role="status"`, tar inte fokus) försvinner efter cirka 4 sekunder eller vid nästa tangenttryck.
