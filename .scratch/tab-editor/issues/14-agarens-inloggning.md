# 14: Ägarens inloggning

**What to build:** Ägaren kan logga in med användarnamn och lösenord via en diskret länk på landningssidan, förbli inloggad mellan besök och logga ut. Det finns exakt ett konto, som definieras i miljövariabler, och ingen registrering. Upprepade felaktiga försök begränsas.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Kontot läses från `OWNER_USERNAME` och `OWNER_PASSWORD_HASH` (bcrypt). Ett litet skript eller kommando genererar en hash.
- [ ] Lyckad inloggning ger en signerad httpOnly-, secure- och SameSite-sessionscookie (`SESSION_SECRET`) med lång livslängd. Utloggning rensar den.
- [ ] Inloggningsförsök begränsas per IP i appen. `limit_req` för inloggningen dokumenteras för Nginx.
- [ ] En hjälpfunktion på serversidan avgör om anropet kommer från Ägaren och används av allt API i 15.
- [ ] Tester på API-nivå (TDD): rätt lösenord, fel lösenord, okänd användare, begränsning av försök och utloggning.
- [ ] Landningssidan visar logga in eller logga ut beroende på session. Det finns ingen registrering någonstans.
