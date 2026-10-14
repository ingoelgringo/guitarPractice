# 02: Täthet

**What to build:** Partituret får en Täthet (`spacing`, 0–3, där 0 är dagens avstånd och högre är tätare). Den ställs med ett reglage i Partiturinställningarna, kan ångras, sparas i `.itab` och gäller både skärm och utskrift, så att fler Takter får plats på en rad.

**Blocked by:** –

**Status:** done

- [x] `Score` har `spacing`. `createEditor` ger 0.
- [x] `.itab` får nästa `schemaVersion` med en migrering som sätter `spacing: 0`, och `spacing` valideras. Test med en fixtur av förra versionen.
- [x] Ett Editor-kommando sätter Tätheten och går att ångra.
- [x] Steget mappas till alphaTabs inställning för horisontellt avstånd (läs alphaTabs dokumentation i `node_modules` först). Test i `toAlphaTab` eller där inställningen sätts.
- [x] Reglaget i Partiturinställningarna. Verifierat manuellt att fler Takter får plats på en rad och att utskriften följer med.

## Comments

**Implementerad.** `Score.spacing` är `Spacing` (0–3, `SPACINGS` i `score.ts`) och `createEditor` ger 0. Kommandot `setSpacing` avvisar värden utanför stegen och går att ångra. `.itab` är version 5: migreringen från 4 sätter `spacing: 0` (fixtur `score-v5.itab`). `stretchForce(spacing)` i `toAlphaTab.ts` mappar stegen till alphaTabs `display.stretchForce` (1, 0.8, 0.6, 0.45), och `ScoreView` sätter inställningen innan Partituret ritas. Reglaget *Density* ligger under *View* i Score settings.

Verifierat i appen: 16 Takter med fyra fjärdedelar ger 3 Takter per rad vid 0 och 6 vid 3, och i print-läge i A4-bredd 3–4 respektive 7. alphaTab trycker aldrig ihop en Takt mer än att noterna får plats (`minStretchForce`), så Takter med många korta toner och förtecken blir knappt tätare.
