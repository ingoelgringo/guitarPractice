# Omdesign av Ackordföljder-sidan

Status: ready-for-agent

Ren omdesign av UI:t på `/chord-progressions` efter mockupen `.scratch/ackordfoljder-omdesign/mockup.png`. **Ingen funktionalitet läggs till eller tas bort.** Mockupen är en riktning, inte en exakt förlaga.

## Beslut

- Texterna går via `MESSAGES` (sv/en). Mockupens engelska etiketter är bara exempel.
- CSS Modules och CSS-variabler, inga nya beroenden. Systemets typsnitt och egna inline-SVG-ikoner.
- Mockupens stil är det mörka temat, och det ljusa temat får samma layout med ljus palett. Variablerna finns i `app/globals.css`: `--surface*`, `--border`, `--muted`, `--accent`, `--accent-soft`, `--glow`, `--radius*`.
- Glöd används bara på det som är markerat, aktivt, klingande och på Play.
- Mockupens element som vore ny funktionalitet tas inte med:
  - Infopanelen vid Kvintcirkeln.
  - Visualiseringen.
  - Volymreglaget.
  - View mode.
  - Sökfältet och förhandsvisningen i Biblioteket.
  - Play-knappar per rad.
  - Bläddringspilarna.
  - "+ Add chord".
  - Settings och "?".
- Hjälptexterna står kvar synliga i liten dämpad text (klassen `card.help`).
- Layouten har tre rader: Tonnetz och Kvintcirkel överst, Ackordföljden i full bredd i mitten, och Ackordeditorn och Biblioteket underst. Under cirka 1100 px staplas allt i en kolumn.
- Verifiering: ny logik testas först med Vitest i `lib/`. Markup och CSS kontrolleras med skärmdumpar i mörkt och ljust tema, i bredderna 1400, 900 och 500 px. `npm test`, `npm run typecheck` och `npm run lint` ska passera.
- Arbetet görs i steg med en commit per steg, och användaren bedömer varje steg innan nästa.

## Steg

1. **Klart (cb4e086)**: Färgvariabler och menyn till vänster (`components/SiteNav.tsx`, `lib/siteNav.ts`) i layouten.
2. **Klart (0a9a91a)**: Sidhuvudet och korten för Tonnetz och Kvintcirkel. Det delade kortformatet ligger i `components/Card.module.css` och `components/CardIcon.tsx`, med ikonerna `editor` och `library` redan förberedda.
3. **Klart (9616432)**: Kortet för Ackordföljden.
   - Tonart, taktart, tempo och Tap står i rubrikraden.
   - Transportraden har Play, Loop och Inräkning, och instrumenten som växelknappar.
   - Varje Takt är ett kort med Taktslagen som mindre kort.
4. **Kvar**: Ackordeditorn och Biblioteket.
   - **Ackordeditorn** blir ett eget kort med ikonen `editor`, nedre raden till vänster. Den syns alltid.
     - Den innehåller det som i dag ligger i `ChordChoices` i `components/ProgressionEditor.tsx`: tonartens ackord och "Ta bort ackord" överst, sedan `ChordBuilder` och vid behov `ChordTextField`.
     - Kortet är inaktiverat med en hint ("Markera ett Taktslag") när inget Taktslag är markerat.
     - Kortet måste ligga inom `EDITOR_ATTRIBUTE` (se `components/ChordProgressions.tsx`), så att ett klick i det inte släpper markeringen.
     - Tangentbordsflödet ska fungera som i dag: en bokstav öppnar ackordfältet, och Esc stänger och lämnar fokus på Taktslaget.
   - **Biblioteket** (`components/ProgressionLibrary.tsx`, bara för Ägaren) blir ett kort med ikonen `library`, nedre raden till höger.
     - Tabellen blir en lista. Varje rad visar namn och "Ändrad <datum>", och ett klick öppnar Ackordföljden.
     - Byt namn, Duplicera och Ta bort blir ikonknappar på raden.
     - Spara, Ny, status, konflikt och fel ligger i kortets rubrik och topp.
     - Taktart och tempo visas inte, eftersom de inte finns i `ProgressionListEntry` och inte ska läggas till.
   - För en Gäst, som inte har något Bibliotek, tar ackordeditorn hela den nedre raden.
