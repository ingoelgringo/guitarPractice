# .itab (versionerad JSON) är samma format för fil och databas

Ett Partitur serialiseras som JSON med ett `schemaVersion`-fält. Samma dokument laddas ner som `.itab`-fil av Gäster och lagras i Postgres (`jsonb`) för Ägaren. Äldre versioner migreras uppåt när filen läses in. Filen innehåller ingen databasidentitet, så att öppna en Partiturfil skapar alltid ett nytt Partitur.

Vi valde bort Guitar Pro (`.gp`) som huvudformat. Det hade gett kompatibilitet med andra program, men vi hade inte kontrollerat formatet och det hade inte gått att spegla vår domänmodell exakt. Filer som ligger hos användare går inte att ta tillbaka, så schemat måste alltid vara bakåtkompatibelt via migreringar. Import och export av `.gp` och MusicXML kan läggas till senare som separata funktioner.
