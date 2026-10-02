/** Ett Verktyg på sajten, visat som ett kort på landningssidan. */
export interface Tool {
  href: string;
  title: string;
  description: string;
}

export const TOOLS: Tool[] = [
  {
    href: "/tab-editor",
    title: "Tab Editor",
    description: "Write guitar tablature with standard notation, play it back and print it.",
  },
];
