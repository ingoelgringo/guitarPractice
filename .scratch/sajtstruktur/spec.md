# Spec: Gitarrdelen under /guitar

Status: ready-for-agent

## Problem Statement

guitarPractice har blivit hela sajten på `ingemar.berghult.com`: startsidan heter "Guitar Practice" och visar både gitarrverktygen och spelet Spring i Stenhagen. Ägaren vill ha en Landningssida för alla sina projekt i ett eget repo, och gitarrdelen ska vara en av dess Avdelningar. Sajten ska också gå att läsa på svenska.

## Solution

Gitarrdelen flyttar till `ingemar.berghult.com/guitar` (se ADR 0004). Startsidan blir Gitarrsidan, med rubriken "Guitar" och korten Tab Editor, Fretboard Practice och Chord Progressions (nedtonat, "Coming soon"). Spelkortet försvinner, eftersom spelet nu listas under Various Projects på Landningssidan. Alla sidor får en header med en hemlänk till `ingemar.berghult.com`, en språkflagga och temaväxlaren. Landningssidan, `/projects` och Nginx-blocket byggs i repot `ingemar-berghult` (se `stenhagenGame/docs/PLAN-hemsida.md`).

## User Stories

1. Som besökare vill jag nå gitarrdelen på `/guitar`, så att adressen visar var på sajten jag är.
2. Som besökare vill jag se korten Tab Editor, Fretboard Practice och Chord Progressions på Gitarrsidan, så att jag ser vad som finns och vad som kommer.
3. Som besökare vill jag att Chord Progressions syns nedtonat med "Coming soon" och inte går att klicka på.
4. Som besökare vill jag komma tillbaka till Gitarrsidan från ett Verktyg med "← Guitar".
5. Som besökare vill jag komma till Landningssidan från headern på varje sida.
6. Som besökare vill jag byta mellan engelska och svenska med en flagga i headern, och att valet gäller även på Landningssidan.
7. Som förstagångsbesökare vill jag att sidan är på svenska om min webbläsare föredrar svenska, och annars på engelska.
8. Som besökare med gamla bokmärken (`/tab-editor`, `/fretboard`) vill jag hamna rätt under `/guitar`.
9. Som Ägare vill jag hitta Log in och Library i sidfoten på Gitarrsidan, och att inloggningen fungerar som förut under `/guitar`.

## Implementation Decisions

- **Termerna** Gitarrsidan, Landningssida, Avdelning, Projekt, Verktyg och Sajtspråk står i `CONTEXT.md`.
- **basePath** `/guitar` i `next.config.ts`. `<Link>`, `redirect` och `router` får prefixet automatiskt, men `fetch`, `<a href>`, formulärens `action`, `history.replaceState` och alphaTabs sökvägar gör det inte. De går via en liten hjälpfunktion som lägger till basePath.
- **Sajtspråket** sparas i cookien `lang` (`en` eller `sv`, sökväg `/`, ett år, inte httpOnly). Saknas cookien väljs språk från `Accept-Language`. Servern renderar rätt språk direkt. Flaggan visar språket man byter *till* (🇸🇪 med etiketten "På svenska", 🇬🇧 med "In English").
- **Översatt** blir bara headern, Gitarrsidan, login-sidan och Library-sidan. Verktygen förblir engelska tills vidare. Sajtspråket påverkar inte Notnamnsläget.
- **Temat** ligger kvar i `localStorage` (`theme`). Landningssidan har samma origin och läser samma nyckel.
- **Headern** är enkel och kompakt, så att den inte tar plats från editorn: `ingemar.berghult.com` till vänster, flaggan och temaväxlaren till höger. Den ersätter den flytande `ThemeToggle`.
- **Sidtitlar** blir t.ex. "Fretboard · Guitar". Gitarrsidan heter "Guitar".
- **Nginx-kopian** `deploy/nginx/guitar-practice.conf` ersätts av en notis om vilka `location`-block gitarrdelen behöver. Själva blocket flyttar till `ingemar-berghult`.

## Testing Decisions

- Vitest, test först. Testa det som har logik: språkvalet (cookie, `Accept-Language`, reservspråk), hjälpfunktionen för basePath och listan med Verktyg (Chord Progressions saknar länk).
- Inloggningens och Bibliotekets API-tester ska fortfarande gå igenom.
- Kontrollera i ett lokalt bygge med `basePath` att editorn spelar upp ljud (alphaTabs worker och soundfont) och att inloggningen fungerar.

## Out of Scope

- Landningssidan, `/projects` och Nginx-blocket (repot `ingemar-berghult`).
- Översättning av Tab Editor och Greppbrädan.
- Själva Chord Progressions-verktyget.
