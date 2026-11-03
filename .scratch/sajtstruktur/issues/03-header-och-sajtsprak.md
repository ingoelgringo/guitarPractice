# 03: Header och Sajtspråk

**What to build:** En kompakt header på alla sidor: länken `ingemar.berghult.com` till vänster (till `/`, utanför basePath, alltså en vanlig `<a>`), och flaggan och temaväxlaren till höger. Den ersätter den flytande `ThemeToggle`. Flaggan växlar Sajtspråket mellan engelska och svenska. Valet sparas i cookien `lang` (`en`/`sv`, sökväg `/`, ett år). Saknas cookien väljs språket från `Accept-Language`. Flaggan visar språket man byter till: 🇸🇪 "På svenska" eller 🇬🇧 "In English". Headern, Gitarrsidan, login-sidan och Library-sidan översätts. Verktygen förblir engelska, och Notnamnsläget påverkas inte.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Tester för språkvalet: giltig cookie, ogiltig cookie, `Accept-Language` med `sv` först, med `sv` längre bak och utan svenska.
- [ ] Test: varje text finns på båda språken.
- [ ] Servern renderar rätt språk direkt, utan att engelska blinkar fram först.
- [ ] Headern tar inte plats från editorns verktygsrad på en smal skärm.
- [ ] `<html lang>` följer Sajtspråket.
