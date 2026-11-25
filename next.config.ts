import type { NextConfig } from "next";
import { BASE_PATH } from "./lib/basePath";

const nextConfig: NextConfig = {
  // Bygget sker i CI och skickas till servern med rsync, se vps-infra/apps/guitar-practice.md.
  output: "standalone",
  // Gitarrdelen ligger under /guitar på sajten, se ADR 0004.
  basePath: BASE_PATH,
  // Stämmarens service worker (public/sw.js) ska alltid hämtas på nytt, så att en ny version når
  // ut direkt. Källan räknas utan basePath.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
