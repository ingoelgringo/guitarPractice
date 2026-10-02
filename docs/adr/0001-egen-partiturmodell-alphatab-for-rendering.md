# Egen partiturmodell; alphaTab bara för rendering och uppspelning

Vi använder alphaTab för att rendera notsystem och tabulatur, för A4-layout och för uppspelning, eftersom det skulle ta månader att bygga själv. Källan till sanningen är däremot en egen domänmodell (enkla TypeScript-typer för Partitur, Spår, Takt osv.). Den översätts till alphaTabs `Score` vid varje rendering. Editorn (markör, inmatning, ångra och gör om) arbetar enbart mot den egna modellen.

Vi valde bort att spara alphaTabs modell direkt. Då skulle filformatet och databasinnehållet bli beroende av ett tredjepartsbiblioteks interna struktur, som kan ändras mellan versioner. Priset för vårt val är en översättare som måste hållas i takt med de notationselement vi stöder.
