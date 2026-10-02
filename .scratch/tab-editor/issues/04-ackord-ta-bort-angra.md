# 04: Ackord, ta bort och ångra/gör om

**What to build:** Användaren kan lägga flera toner på samma slag på olika strängar för att skriva ackord. Man kan ta bort en enskild ton eller ett helt slag, och ångra och göra om alla ändringar i Editorn.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] Att skriva ett band på en annan sträng i ett slag som redan har toner bygger ett ackord (testat).
- [x] Det finns kommandon för att ta bort en ton (markörens sträng) och ett helt slag (testat).
- [x] Ångra och gör om fungerar för alla Editor-kommandon. Sammansatta operationer ångras som en enhet.
- [x] En ny ändring efter ångra rensar historiken för gör om.
- [x] Översättaren återger ackord korrekt i notsystem och tabulatur (testat).
- [x] Kortkommandon för ångra och gör om (Ctrl+Z, Ctrl+Y och Ctrl+Shift+Z) fungerar.

## Comments

**Implementerad.** Val och noteringar att känna till:
- Ackord: ett band på en sträng ersätter bara tonen på den strängen i slaget. Övriga toner ligger kvar, och tonerna hålls i strängordning.
- `deleteNote` tar bort tonen på markörens sträng. Ett slag utan toner blir en paus med samma Notvärde. `deleteBeat` tar bort slaget, de följande slagen flyttas bakåt och markören hamnar på nästa slag (eller på det föregående om det var det sista). En Takt behåller alltid ett slag: tas det enda bort blir det en paus. Slag från nästa Takt flyttas inte in, så en Takt som blir för kort flaggas av valideringen men rättas inte.
- Kortkommandon: Delete eller Backspace tar bort en ton, Shift+Delete tar bort ett slag, Ctrl+Z ångrar och Ctrl+Y eller Ctrl+Shift+Z gör om (Cmd på Mac). Tangenterna för att ta bort efterfrågades inte i ticketen men behövdes för att kommandona ska gå att använda.
- Historiken består av ändringar med lägena före och efter (Partitur och markör). Ett kommando blir en ändring bara om Partituret skiljer sig på innehåll. Markörflyttningar och kommandon som inte ändrar något (t.ex. Delete på en tom sträng) hamnar alltså inte i historiken och rensar inte det som går att göra om. Höger på det sista slaget i en Takt skapar dock ett nytt slag och räknas därför som en ändring.
- Ångra ställer markören där den stod före ändringen och gör om där den stod efter.
- Sammansatta operationer ångras som en enhet: ett kommando är ett steg (t.ex. paus som skapar nästa slag), och ett tvåsiffrigt band slås ihop med sin första siffra.
- Historiken har ingen övre gräns än.
- Översättaren klarade redan flera toner per slag. Ackordtestet var därför grönt från början och dokumenterar beteendet.
- Tangentbordsskalet har ingen egen testgräns (enligt specen) och kortkommandona är inte verifierade i webbläsaren än.

