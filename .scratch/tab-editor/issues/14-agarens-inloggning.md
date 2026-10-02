# 14: Ägarens inloggning

**What to build:** Ägaren kan logga in med användarnamn och lösenord via en diskret länk på landningssidan, förbli inloggad mellan besök och logga ut. Det finns exakt ett konto, som definieras i miljövariabler, och ingen registrering. Upprepade felaktiga försök begränsas.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] Kontot läses från `OWNER_USERNAME` och `OWNER_PASSWORD_HASH` (bcrypt). Ett litet skript eller kommando genererar en hash.
- [x] Lyckad inloggning ger en signerad httpOnly-, secure- och SameSite-sessionscookie (`SESSION_SECRET`) med lång livslängd. Utloggning rensar den.
- [x] Inloggningsförsök begränsas per IP i appen. `limit_req` för inloggningen dokumenteras för Nginx.
- [x] En hjälpfunktion på serversidan avgör om anropet kommer från Ägaren och används av allt API i 15.
- [x] Tester på API-nivå (TDD): rätt lösenord, fel lösenord, okänd användare, begränsning av försök och utloggning.
- [x] Landningssidan visar logga in eller logga ut beroende på session. Det finns ingen registrering någonstans.

## Comments

**Implementerad.** Val och noteringar att känna till:
- **API:** `POST /api/login` tar `{ username, password }` som JSON och svarar 200 med cookie, 400 vid ogiltig body, 401 vid fel uppgifter, 429 med `Retry-After` vid spärr och 500 om `SESSION_SECRET` saknas. `POST /api/logout` rensar cookien och svarar 303 till `/`, så att ett vanligt formulär räcker.
- **Session** (`lib/auth.ts`): cookien `session` är `<utgångstid>.<HMAC-SHA256>` signerad med `SESSION_SECRET`, `HttpOnly`, `Secure`, `SameSite=Lax`, 180 dagar. Den lagras inte på servern.
  - Utloggning rensar cookien i webbläsaren, men en kopierad cookie gäller till den löper ut. Bara ett byte av `SESSION_SECRET` ogiltigförklarar alla sessioner, inte ett nytt lösenord.
  - `SameSite=Lax` gör att skrivande anrop från andra sajter inte får med cookien (skydd mot CSRF för API:t i 15).
- **Hjälpfunktion för 15:** `isOwner(request)` för route handlers, `isOwnerInPage()` för sidor (läser `cookies()`).
- **Lösenordet:** bcrypt via `bcryptjs` (ren JS, inget native-bygge i CI). Fel användarnamn jämförs mot en dummyhash så att svarstiden inte avslöjar användarnamnet. `npm run hash-password` läser lösenordet dolt från terminalen eller från stdin.
- **Begränsning** (`lib/loginAttempts.ts`): fem fel per IP, sedan spärr i en kvart från det femte felet. Försöket räknas innan lösenordet kontrolleras, så samtidiga anrop kommer inte förbi. Ett lyckat försök nollställer. IP:n tas från `X-Real-IP` som Nginx sätter. Räkningen ligger i minnet och nollställs vid omstart.
- **Nginx:** `limit_req_zone guitarpractice_login` (10/min, burst 5) på `location = /api/login` i `deploy/nginx/guitar-practice.conf`. Det är dokumenterat i `vps-infra/apps/guitar-practice.md` tillsammans med en checklista för uppsättningen.
- **Hemligheter i produktion:** `/home/deploy/guitar-practice/.env` utanför releaserna, läses av `deploy/ecosystem.config.cjs` med `util.parseEnv`. Mall: `.env.production.example`.
  - **Ägaren behöver själv** skapa filen och uppdatera Nginx-vhosten på servern innan inloggningen fungerar live (checklistan i vps-infra).
- **UI:** landningssidan läser sessionen och visar en diskret "Log in"-länk till `/login` eller en "Log out"-knapp. Sidan renderas därför dynamiskt. `/login` skickar en redan inloggad Ägare till `/`. Ingen registrering finns.
- **Verifierat** mot `next dev` med curl: fel lösenord ger 401, rätt ger cookien, landningssidan växlar mellan Log in och Log out, och utloggningen rensar cookien. Själva formuläret i webbläsaren är inte provat manuellt.
