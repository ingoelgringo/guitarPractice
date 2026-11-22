import { describe, expect, it } from "vitest";
import { MESSAGES } from "./messages";
import { isActiveNavItem, siteNavItems } from "./siteNav";
import { TOOLS } from "./tools";

describe("menyns poster", () => {
  it("börjar med Gitarrsidan och har sedan Verktygen som finns, i samma ordning", () => {
    const items = siteNavItems(false, "en");
    expect(items[0]).toEqual({ href: "/", label: MESSAGES.en.siteTitle });
    const tools = TOOLS.filter((tool) => tool.href).map((tool) => ({ href: tool.href, label: tool.title }));
    expect(items.slice(1)).toEqual(tools);
  });

  it("har Biblioteket sist bara för Ägaren", () => {
    expect(siteNavItems(false, "sv").some((item) => item.href === "/library")).toBe(false);
    expect(siteNavItems(true, "sv").at(-1)).toEqual({ href: "/library", label: MESSAGES.sv.library });
  });

  it("översätter Gitarrsidan men inte Verktygens namn", () => {
    expect(siteNavItems(false, "sv")[0].label).toBe(MESSAGES.sv.siteTitle);
    expect(siteNavItems(false, "sv").slice(1)).toEqual(siteNavItems(false, "en").slice(1));
  });
});

describe("den aktiva posten", () => {
  it("Gitarrsidan är aktiv bara på sig själv", () => {
    expect(isActiveNavItem("/", "/")).toBe(true);
    expect(isActiveNavItem("/", "/tab-editor")).toBe(false);
  });

  it("ett Verktyg är aktivt på sin sida och sidor under den", () => {
    expect(isActiveNavItem("/library", "/library")).toBe(true);
    expect(isActiveNavItem("/library", "/library/abc")).toBe(true);
    expect(isActiveNavItem("/tab-editor", "/fretboard")).toBe(false);
  });

  it("en sida som bara börjar likadant räknas inte", () => {
    expect(isActiveNavItem("/library", "/library-old")).toBe(false);
  });
});
