# 19: Vy-läge som dropdown i Score settings

**What to build:** Vy-läget väljs i en dropdown i *Score settings* i stället för med tre knappar i verktygsraden. Valen heter *Notation + tab*, *Notation only* och *Rhythm tab*. Bytet görs fortfarande med Editor-kommandot `setViewMode`, så det går att ångra.

**Blocked by:** 06

**Status:** ready-for-agent

- [x] Score settings har ett fält "View" med de tre Vy-lägena, och det visar Partiturets nuvarande läge (även efter ångra).
- [x] Knapparna för Vy-läge finns inte längre i verktygsraden.
- [x] Dropdownen lämnar fokus direkt efter ett val, så att piltangenterna sedan flyttar Markören och inte byter Vy-läge.

## Comments

**Implementerad.**
- `ViewModePicker` är nu en `<select>` med etiketten "View", först i Score settings. Efter valet anropas `blur()`, så att piltangenterna fortsätter att styra editorn.
- Knapparna är borta ur verktygsraden. `editTools` har bara Taktknapparna kvar.
- Verifierat i headless Chrome: alla tre lägena går att välja, en pil efteråt ändrar inte läget, och Ctrl+Z ångrar bytet.
