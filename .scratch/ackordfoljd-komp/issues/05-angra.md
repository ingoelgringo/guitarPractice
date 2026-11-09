# 05: Ångra och gör om

**What to build:** Ctrl+Z och Ctrl+Y ångrar och gör om alla ändringar i Ackordföljden: Ackord, Tonart, tempo, taktart, Delar och Form. När taktarten byts tas Ackord på Taktslag som inte längre finns bort, och det går att ångra.

**Blocked by:** 01, 03

**Status:** ready-for-agent

- [x] Historik för Ackordföljden (tester först).
- [x] Byte av taktart tar bort Ackord på Taktslag som försvinner, och ångra återställer dem (tester).
- [x] Ctrl+Z/Ctrl+Y i editorn.
