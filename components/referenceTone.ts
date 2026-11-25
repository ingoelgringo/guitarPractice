/**
 * Stämmarens referenston: spelar en frekvens med Tone.js (ADR 0005), så att man kan stämma på
 * gehör. Tone.js laddas först när `createReferenceTone` anropas. Service workern sparar filen i
 * förväg (se useTunerServiceWorker), så att tonen fungerar utan nät.
 */

type ToneModule = typeof import("tone");

/** Så länge tonen klingar innan den släpps, i sekunder. */
export const REFERENCE_TONE_SECONDS = 2.5;
/** Så länge tonen klingar ut efter att den har släppts, i sekunder. */
export const REFERENCE_RELEASE_SECONDS = 0.6;

export interface ReferenceTone {
  /** Spelar `frequency` i `REFERENCE_TONE_SECONDS`. En ton som redan klingar avbryts. */
  play(frequency: number): void;
  /** Släpper tonen direkt. */
  stop(): void;
  /** Stänger ljudet. */
  dispose(): void;
}

/** Förladdar Tone.js, så att filen finns i service workerns cache. */
export async function preloadReferenceTone(): Promise<void> {
  await import("tone");
}

/**
 * Laddar Tone.js. `context` ska vara skapad och startad i klickets händelse, eftersom webbläsare
 * (särskilt Safari på iOS) annars inte släpper fram något ljud.
 */
export async function createReferenceTone(context: AudioContext): Promise<ReferenceTone> {
  const Tone: ToneModule = await import("tone");
  // Tone.js skapar en egen kontext när modulen laddas. Den behövs inte, så den stängs.
  Tone.setContext(context, true);
  // Grundtonen och några övertoner, så att även de grövsta strängarna hörs i en mobilhögtalare.
  const synth = new Tone.Synth({
    oscillator: { type: "custom", partials: [1, 0.6, 0.35, 0.2, 0.1] },
    envelope: { attack: 0.01, decay: 0.4, sustain: 0.6, release: REFERENCE_RELEASE_SECONDS },
    volume: -8,
  }).toDestination();

  return {
    play(frequency) {
      const now = Tone.now();
      synth.triggerRelease(now);
      synth.triggerAttackRelease(frequency, REFERENCE_TONE_SECONDS, now + 0.01);
    },
    stop() {
      synth.triggerRelease(Tone.now());
    },
    dispose() {
      synth.dispose();
    },
  };
}
