# 08: Utkast i webbläsaren

**What to build:** En Gäst förlorar aldrig arbete av misstag. Det aktuella Partituret sparas automatiskt som ett Utkast i webbläsaren och återställs nästa gång editorn öppnas. Det framgår tydligt att Utkastet bara finns i den här webbläsaren. Om man försöker lämna sidan med ändringar som inte är nedladdade varnar webbläsaren. "Nytt Partitur" frågar först om man vill ladda ner det nuvarande.

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] Utkastet sparas (i `.itab`-formatet) efter ändringar och återställs när editorn startar.
- [ ] En diskret upplysning säger att Utkastet bara finns i den här webbläsaren och att man bör ladda ner en Partiturfil.
- [ ] En varning vid `beforeunload` visas när det finns ändringar som inte är nedladdade.
- [ ] "Nytt Partitur" frågar om nedladdning innan Utkastet ersätts.
- [ ] Läsning och skrivning tål att lagringen saknas eller kastar fel (privat läge), och editorn fungerar ändå.
- [ ] Ett Utkast med en äldre `schemaVersion` migreras vid återställning.
- [ ] Utkastet kan bära Biblioteks-id och senast kända revision (används i 16).
