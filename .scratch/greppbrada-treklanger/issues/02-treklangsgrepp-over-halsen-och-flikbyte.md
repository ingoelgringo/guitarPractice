# 02: Ackordets Treklangsgrepp över halsen och flikbyte

**What to build:** En radrubrik i Treklangsfliken visar alla Ackordets Treklangsgrepp på det valda Strängsetet över hela halsen i Ackordets lager, också toner utanför Skalan. Vid byte av Flik ligger Ackord, Box och Strängset kvar. Från en cell i Treklangsfliken till CAGED blir valet CAGED-tabellens cell för samma Ackord och Box. Från CAGED till Treklangsfliken släpps formen.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] Tester genom `fretboardView`: en radrubrik lägger alla Treklangsgrepp på Strängsetet i Ackordets lager över hela halsen, utan Prickar i Ackordets lager på andra strängar. Det gäller även förminskade Ackord.
- [ ] Flikbyte behåller Ackord, Box och Strängset, och CAGED-cellen väljs vid byte från en Treklangscell. Adressen följer med.
