/** Grundtonen i ett ljudfönster och hur periodiskt fönstret är (0–1). */
export interface PitchReading {
  frequency: number;
  clarity: number;
}

export const MIN_FREQUENCY = 28;
const MAX_FREQUENCY = 1500;
/** En topp väljs om den når minst så här stor del av den högsta toppen (McLeod: k). */
const PEAK_THRESHOLD = 0.9;
/** Under den här klarheten räknas fönstret som brus. */
const MIN_CLARITY = 0.8;
/** Under den här RMS-nivån räknas fönstret som tyst (ungefär −60 dBFS). */
const MIN_RMS = 0.001;

/**
 * Grundtonen i `samples` med McLeod Pitch Method (NSDF), eller `null` när ingen ton hörs.
 */
export function detectPitch(samples: Float32Array, sampleRate: number): PitchReading | null {
  if (rms(samples) < MIN_RMS) return null;
  const maxLag = Math.min(Math.floor(sampleRate / MIN_FREQUENCY), samples.length - 1);
  const minLag = Math.floor(sampleRate / MAX_FREQUENCY);
  const nsdf = normalizedSquareDifference(samples, maxLag);

  const peaks = keyMaxima(nsdf, minLag);
  if (peaks.length === 0) return null;
  const highest = Math.max(...peaks.map((lag) => nsdf[lag]));
  const chosen = peaks.find((lag) => nsdf[lag] >= PEAK_THRESHOLD * highest)!;

  const { position, value } = parabolicPeak(nsdf, chosen);
  if (value < MIN_CLARITY) return null;
  return { frequency: sampleRate / position, clarity: value };
}

function rms(x: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < x.length; i++) sum += x[i] * x[i];
  return Math.sqrt(sum / x.length);
}

/** NSDF(τ) = 2·r(τ) / m(τ), med autokorrelationen r via FFT och m via kumulativa kvadratsummor. */
function normalizedSquareDifference(x: Float32Array, maxLag: number): Float64Array {
  const n = x.length;
  const acf = autocorrelation(x);
  const squares = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) squares[i + 1] = squares[i] + x[i] * x[i];

  const out = new Float64Array(maxLag + 1);
  for (let lag = 0; lag <= maxLag; lag++) {
    const energy = squares[n - lag] + squares[n] - squares[lag];
    out[lag] = energy > 0 ? (2 * acf[lag]) / energy : 0;
  }
  return out;
}

/** Linjär (inte cirkulär) autokorrelation via FFT med nollutfyllnad till minst 2n. */
function autocorrelation(x: Float32Array): Float64Array {
  let size = 1;
  while (size < 2 * x.length) size *= 2;
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  re.set(x);
  fft(re, im, false);
  for (let i = 0; i < size; i++) {
    re[i] = re[i] * re[i] + im[i] * im[i];
    im[i] = 0;
  }
  fft(re, im, true);
  return re;
}

/** Radix-2 FFT på plats. Den inversa skalas med 1/n. */
function fft(re: Float64Array, im: Float64Array, inverse: boolean): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len *= 2) {
    const angle = ((inverse ? 2 : -2) * Math.PI) / len;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);
    for (let start = 0; start < n; start += len) {
      let curRe = 1;
      let curIm = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = start + k;
        const b = a + len / 2;
        const tRe = re[b] * curRe - im[b] * curIm;
        const tIm = re[b] * curIm + im[b] * curRe;
        re[b] = re[a] - tRe;
        im[b] = im[a] - tIm;
        re[a] += tRe;
        im[a] += tIm;
        const nextRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) re[i] /= n;
}

/** Den högsta punkten i varje positivt område efter första nollgenomgången. */
function keyMaxima(nsdf: Float64Array, minLag: number): number[] {
  const peaks: number[] = [];
  let lag = 1;
  while (lag < nsdf.length && nsdf[lag] > 0) lag++;
  while (lag < nsdf.length) {
    while (lag < nsdf.length && nsdf[lag] <= 0) lag++;
    let best = -1;
    while (lag < nsdf.length && nsdf[lag] > 0) {
      if (best < 0 || nsdf[lag] > nsdf[best]) best = lag;
      lag++;
    }
    if (best >= minLag && best > 0 && best < nsdf.length - 1) peaks.push(best);
  }
  return peaks;
}

function parabolicPeak(y: Float64Array, i: number): { position: number; value: number } {
  const a = y[i - 1];
  const b = y[i];
  const c = y[i + 1];
  const denominator = a - 2 * b + c;
  if (denominator === 0) return { position: i, value: b };
  const shift = (0.5 * (a - c)) / denominator;
  return { position: i + shift, value: b - 0.25 * (a - c) * shift };
}
