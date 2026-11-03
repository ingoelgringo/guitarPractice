/** Ett Verktyg i gitarrdelen, visat som ett kort på Gitarrsidan. */
export interface Tool {
  /** Saknas för ett Verktyg som inte finns än; kortet visas då nedtonat med "Coming soon". */
  href?: string;
  title: string;
  description: string;
}

export const TOOLS: Tool[] = [
  {
    href: "/tab-editor",
    title: "Tab Editor",
    description: "Write guitar tablature with standard notation, play it back and print it.",
  },
  {
    href: "/fretboard",
    title: "Fretboard Practice",
    description: "See scales on the guitar neck.",
  },
  {
    title: "Chord Progressions",
    description: "Practice common chord progressions.",
  },
];
