import { describe, expect, it } from "vitest";
import { languageCookie, otherLanguage, siteLanguage } from "./siteLanguage";

describe("Sajtspråket", () => {
  it("följer en giltig cookie, oavsett vad webbläsaren föredrar", () => {
    expect(siteLanguage("sv", "en-US,en;q=0.9")).toBe("sv");
    expect(siteLanguage("en", "sv-SE,sv;q=0.9")).toBe("en");
  });

  it("bortser från en ogiltig cookie", () => {
    expect(siteLanguage("de", "sv-SE")).toBe("sv");
    expect(siteLanguage("", "en-GB")).toBe("en");
    expect(siteLanguage("SV", null)).toBe("en");
  });

  it("blir svenska när webbläsaren föredrar svenska först", () => {
    expect(siteLanguage(undefined, "sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7")).toBe("sv");
    expect(siteLanguage(undefined, "sv")).toBe("sv");
  });

  it("väljer det av engelska och svenska som webbläsaren föredrar mest", () => {
    expect(siteLanguage(undefined, "en-US,en;q=0.9,sv;q=0.8")).toBe("en");
    expect(siteLanguage(undefined, "de-DE,de;q=0.9,sv;q=0.8,en;q=0.7")).toBe("sv");
    expect(siteLanguage(undefined, "en;q=0.5,sv;q=0.8")).toBe("sv");
    expect(siteLanguage(undefined, "sv;q=0,en")).toBe("en");
  });

  it("blir engelska utan svenska, och utan header", () => {
    expect(siteLanguage(undefined, "de-DE,fr;q=0.8")).toBe("en");
    expect(siteLanguage(undefined, "*")).toBe("en");
    expect(siteLanguage(undefined, "")).toBe("en");
    expect(siteLanguage(undefined, null)).toBe("en");
  });
});

describe("flaggan", () => {
  it("byter till det andra språket", () => {
    expect(otherLanguage("en")).toBe("sv");
    expect(otherLanguage("sv")).toBe("en");
  });

  it("sparar valet för hela sajten i ett år", () => {
    expect(languageCookie("sv")).toBe("lang=sv; Path=/; Max-Age=31536000; SameSite=Lax");
  });
});
