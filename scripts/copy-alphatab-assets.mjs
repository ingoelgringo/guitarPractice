// Kopierar alphaTabs typsnitt till public/ så att de serveras som statiska filer.
import { cpSync } from "node:fs";

cpSync("node_modules/@coderline/alphatab/dist/font", "public/alphatab/font", { recursive: true });
