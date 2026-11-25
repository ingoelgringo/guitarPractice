# 03: Stämmarsidan

**What to build:** `/guitar/tuner` med ett kort på Gitarrsidan. En Starta-knapp startar mikrofonen, och mikrofonen stängs av när fliken döljs. Nekad åtkomst ger en förklaring. Man väljer Stränginstrument och stämning. Strängarna visas som stora knappar från grövst till ljusast. Ett Strängpar med samma ton är en knapp och ett med oktavsträng två knappar i en grupp. Ett tryck låser en sträng och ett nytt tryck släpper den. Visaren går från −50 till +50 cent, med tonnamn, cent och Hz, och kan växlas mellan stapel (förval) och halvcirkelformad nål. Den blir grön inom ±3 cent, och strängen får en bock som sitter kvar tills man byter stämning. A4 ställs in mellan 430 och 450 Hz. Inställningarna sparas i `localStorage`. Texterna finns på engelska och svenska, och tonnamnen följer Notnamnsläget. Layouten är byggd för mobilen först.

**Blocked by:** 01, 02

**Status:** done

- [x] Lagringen av inställningarna med `schemaVersion` och tålighet mot ogiltig data (tester först).
- [x] Mikrofonen via `getUserMedia` utan ekosläckning, brusreducering och automatisk förstärkning, med analys i en `requestAnimationFrame`-loop.
- [x] Val av Stränginstrument och stämning, strängknappar och låsning.
- [x] Stapel och halvcirkelformad nål, grönt läge och bockar.
- [x] A4-inställning.
- [x] Kortet på Gitarrsidan och texterna på båda språken.
- [ ] Prövat på mobil och dator, i ljust och mörkt tema. (Prövat i Chromium med mobil- och datorbredd och en oscillator i stället för mikrofonen. Kvar: en riktig mikrofon och gitarr, och en riktig mobil.)

## Comments

**2026-11-25:** Byggt.
- **Logik (TDD):** `lib/tunerSettings.ts` sparar inställningarna under `guitarPractice.tuner.settings` med `schemaVersion` 1. Ett okänt Stränginstrument ger förvalet för både instrument och stämning, en okänd stämning ger instrumentets första, och A4 begränsas till 430–450 Hz. I `lib/tuner.ts` finns `tunerStrings` (platta mål för `tunerStep`, med två per Strängpar med oktavsträng) och `tunerNoteName` (sajtens stavning D♭ E♭ F♯ A♭ B♭, och H/B i svenskt läge).
- **Komponenter:**
  - `components/Tuner.tsx`, `components/Tuner.module.css` och `app/tuner/page.tsx`.
  - `components/useMicrophonePitch.ts`. En generationsräknare avbryter en start som fortfarande väntar på mikrofonen. Mikrofonen stängs av vid `visibilitychange` och unmount.
  - `components/useTunerSettings.ts` (`useSyncExternalStore`, som `useNoteNameMode`).
- **Sajten:** Kortet ligger i `lib/tools.ts` och stämgaffelikonen i `components/SiteNav.tsx`.
- **Prövat i Chromium med en sågtandsoscillator i stället för mikrofonen:**
  - Närmaste sträng och bock efter stämd sträng.
  - Kromatisk F♯2 och låst sträng (+500 cent).
  - 12-strängad gitarr med oktavsträngarna i par.
  - Låg B på bas 5 (31,0 Hz, +6 cent).
  - Inställningarna sparas mellan omladdningar.
  - Svenska texter, H-notnamn, mörkt tema och nålen.
  - Inga konsolfel.
- **Mobil (390 px):** 6 och 7 strängar får plats på en rad, och 12-strängad radbryts i två.
- **Notnamnsläget** väljs i sidans rubrikrad, som i Ackordföljder.
