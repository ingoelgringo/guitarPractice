import { describe, expect, it } from "vitest";
import { withBasePath } from "./basePath";

describe("en sökväg i gitarrdelen", () => {
  it("hamnar under /guitar", () => {
    expect(withBasePath("/api/login")).toBe("/guitar/api/login");
    expect(withBasePath("/alphatab/font/")).toBe("/guitar/alphatab/font/");
  });

  it("gitarrdelens start är /guitar utan avslutande snedstreck", () => {
    expect(withBasePath("/")).toBe("/guitar");
  });
});
