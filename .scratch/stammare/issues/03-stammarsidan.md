# 03: Stämmarsidan

**What to build:** `/guitar/tuner` med ett kort på Gitarrsidan. En Starta-knapp startar mikrofonen, och mikrofonen stängs av när fliken döljs. Nekad åtkomst ger en förklaring. Man väljer Stränginstrument och stämning. Strängarna visas som stora knappar från grövst till ljusast. Ett Strängpar med samma ton är en knapp och ett med oktavsträng två knappar i en grupp. Ett tryck låser en sträng och ett nytt tryck släpper den. Visaren går från −50 till +50 cent, med tonnamn, cent och Hz, och kan växlas mellan stapel (förval) och halvcirkelformad nål. Den blir grön inom ±3 cent, och strängen får en bock som sitter kvar tills man byter stämning. A4 ställs in mellan 430 och 450 Hz. Inställningarna sparas i `localStorage`. Texterna finns på engelska och svenska, och tonnamnen följer Notnamnsläget. Layouten är byggd för mobilen först.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [ ] Lagringen av inställningarna med `schemaVersion` och tålighet mot ogiltig data (tester först).
- [ ] Mikrofonen via `getUserMedia` utan ekosläckning, brusreducering och automatisk förstärkning, med analys i en `requestAnimationFrame`-loop.
- [ ] Val av Stränginstrument och stämning, strängknappar och låsning.
- [ ] Stapel och halvcirkelformad nål, grönt läge och bockar.
- [ ] A4-inställning.
- [ ] Kortet på Gitarrsidan och texterna på båda språken.
- [ ] Prövat på mobil och dator, i ljust och mörkt tema.

## Comments
