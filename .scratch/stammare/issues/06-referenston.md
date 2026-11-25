# 06: Referenston

**What to build:** En knapp spelar upp den valda strängens ton (med A4-inställningen) med Tone.js, så att man kan stämma på gehör. Mikrofonanalysen pausas medan tonen spelar, så att Stämmaren inte lyssnar på sig själv. Den ska fungera offline.

**Blocked by:** 03

**Status:** ready-for-human

Senare del. Ta upp den när 01–05 är klara.

- [x] Frekvens för referenstonen givet sträng och A4 (tester först).
- [x] Uppspelning med Tone.js och paus av analysen.
- [ ] Prövat offline. (Prövat i Chromium utan nät, se kommentaren. Kvar: en riktig mobil, och att lyssna på hur tonen låter.)

## Comments

**2026-11-25:** Byggt.
- **Vilken ton som spelas:** knappen *Spela E2* under strängknapparna spelar den låsta strängen. Är ingen sträng låst spelar den strängen som visas. Annars är knappen avstängd och heter *Spela ton*. Logiken ligger i `referenceString` och `referenceFrequency` i `lib/tuner.ts`, med tester. Frekvensen är exakt den som Stämmaren visar som ±0 cent med samma A4.
- **Ljudet:** `components/referenceTone.ts` laddar Tone.js först vid första tryckningen och spelar en `Tone.Synth` med grundton och fyra övertoner i 2,5 s, så att även de grövsta strängarna hörs i en mobilhögtalare. Under tiden heter knappen *Stoppa tonen*. AudioContexten skapas i klicket, för Safari på iOS (`components/useReferenceTone.ts`).
- **Pausen:** `useMicrophonePitch` har fått `pauseFor(ms)`. Medan tonen klingar och 300 ms efter att den har klingat ut analyseras inget, och visaren visar ingen ton. Det motsvarar analysfönstret med marginal.
- **Offline:** Tone.js är en egen Next-fil som annars bara hämtas när man trycker. `useTunerServiceWorker` laddar den därför i förväg innan den skickar listan med filer till service workern. Workern i `public/sw.js` behövde inte ändras.
- **Prövat i Chromium med ett produktionsbygge,** med en sinus på 110 Hz som mikrofon:
  - Tone.js-filen ligger i `tuner-static-v1`.
  - Stämmaren visar 110 Hz. Medan tonen spelar visar den – Hz, och efteråt 110 Hz igen.
  - Det som spelas har sin topp vid 82 Hz (E2).
  - Knappen går tillbaka till *Spela E2* när tonen är slut, och *Stoppa tonen* stoppar den.
  - Utan nät, efter omladdning, spelar tonen utan fel.
- **Efter granskningen:**
  - Trycker man på *Stoppa tonen* eller lämnar sidan medan Tone.js laddas, spelas tonen inte.
  - Knappen heter *Stoppa tonen* redan medan Tone.js laddas.
  - Tone.js skapar en egen AudioContext när modulen laddas. Den stängs när referenstonen tar över (`setContext(context, true)`).
  - Referenstonen har lagts till under Stämmare i `CONTEXT.md`.
- **Att pröva på en riktig mobil:** på iOS tystar ljudlös-omkopplaren Web Audio. Medan mikrofonen är på skickar iOS dessutom ofta ljudet till luren i stället för högtalaren, så tonen kan bli svag just när Stämmaren lyssnar.

