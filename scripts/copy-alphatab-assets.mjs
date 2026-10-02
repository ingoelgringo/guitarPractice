// Kopierar alphaTabs filer till public/alphatab/ så att de serveras som statiska filer:
// typsnitten, soundfonten och skriptet som spelaren startar sin worker och AudioWorklet från.
import { cpSync } from "node:fs";

const dist = "node_modules/@coderline/alphatab/dist";
cpSync(`${dist}/font`, "public/alphatab/font", { recursive: true });
cpSync(`${dist}/soundfont`, "public/alphatab/soundfont", { recursive: true });
cpSync(`${dist}/alphaTab.js`, "public/alphatab/alphaTab.js");
