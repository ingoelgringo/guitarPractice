import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bygget sker i CI och skickas till servern med rsync, se vps-infra/apps/guitar-practice.md.
  output: "standalone",
};

export default nextConfig;
