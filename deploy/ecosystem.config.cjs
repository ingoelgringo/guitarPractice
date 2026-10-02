// PM2-konfiguration för produktion på VPS:en, se vps-infra/apps/guitar-practice.md.
// CI kopierar filen in i standalone-bygget, så den ligger bredvid server.js i varje release.
module.exports = {
  apps: [
    {
      name: "guitar-practice",
      // Via symlänken current: node löser den vid varje start, och server.js gör chdir till sin release.
      script: "/home/deploy/guitar-practice/current/server.js",
      cwd: "/home/deploy/guitar-practice/current",
      // HOSTNAME sätts uttryckligen, annars kan maskinens värdnamn ärvas från skalet.
      env: { NODE_ENV: "production", PORT: "3004", HOSTNAME: "127.0.0.1" },
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
