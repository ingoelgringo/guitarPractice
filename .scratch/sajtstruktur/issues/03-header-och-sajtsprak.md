# 03: Header och Sajtspråk

**What to build:** En kompakt header på alla sidor: länken `ingemar.berghult.com` till vänster (till `/`, utanför basePath, alltså en vanlig `<a>`), och flaggan och temaväxlaren till höger. Den ersätter den flytande `ThemeToggle`. Flaggan växlar Sajtspråket mellan engelska och svenska. Valet sparas i cookien `lang` (`en`/`sv`, sökväg `/`, ett år). Saknas cookien väljs språket från `Accept-Language`. Flaggan visar språket man byter till: 🇸🇪 "På svenska" eller 🇬🇧 "In English". Headern, Gitarrsidan, login-sidan och Library-sidan översätts. Verktygen förblir engelska, och Notnamnsläget påverkas inte.

**Blocked by:** 02

**Status:** done

- [x] Tester för språkvalet: giltig cookie, ogiltig cookie, `Accept-Language` med `sv` först, med `sv` längre bak och utan svenska.
- [x] Test: varje text finns på båda språken.
- [x] Servern renderar rätt språk direkt, utan att engelska blinkar fram först (curl mot dev-servern med cookie och `Accept-Language`).
- [ ] Headern tar inte plats från editorns verktygsrad på en smal skärm. Headern är en rad på `--header-height` (32px), och editorn och sidopanelen räknar bort den, men det är inte prövat i en webbläsare. Det gäller också flaggans klick (`router.refresh()`).
- [x] `<html lang>` följer Sajtspråket. Verktygens innehåll har `lang="en"`.
