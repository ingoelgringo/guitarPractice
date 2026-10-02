# 17: Bibliotek: duplicera, ta bort och ladda ner

**What to build:** Från Biblioteket kan Ägaren duplicera ett Partitur, ta bort ett (efter bekräftelse) och ladda ner vilket som helst som `.itab`. En nedladdad och återöppnad fil blir alltid ett nytt Partitur och skriver aldrig över originalet.

**Blocked by:** 15

**Status:** ready-for-agent

- [ ] Det finns API för att duplicera och ta bort, med tester mot riktig Postgres (TDD), inklusive 401 utan session.
- [ ] Biblioteksvyn har åtgärderna duplicera, ta bort (med bekräftelse) och ladda ner.
- [ ] En nedladdad `.itab` innehåller ingen databasidentitet (testat).
- [ ] En återöppnad fil hamnar utanför Biblioteket tills "Lägg i biblioteket" väljs.
