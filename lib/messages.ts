import type { SiteLanguage } from "./siteLanguage";

/**
 * Texterna i headern, på Gitarrsidan, login-sidan, Library-sidan och Ackordföljder på båda
 * Sajtspråken. Tab-editorn och Greppbrädan är bara på engelska tills vidare. Verktygens namn och
 * tonnamnen översätts inte: tonnamnen följer Notnamnsläget.
 */
const en = {
  siteTitle: "Guitar",
  siteDescription: "Tools for guitarists: write tabs with notation, play them back and print them.",

  // Headern. Flaggan (components/Flag.tsx) visar språket man byter till.
  switchLanguage: "På svenska",
  toggleTheme: "Toggle light/dark theme",

  // Gitarrsidan
  guitarIntro: "Tools for guitarists: write tabs with notation, and see scales on the fretboard.",
  comingSoon: "Coming soon",
  logIn: "Log in",
  logOut: "Log out",
  library: "Library",

  // Login-sidan
  username: "Username",
  password: "Password",
  loggingIn: "Logging in…",
  loginMissingFields: "Username and password are required.",
  loginWrongCredentials: "Wrong username or password.",
  loginTooManyAttempts: "Too many failed attempts. Try again later.",
  loginFailed: "Login failed.",
  loginUnreachable: "Could not reach the server.",

  // Library-sidan
  dateLocale: "en-GB",
  backToTabEditor: "Back to the Tab Editor",
  libraryEmpty: "The library is empty. New scores you create in the Tab Editor are added here.",
  columnTitle: "Title",
  columnArtist: "Artist",
  columnLastChanged: "Last changed",
  columnActions: "Actions",
  untitled: "Untitled",
  duplicate: "Duplicate",
  download: "Download",
  delete: "Delete",
  confirmDelete: (title: string) => `Delete "${title}" from the library? This can't be undone.`,
  confirmOpenScore: "The score in the editor has changes that haven't been saved or downloaded. Open this score anyway?",
  libraryLoggedOut: "You have been logged out. Log in again to use the library.",
  libraryNotFound: "This score is no longer in the library.",
  libraryUnreachable: "The library couldn't be reached. Check your connection and try again.",

  // Ackordföljder
  chordProgressionsIntro: "Hover a chord to highlight it, and click or tap to keep it highlighted.",
  circleOfFifths: "Circle of fifths",
  circleOfFifthsHelp: "Left and right move by fifths, up and down switch between major and minor, Enter locks and Esc releases.",
  noteNames: "Note names",
  noteNamesSwedish: "Swedish (H, B)",
  noteNamesEnglish: "English (B, B♭)",
  highlightedChord: (chord: string) => `${chord} highlighted`,
};

export type Messages = typeof en;

const sv: Messages = {
  siteTitle: "Gitarr",
  siteDescription: "Verktyg för gitarrister: skriv tabulatur med noter, spela upp och skriv ut.",

  switchLanguage: "In English",
  toggleTheme: "Växla mellan ljust och mörkt tema",

  guitarIntro: "Verktyg för gitarrister: skriv tabulatur med noter, och se skalor på greppbrädan.",
  comingSoon: "Kommer snart",
  logIn: "Logga in",
  logOut: "Logga ut",
  library: "Bibliotek",

  username: "Användarnamn",
  password: "Lösenord",
  loggingIn: "Loggar in…",
  loginMissingFields: "Fyll i användarnamn och lösenord.",
  loginWrongCredentials: "Fel användarnamn eller lösenord.",
  loginTooManyAttempts: "För många misslyckade försök. Försök igen senare.",
  loginFailed: "Inloggningen misslyckades.",
  loginUnreachable: "Kunde inte nå servern.",

  dateLocale: "sv-SE",
  backToTabEditor: "Tillbaka till Tab Editor",
  libraryEmpty: "Biblioteket är tomt. Nya partitur som du skapar i Tab Editor läggs till här.",
  columnTitle: "Titel",
  columnArtist: "Artist",
  columnLastChanged: "Senast ändrad",
  columnActions: "Åtgärder",
  untitled: "Namnlös",
  duplicate: "Duplicera",
  download: "Ladda ner",
  delete: "Ta bort",
  confirmDelete: (title: string) => `Ta bort "${title}" ur biblioteket? Det går inte att ångra.`,
  confirmOpenScore: "Partituret i editorn har ändringar som varken är sparade eller nedladdade. Öppna det här partituret ändå?",
  libraryLoggedOut: "Du har blivit utloggad. Logga in igen för att använda biblioteket.",
  libraryNotFound: "Det här partituret finns inte längre i biblioteket.",
  libraryUnreachable: "Biblioteket gick inte att nå. Kontrollera anslutningen och försök igen.",

  chordProgressionsIntro: "Hovra över ett ackord för att markera det, och klicka eller tryck för att låsa markeringen.",
  circleOfFifths: "Kvintcirkel",
  circleOfFifthsHelp: "Vänster och höger går i kvinter, upp och ner byter mellan dur och moll, Enter låser och Esc släpper.",
  noteNames: "Notnamn",
  noteNamesSwedish: "Svenska (H, B)",
  noteNamesEnglish: "Engelska (B, B♭)",
  highlightedChord: (chord: string) => `${chord} markerat`,
};

export const MESSAGES: Record<SiteLanguage, Messages> = { en, sv };
