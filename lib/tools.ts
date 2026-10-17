/** Ett Verktyg på sajten, visat som ett kort på landningssidan. */
export interface Tool {
  href: string;
  title: string;
  description: string;
  /** Ligger utanför Next-appen (ett statiskt projekt som Nginx serverar), så kortet blir en vanlig länk. */
  external?: boolean;
}

export const TOOLS: Tool[] = [
  {
    href: "/tab-editor",
    title: "Tab Editor",
    description: "Write guitar tablature with standard notation, play it back and print it.",
  },
  {
    href: "/fretboard",
    title: "Fretboard",
    description: "See scales on the guitar neck.",
  },
  // Tillfälligt här tills hemsidan bryts ut ur guitarPractice (stenhagenGame/docs/PLAN-hemsida.md).
  {
    href: "/stenhagen/",
    title: "Spring i Stenhagen",
    description: "A side-scrolling game for kids: run through Stenhagen and dodge cats and snakes. In Swedish.",
    external: true,
  },
];
