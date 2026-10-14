# 02: Täthet

**What to build:** Partituret får en Täthet (`spacing`, 0–3, där 0 är dagens avstånd och högre är tätare). Den ställs med ett reglage i Partiturinställningarna, kan ångras, sparas i `.itab` och gäller både skärm och utskrift, så att fler Takter får plats på en rad.

**Blocked by:** –

**Status:** ready-for-agent

- [ ] `Score` har `spacing`. `createEditor` ger 0.
- [ ] `.itab` får nästa `schemaVersion` med en migrering som sätter `spacing: 0`, och `spacing` valideras. Test med en fixtur av förra versionen.
- [ ] Ett Editor-kommando sätter Tätheten och går att ångra.
- [ ] Steget mappas till alphaTabs inställning för horisontellt avstånd (läs alphaTabs dokumentation i `node_modules` först). Test i `toAlphaTab` eller där inställningen sätts.
- [ ] Reglaget i Partiturinställningarna. Verifierat manuellt att fler Takter får plats på en rad och att utskriften följer med.
