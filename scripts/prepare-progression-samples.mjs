// Hämtar samplingarna för Ackordföljdens trummor och elpiano ur Versilian Community Sample
// Library (CC0) och lägger dem under public/sounds/progression/: mono, 16 bitar, kortade och med en
// utklingning. Körs för hand när samplingarna ska bytas: node scripts/prepare-progression-samples.mjs

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const COMMIT = "c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e";
const BASE = `https://raw.githubusercontent.com/sgossner/VCSL/${COMMIT}/`;
const OUT = path.join(import.meta.dirname, "..", "public", "sounds", "progression");

const PIANO = "Electrophones/TX81Z/FM Piano/FMPiano_";
/** [fil i VCSL, fil här, längd i sekunder, utklingning i sekunder] */
const SAMPLES = [
  ["Membranophones/Struck Membranophones/Bass Drum 1/BDrumNew_hit_v5_rr1_Sum.wav", "kick.wav", 0.6, 0.2],
  ["Membranophones/Struck Membranophones/Snare Drum, Modern 1/Snare2_HitSN_v6_rr1_Mid.wav", "snare.wav", 0.5, 0.2],
  ["Idiophones/Struck Idiophones/Hi-Hat Cymbal/HiHat_Close_rr1_Mid.wav", "hihat.wav", 0.25, 0.1],
  ...["C3", "E3", "G#3", "C4", "E4", "G#4", "C5", "E5"].map((note) => [
    `${PIANO}${note}_vl2.wav`,
    `piano-${note.replace("#", "s")}.wav`,
    2.5,
    0.8,
  ]),
];

/** Läser en PCM- eller flyttals-WAV till ett mono-kanalsfält med värden mellan −1 och 1. */
function decode(buffer) {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") throw new Error("inte WAV");
  let format, channels, rate, bits, data;
  for (let offset = 12; offset + 8 <= buffer.length; ) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === "fmt ") {
      format = buffer.readUInt16LE(body);
      channels = buffer.readUInt16LE(body + 2);
      rate = buffer.readUInt32LE(body + 4);
      bits = buffer.readUInt16LE(body + 14);
      if (format === 0xfffe) format = buffer.readUInt16LE(body + 24);
    } else if (id === "data") {
      data = buffer.subarray(body, Math.min(body + size, buffer.length));
    }
    offset = body + size + (size % 2);
  }
  const bytes = bits / 8;
  const frames = Math.floor(data.length / (bytes * channels));
  const read = (at) => {
    if (format === 3) return bits === 64 ? data.readDoubleLE(at) : data.readFloatLE(at);
    if (bits === 16) return data.readInt16LE(at) / 32768;
    if (bits === 24) return data.readIntLE(at, 3) / 8388608;
    if (bits === 32) return data.readInt32LE(at) / 2147483648;
    throw new Error(`${bits} bitar stöds inte`);
  };
  const samples = new Float32Array(frames);
  for (let frame = 0; frame < frames; frame++) {
    let sum = 0;
    for (let channel = 0; channel < channels; channel++) sum += read((frame * channels + channel) * bytes);
    samples[frame] = sum / channels;
  }
  return { rate, samples };
}

/** Kortar till `seconds` från första ljudet, klingar ut linjärt och normaliserar till −1 dBFS. */
function shape({ rate, samples }, seconds, fade) {
  let start = 0;
  while (start < samples.length && Math.abs(samples[start]) < 0.002) start++;
  const out = samples.slice(start, start + Math.round(seconds * rate));
  const fadeFrames = Math.round(fade * rate);
  for (let i = 0; i < fadeFrames && i < out.length; i++) out[out.length - 1 - i] *= i / fadeFrames;
  const peak = out.reduce((max, s) => Math.max(max, Math.abs(s)), 0) || 1;
  const gain = 0.89 / peak;
  return { rate, samples: out.map((s) => s * gain) };
}

function encode({ rate, samples }) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write("WAVEfmt ", 8, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24);
  buffer.writeUInt32LE(rate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((s, i) => buffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(s * 32767))), 44 + i * 2));
  return buffer;
}

await mkdir(OUT, { recursive: true });
for (const [source, target, seconds, fade] of SAMPLES) {
  const response = await fetch(BASE + source.split("/").map(encodeURIComponent).join("/"));
  if (!response.ok) throw new Error(`${source}: ${response.status}`);
  const wav = encode(shape(decode(Buffer.from(await response.arrayBuffer())), seconds, fade));
  await writeFile(path.join(OUT, target), wav);
  console.log(`${target} ${Math.round(wav.length / 1024)} kB`);
}
