# 01: Tonhöjdsdetektering och stämmarlogik

**What to build:** Rena funktioner utan UI. `lib/pitch.ts` hittar grundtonens frekvens i ett ljudfönster (McLeod eller YIN) och returnerar frekvens och klarhet, eller `null` vid tystnad och brus. `lib/tuner.ts` räknar om frekvens till närmaste ton och cent givet A4 (430–450 Hz), väljer närmaste sträng i en stämning med hysteres, avgör om tonen är långt från alla strängar (kromatisk visning) och håller reda på "stämd": ±3 cent stabilt i ungefär 0,5 s.

**Blocked by:** –

**Status:** done

- [x] Detektering inom ±1 cent för sinus och sågtand från cirka 30 Hz (låg B på bas 5) till cirka 1 400 Hz (tester först).
- [x] Rätt grundton när övertonerna är starkare än grundtonen, utan oktavfel (tester).
- [x] `null` vid tystnad och vitt brus (tester).
- [x] Frekvens till ton och cent med valfri A4 (tester).
- [x] Närmaste sträng med hysteres, och gränsen för kromatisk visning (tester).
- [x] Logiken för "stämd" med tidsstämplar (tester).

## Comments

**2026-11-25:** Byggt med TDD.
- `lib/pitch.ts`: `detectPitch(samples, sampleRate)` med McLeod (NSDF via FFT-autokorrelation och kumulativa kvadratsummor) och parabelinterpolation. Tonen söks mellan 28 och 1 500 Hz. Under klarheten 0,8 eller RMS 0,001 (cirka −60 dBFS) blir svaret `null`. Med ett fönster på 8 192 sampel vid 48 kHz tar ett anrop cirka 2,4 ms i Node (den första versionen tog 59 ms). Fönstret bör vara så stort i ticket 03 för att låg B ska fungera.
- `lib/tuner.ts`:
  - `frequencyToNote(frequency, a4)`.
  - `tunerStep(state, { frequency, timeMs }, { strings, a4, lockedString })` och `initialTunerState()`. Strängarna numreras från 1.
  - Kromatisk visning när tonen ligger mer än 100 cent från alla strängar. En visad sträng släpps först vid 120 cent, och strängbyte kräver att en annan sträng ligger 20 cent närmare.
  - Bock efter ±3 cent i 500 ms. Timern nollställs av tystnad och av att tonen lämnar toleransen.
  - Den senaste visningen står kvar när tonen tystnar. Vid byte av Stämning skapar UI:t ett nytt `initialTunerState()`.
  - För Strängpar med samma ton skickar UI:t en målton per knapp i `strings`.
