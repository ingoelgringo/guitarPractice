# 01: Sidan och Kvintcirkeln

**What to build:** Kortet *Chord Progressions* leder till `/guitar/chord-progressions`. Där finns en Kvintcirkel med de 12 durackorden ytterst (C överst, medurs i kvintordning) och de parallella mollackorden innanför. Hovring markerar ett Ackord grönt, och klick eller tryck låser det. Klick på det låsta Ackordet eller utanför släpper det. Tangentbordet fungerar: vänster och höger går i kvintordning, upp och ner byter mellan dur och moll, Enter låser och Esc släpper. En dropdown väljer Notnamnsläge. Läget delas med Greppbrädan, har engelskt som förval och sparas i webbläsaren.

**Blocked by:** –

**Status:** ready-for-agent

- [x] Den rena modulen (t.ex. `lib/chordProgressions.ts`) med tester: Kvintcirkelns 24 platser, ackordnamn i båda Notnamnslägena (enligt specens stavning) och nivåerna låst/hovrat.
- [x] Notnamnsläget: en gemensam nyckel i webbläsaren, `DEFAULT_NOTE_NAME_MODE = "english"` och fallback till Greppbrädans gamla nyckel, med tester. Greppbrädan använder samma lagring.
- [x] `href` på kortet i `lib/tools.ts`, med uppdaterat test.
- [x] Sidan med Kvintcirkeln som SVG, den gröna färgtoken (ljust och mörkt tema), dropdownen och texter på båda Sajtspråken.
- [x] Tangentbordet i Kvintcirkeln.

## Comments

**2026-11-03:** Byggt. Modulen är `lib/chordProgressions.ts` och Notnamnsläget ligger i `lib/noteNameMode.ts` (nyckeln `guitarPractice.noteNames`, med `guitarPractice.fretboard.noteNames` som fallback). Kvintcirkeln är `components/CircleOfFifths.tsx` och den gemensamma hooken `components/useNoteNameMode.ts`. Fem Greppbrädetester som förutsatte svenskt förval anger nu svenskt läge uttryckligen. Kvar: hovring, klick/tryck, tangentbord och teman i webbläsaren.
