import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { tunerManifest } from "./tunerManifest";

describe("Manifestet", () => {
  const m = tunerManifest();

  it("installerar Stämmaren under /guitar/tuner som en egen app", () => {
    expect(m).toMatchObject({
      id: "/guitar/tuner",
      start_url: "/guitar/tuner",
      scope: "/guitar/tuner",
      display: "standalone",
    });
  });

  it("har ikoner på 192 och 512 px, även maskable, som finns i public", () => {
    const icons = m.icons ?? [];
    expect(icons.map((i) => [i.sizes, i.purpose ?? "any"])).toEqual(
      expect.arrayContaining([
        ["192x192", "any"],
        ["512x512", "any"],
        ["512x512", "maskable"],
      ]),
    );
    for (const icon of icons) {
      expect(icon.src.startsWith("/guitar/")).toBe(true);
      expect(existsSync(join(__dirname, "..", "public", icon.src.slice("/guitar/".length)))).toBe(true);
    }
  });
});
