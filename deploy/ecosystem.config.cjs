// PM2-konfiguration för produktion på VPS:en, se vps-infra/apps/guitar-practice.md.
// CI kopierar filen in i standalone-bygget, så den ligger bredvid server.js i varje release.
// PM2 läser ecosystem-filen som CommonJS.
/* eslint-disable @typescript-eslint/no-require-imports */
const { existsSync, readFileSync } = require("node:fs");
const { parseEnv } = require("node:util");

// Hemligheterna (DATABASE_URL, OWNER_USERNAME, OWNER_PASSWORD_HASH, SESSION_SECRET) ligger i en
// fil utanför releaserna, se .env.production.example. parseEnv expanderar inte $, så bcrypt-hashen
// kan stå som den är. Deployen kräver filen (migreringarna läser DATABASE_URL ur den). Saknas den
// ändå startar appen, men ingen kan logga in eller nå Biblioteket.
const SECRETS_FILE = "/home/deploy/guitar-practice/.env";
const secrets = existsSync(SECRETS_FILE) ? parseEnv(readFileSync(SECRETS_FILE, "utf8")) : {};

module.exports = {
  apps: [
    {
      name: "guitar-practice",
      // Via symlänken current: node löser den vid varje start, och server.js gör chdir till sin release.
      script: "/home/deploy/guitar-practice/current/server.js",
      cwd: "/home/deploy/guitar-practice/current",
      // HOSTNAME sätts uttryckligen, annars kan maskinens värdnamn ärvas från skalet.
      env: { ...secrets, NODE_ENV: "production", PORT: "3004", HOSTNAME: "127.0.0.1" },
      instances: 1,
      autorestart: true,
      watch: false,
      // Hårt tak så att appen aldrig tränger undan de andra apparna på servern.
      max_memory_restart: "250M",
      error_file: "/home/deploy/logs/guitar-practice-error.log",
      out_file: "/home/deploy/logs/guitar-practice-out.log",
    },
  ],
};
