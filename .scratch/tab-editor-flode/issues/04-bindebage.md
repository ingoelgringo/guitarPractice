# 04: Bindebåge i partiturmodellen

**What to build:** Ett Slag kan ha en Bindebåge från det föregående Slaget (`tiedFromPrevious`). Bågen ritas i notvyn och tonen klingar vidare i uppspelningen. Den sparas i `.itab`. Ett nytt band, en borttagen ton eller ett nytt Notvärde på någon av de bundna halvorna bryter bågen. Det finns ingen tangent för att skapa en Bindebåge, utan den skapas av Skjutningen (ticket 05).

**Blocked by:** –

**Status:** done

- [x] `Beat` har det valfria fältet `tiedFromPrevious`. Tonerna är desamma som i föregående Slag. Palm mute finns på båda halvorna, bend och förbindelse bara på den sista, och Ackordnamn och Anteckning bara på den första.
- [x] `.itab` validerar fältet i nästa `schemaVersion`, samma version som ticket 02 om de levereras tillsammans.
- [x] `toAlphaTab` sätter `isTieDestination` på tonerna. Test i `toAlphaTab.test.ts`. Uppspelningen verifieras manuellt med en fixtur.
- [x] Editor-kommandon som ändrar band, ton eller Notvärde på en bunden halva tar bort bågen. Test genom `apply`.
