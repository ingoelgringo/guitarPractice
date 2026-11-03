# Gitarrdelen ligger under /guitar med basePath

Från början var guitarPractice hela sajten på `ingemar.berghult.com`, med startsidan som kortlista över allt. Nu har sajten en Landningssida i ett eget repo, och varje Avdelning och varje Projekt ligger i en undermapp på samma domän. Gitarrdelen ligger under `ingemar.berghult.com/guitar` och byggs med Next `basePath: "/guitar"`. Vi valde det för att allt ska ligga under ett domännamn, och för att framtida Projekt ska följa samma regel: en undermapp, oavsett om det är statiska filer eller en app med server.

## Considered Options

- **Subdomän** (`guitar.ingemar.berghult.com`). Det kräver ingen kodändring, och den tidigare planen (`stenhagenGame/docs/PLAN-hemsida.md`) valde det, men då hamnar sajten på flera domäner och varje ny app kräver DNS och certifikat.
- **Låta guitarPractice vara hela sajten**, med Landningssidan som en route i Next-appen. Det blandar ihop gitarrverktygen med en sajt som ska länka till helt andra repon.

## Consequences

- Allt som inte går via `<Link>` måste ha prefixet: `fetch` mot `/api`, formulärens `action`, alphaTabs sökvägar och Nginx-reglerna för `/_next/static/` och `/alphatab/`.
- Inloggningscookien gäller bara under `/guitar`.
- De gamla adresserna (`/tab-editor`, `/fretboard`, `/library`, `/login`) skickas vidare med 301 till `/guitar/...`, så att bokmärken fortsätter att fungera.
- Landningssidan och gitarrdelen har samma origin och delar därför valen: Sajtspråket i en cookie med sökvägen `/` (så att servern kan rendera rätt språk direkt) och temat i `localStorage`.
- Nginx-blocket för domänen ägs av Landningssidans repo, inte av guitarPractice.
