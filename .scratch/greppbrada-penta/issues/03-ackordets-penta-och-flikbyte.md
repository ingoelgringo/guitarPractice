# 03: Ackordets penta över halsen och flikbyte

**What to build:** En radrubrik i Penta-fliken visar Ackordets penta över hela halsen i Ackordets lager, också toner utanför Skalan. Ett förminskat Ackord visar sina toner, som i CAGED-fliken. Vid byte av Flik ligger Ackord och Box kvar. Från en cell i Penta-fliken till CAGED blir valet CAGED-tabellens cell för samma Ackord och Box, och från CAGED till Penta släpps formen.

**Blocked by:** 02

**Status:** ready-for-agent

- [x] Tester genom `fretboardView`: en radrubrik i Penta-fliken lägger Ackordets penta i Ackordets lager över hela halsen, t.ex. F för iv – Dm i A mollpentatonik.
- [ ] Flikbyte behåller Ackord och Box, och CAGED-cellen väljs vid byte från en Penta-cell. Adressen följer med.
