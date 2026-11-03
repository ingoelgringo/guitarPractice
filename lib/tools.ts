import type { SiteLanguage } from "./siteLanguage";

/** Ett Verktyg i gitarrdelen, visat som ett kort på Gitarrsidan. Namnet översätts inte. */
export interface Tool {
  /** Saknas för ett Verktyg som inte finns än; kortet visas då nedtonat med "Coming soon". */
  href?: string;
  title: string;
  description: Record<SiteLanguage, string>;
}

export const TOOLS: Tool[] = [
  {
    href: "/tab-editor",
    title: "Tab Editor",
    description: {
      en: "Write guitar tablature with standard notation, play it back and print it.",
      sv: "Skriv gitarrtabulatur med noter, spela upp den och skriv ut den.",
    },
  },
  {
    href: "/fretboard",
    title: "Fretboard Practice",
    description: {
      en: "See scales on the guitar neck.",
      sv: "Se skalor på gitarrens hals.",
    },
  },
  {
    href: "/chord-progressions",
    title: "Chord Progressions",
    description: {
      en: "Practice common chord progressions.",
      sv: "Öva vanliga ackordföljder.",
    },
  },
];
