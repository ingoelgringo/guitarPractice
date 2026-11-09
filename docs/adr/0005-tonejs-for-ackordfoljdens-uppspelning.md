# Ackordföljder spelas upp med Tone.js, inte med alphaTabs syntes

En Ackordföljd spelas upp med Tone.js: samplingar för trummor och elpiano, syntes för bas och synthpad. Tab-editorn fortsätter att spela Partitur med alphaTab.

Vi valde bort alphaTabs syntes med den soundfont som appen redan har. Den hade inte krävt något nytt beroende, men den spelar ett renderat partitur, och en Ackordföljd har inga Spår eller Notvärden som går att rendera. Vi hade behövt bygga ett osynligt Partitur bara för att få ljud, och Instrumenten bockas i och ur och tempot ändras under uppspelning, vilket passar en sequencer bättre. Ren Web Audio-syntes valdes också bort, eftersom trummor och elpiano är svåra att få att låta trovärdigt. Priset är två ljudmotorer i appen och samplingar under `public/` som måste ha en licens som tillåter att vi lägger ut dem (t.ex. CC0).
