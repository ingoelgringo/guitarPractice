import type { SiteLanguage } from "./siteLanguage";

/**
 * Texterna i headern, på Gitarrsidan, login-sidan och Library-sidan på båda Sajtspråken. Verktygen
 * är bara på engelska tills vidare.
 */
const en = {
  siteTitle: "Guitar",
  siteDescription: "Tools for guitarists: write tabs with notation, play them back and print them.",

  // Headern. Flaggan visar språket man byter till.
  switchLanguageFlag: "🇸🇪",
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
};

export type Messages = typeof en;

const sv: Messages = {
  siteTitle: "Gitarr",
  siteDescription: "Verktyg för gitarrister: skriv tabulatur med noter, spela upp och skriv ut.",

  switchLanguageFlag: "🇬🇧",
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
};

export const MESSAGES: Record<SiteLanguage, Messages> = { en, sv };
