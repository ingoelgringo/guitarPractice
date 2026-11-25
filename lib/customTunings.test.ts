import { describe, expect, it } from "vitest";
import {
  CUSTOM_TUNINGS_KEY,
  deleteCustomTuning,
  MAX_TUNING_NAME_LENGTH,
  pitchRange,
  putCustomTuning,
  readCustomTunings,
  saveCustomTunings,
  stepString,
  tuningsFor,
  type CustomTuning,
} from "./customTunings";
import { stringInstrument } from "./tuning";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

const stored = (value: unknown) => memoryStorage({ [CUSTOM_TUNINGS_KEY]: JSON.stringify(value) });

const openA: CustomTuning = { instrument: "guitar6", name: "Open A", tuning: [64, 61, 57, 52, 45, 40] };
const dropB: CustomTuning = { instrument: "bass4", name: "Drop B", tuning: [43, 38, 33, 23] };

describe("Lagringen av egna stämningar", () => {
  it("är tom första gången och utan lagring", () => {
    expect(readCustomTunings(memoryStorage())).toEqual([]);
    expect(readCustomTunings(null)).toEqual([]);
  });

  it("läser tillbaka det som sparats, med schemaVersion 1", () => {
    const storage = memoryStorage();
    saveCustomTunings(storage, [openA, dropB]);
    expect(readCustomTunings(storage)).toEqual([openA, dropB]);
    expect(JSON.parse(storage.getItem(CUSTOM_TUNINGS_KEY)!)).toMatchObject({ schemaVersion: 1 });
  });

  it("ger en tom lista när det sparade inte går att läsa", () => {
    expect(readCustomTunings(memoryStorage({ [CUSTOM_TUNINGS_KEY]: "{inte json" }))).toEqual([]);
    expect(readCustomTunings(stored("text"))).toEqual([]);
    expect(readCustomTunings(stored({ schemaVersion: 1, tunings: "inte en lista" }))).toEqual([]);
  });

  it("struntar i en senare schemaVersion som den inte förstår", () => {
    expect(readCustomTunings(stored({ schemaVersion: 2, tunings: [openA] }))).toEqual([]);
  });

  it("hoppar över ogiltiga stämningar och behåller de giltiga", () => {
    const tunings = [
      openA,
      null,
      { ...openA, name: "Banjo", instrument: "banjo" },
      { ...openA, name: "Fem strängar", tuning: [64, 59, 55, 50, 45] },
      { ...openA, name: "Text", tuning: ["E", 59, 55, 50, 45, 40] },
      { ...openA, name: "Halvton", tuning: [64.5, 59, 55, 50, 45, 40] },
      { ...openA, name: "För lågt", tuning: [64, 59, 55, 50, 45, 2] },
      { ...openA, name: "  " },
      { ...openA, name: "open a" },
      { ...openA, name: "Drop D" },
      dropB,
    ];
    expect(readCustomTunings(stored({ schemaVersion: 1, tunings }))).toEqual([openA, dropB]);
  });

  it("tar bort blanksteg runt namnet", () => {
    expect(readCustomTunings(stored({ schemaVersion: 1, tunings: [{ ...openA, name: " Open A " }] }))).toEqual([
      openA,
    ]);
  });
});

describe("Att skapa, ändra och ta bort egna stämningar", () => {
  it("skapar en ny stämning", () => {
    expect(putCustomTuning([dropB], openA)).toEqual({ tunings: [dropB, openA] });
  });

  it("tar bort blanksteg runt namnet", () => {
    expect(putCustomTuning([], { ...openA, name: "  Open A  " })).toEqual({ tunings: [openA] });
  });

  it("nekar ett tomt namn", () => {
    expect(putCustomTuning([], { ...openA, name: "   " })).toEqual({ error: "empty" });
  });

  it("nekar ett för långt namn", () => {
    expect(putCustomTuning([], { ...openA, name: "x".repeat(MAX_TUNING_NAME_LENGTH + 1) })).toEqual({
      error: "tooLong",
    });
    expect("tunings" in putCustomTuning([], { ...openA, name: "x".repeat(MAX_TUNING_NAME_LENGTH) })).toBe(true);
  });

  it("nekar ett namn som en färdig eller egen stämning för samma Stränginstrument redan har", () => {
    expect(putCustomTuning([], { ...openA, name: "drop d" })).toEqual({ error: "taken" });
    expect(putCustomTuning([openA], { ...openA, name: "OPEN A", tuning: [64, 59, 55, 50, 45, 40] })).toEqual({
      error: "taken",
    });
  });

  it("tillåter samma namn för ett annat Stränginstrument", () => {
    expect(putCustomTuning([openA], { ...dropB, name: "Open A" })).toEqual({
      tunings: [openA, { ...dropB, name: "Open A" }],
    });
  });

  it("ändrar tonerna i en befintlig stämning på samma plats i listan", () => {
    const changed = { ...openA, tuning: [64, 61, 57, 52, 45, 38] };
    expect(putCustomTuning([openA, dropB], changed, "Open A")).toEqual({ tunings: [changed, dropB] });
  });

  it("byter namn på en befintlig stämning", () => {
    const renamed = { ...openA, name: "Open A (low)" };
    expect(putCustomTuning([openA, dropB], renamed, "Open A")).toEqual({ tunings: [renamed, dropB] });
  });

  it("låter en stämning behålla sitt namn med annan stavning när den ändras", () => {
    expect(putCustomTuning([openA], { ...openA, name: "OPEN A" }, "Open A")).toEqual({
      tunings: [{ ...openA, name: "OPEN A" }],
    });
  });

  it("nekar att byta till ett namn som en annan stämning har", () => {
    const other = { ...openA, name: "Other", tuning: [64, 59, 55, 50, 45, 40] };
    expect(putCustomTuning([openA, other], { ...other, name: "Open A" }, "Other")).toEqual({ error: "taken" });
  });

  it("nekar fel antal strängar", () => {
    expect(putCustomTuning([], { ...openA, tuning: [64, 59, 55, 50, 45] })).toEqual({ error: "invalid" });
  });

  it("tar bort en stämning för rätt Stränginstrument", () => {
    const bassOpenA = { ...dropB, name: "Open A" };
    expect(deleteCustomTuning([openA, bassOpenA, dropB], "bass4", "Open A")).toEqual([openA, dropB]);
  });

  it("listar de egna stämningarna efter de färdiga, bara för det valda Stränginstrumentet", () => {
    const list = tuningsFor("bass4", [openA, dropB]);
    expect(list.map((t) => [t.name, t.custom])).toEqual([
      ["Standard", false],
      ["Drop D", false],
      ["Eb standard", false],
      ["Drop B", true],
    ]);
    expect(list[3].tuning).toEqual(dropB.tuning);
  });
});

describe("Halvtonsstegen", () => {
  const guitar = stringInstrument("guitar6");

  it("stämmer en sträng en halvton upp eller ner och lämnar de andra", () => {
    expect(stepString(guitar, [64, 59, 55, 50, 45, 40], 5, -1)).toEqual([64, 59, 55, 50, 45, 39]);
    expect(stepString(guitar, [64, 59, 55, 50, 45, 40], 0, 1)).toEqual([65, 59, 55, 50, 45, 40]);
  });

  it("går högst en oktav under och en kvint över de färdiga stämningarnas toner för strängen", () => {
    // Sträng 6 på gitarr 6 går från C2 (36) till E2 (40) i de färdiga stämningarna
    expect(pitchRange(guitar, 5)).toEqual({ min: 24, max: 47 });
    expect(stepString(guitar, [64, 59, 55, 50, 45, 24], 5, -1)).toEqual([64, 59, 55, 50, 45, 24]);
    expect(stepString(guitar, [64, 59, 55, 50, 45, 47], 5, 1)).toEqual([64, 59, 55, 50, 45, 47]);
  });

  it("går inte under den lägsta ton som Stämmaren hör", () => {
    // Bas 5:s låga B är 23 och Stämmaren hör ner till cirka 29 Hz (A#0 = 22)
    expect(pitchRange(stringInstrument("bass5"), 4).min).toBe(22);
  });

  it("räknar ukulelens fjärde sträng från alla dess färdiga stämningar", () => {
    // Hög G (67), låg G (55) och barytonens D (50)
    expect(pitchRange(stringInstrument("ukulele"), 3)).toEqual({ min: 38, max: 74 });
  });

  it("stämmer ett Strängpar med oktavsträng som en enhet", () => {
    const twelve = stringInstrument("guitar12");
    expect(pitchRange(twelve, 5)).toEqual({ min: 28, max: 47 });
    expect(stepString(twelve, [64, 59, 55, 50, 45, 40], 5, -2)).toEqual([64, 59, 55, 50, 45, 38]);
  });

  it("drar in en ton som ligger utanför gränsen", () => {
    expect(stepString(guitar, [64, 59, 55, 50, 45, 10], 5, 1)).toEqual([64, 59, 55, 50, 45, 24]);
  });
});
