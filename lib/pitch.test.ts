import { describe, expect, it } from "vitest";
import { detectPitch } from "./pitch";

const SAMPLE_RATE = 48000;
/** Fönsterlängden som Stämmaren använder: tillräcklig för låg B på bas 5. */
const WINDOW = 8192;

function centsBetween(a: number, b: number): number {
  return 1200 * Math.log2(a / b);
}

function sine(frequency: number, length = WINDOW, amplitude = 0.5): Float32Array {
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) out[i] = amplitude * Math.sin((2 * Math.PI * frequency * i) / SAMPLE_RATE);
  return out;
}

describe("Tonhöjdsdetektering", () => {
  it("hittar frekvensen i en sinuston på 440 Hz", () => {
    const result = detectPitch(sine(440), SAMPLE_RATE);
    expect(result).not.toBeNull();
    expect(Math.abs(centsBetween(result!.frequency, 440))).toBeLessThan(1);
  });

  // Låg B på bas 5, låg E på bas, låg E på gitarr, G4 på ukulele, högt band på e-strängen.
  const frequencies = [30.87, 41.2, 82.41, 392, 1318.5];

  it.each(frequencies)("hittar en sinuston på %d Hz inom 1 cent", (frequency) => {
    const result = detectPitch(sine(frequency), SAMPLE_RATE);
    expect(Math.abs(centsBetween(result!.frequency, frequency))).toBeLessThan(1);
  });

  it.each(frequencies)("hittar grundtonen i en sågtand på %d Hz inom 1 cent", (frequency) => {
    const result = detectPitch(sawtooth(frequency), SAMPLE_RATE);
    expect(Math.abs(centsBetween(result!.frequency, frequency))).toBeLessThan(1);
  });

  it.each([30.87, 82.41])("hittar en svag grundton på %d Hz under starka övertoner, utan oktavfel", (frequency) => {
    const samples = new Float32Array(WINDOW);
    const harmonics = [0.03, 0.5, 0.4, 0.2];
    harmonics.forEach((amplitude, h) => {
      for (let i = 0; i < WINDOW; i++) samples[i] += amplitude * Math.sin((2 * Math.PI * (h + 1) * frequency * i) / SAMPLE_RATE);
    });
    const result = detectPitch(samples, SAMPLE_RATE);
    expect(Math.abs(centsBetween(result!.frequency, frequency))).toBeLessThan(1);
  });

  it("ger null vid tystnad", () => {
    expect(detectPitch(new Float32Array(WINDOW), SAMPLE_RATE)).toBeNull();
  });

  it("ger null för vitt brus", () => {
    let seed = 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
    const noise = Float32Array.from({ length: WINDOW }, () => 0.3 * random());
    expect(detectPitch(noise, SAMPLE_RATE)).toBeNull();
  });

  it("ger null för en mycket svag signal under mikrofonens brusgolv", () => {
    expect(detectPitch(sine(440, WINDOW, 0.0005), SAMPLE_RATE)).toBeNull();
  });
});

/** Bandbegränsad sågtand: övertonerna 1/n upp till 8 kHz. */
function sawtooth(frequency: number, length = WINDOW): Float32Array {
  const out = new Float32Array(length);
  for (let n = 1; n * frequency < 8000; n++) {
    for (let i = 0; i < length; i++) out[i] += (0.3 / n) * Math.sin((2 * Math.PI * n * frequency * i) / SAMPLE_RATE);
  }
  return out;
}
