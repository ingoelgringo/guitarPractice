import type { NextConfig } from "next";
import { BASE_PATH } from "./lib/basePath";

const nextConfig: NextConfig = {
  // Bygget sker i CI och skickas till servern med rsync, se vps-infra/apps/guitar-practice.md.
  output: "standalone",
  // Gitarrdelen ligger under /guitar på sajten, se ADR 0004.
  basePath: BASE_PATH,
};

export default nextConfig;
