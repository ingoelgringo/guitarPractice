# 03: Kopplingen mellan Tonnetz och Kvintcirkel

**What to build:** Markeringen delas mellan rutorna. Ett hovrat eller låst Ackord i Kvintcirkeln lyser grönt på alla synliga kopior av sin triangel i Tonnetzen, med triangelns tre hörn markerade. En triangel som hovras eller klickas i Tonnetzen markerar samma Ackord i Kvintcirkeln och på Tonnetzens övriga kopior. En dragning låser ingenting. Den låsta markeringen ligger kvar medan man drar, och nya kopior som dras in i rutan lyser också.

**Blocked by:** 02

**Status:** ready-for-agent

- [x] Tester: alla synliga kopior av ett Ackord hittas, och dess hörn.
- [x] Gemensamt tillstånd för låst och hovrat Ackord på sidan.
- [x] Hovring och klick på trianglar. Klick utanför trianglar och segment släpper låsningen.
- [ ] Manuell kontroll i appen: båda riktningarna, pekskärm (tryck låser, dragning låser inte) och båda temana.

## Comments

**2026-11-03:** Byggt. `chordCopies` och `chordVertices` i `lib/chordProgressions.ts` hittar kopiorna och hörnen. Tonnetzen hanterar klicket på rutan och låser triangeln som trycktes ner, så att ett klick som glider lite över en kant inte släpper låsningen. Hörnen släpper igenom pekaren till triangeln under. Attributet `data-chord` ligger nu i `components/chordElement.ts`. Den manuella kontrollen i appen återstår.
