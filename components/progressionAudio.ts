/**
 * Ljudlagret för Ackordföljden: spelar upp en uppspelningsplan med Tone.js (ADR 0005). Tone.js och
 * samplingarna laddas först när `createProgressionAudio` anropas, alltså vid Play. Lagret räknar
 * inget själv; det som spelas avgörs av planen i `lib/progressionPlayback.ts`.
 */

import { withBasePath } from "@/lib/basePath";
import type { Position } from "@/lib/progression";
import type { CountIn, DrumHit, Instrument, NoteEvent, PlaybackPlan } from "@/lib/progressionPlayback";

type ToneModule = typeof import("tone");

/** Det som spelas: planen och hur länge ett Taktslag varar i sekunder. */
export interface Playback {
  plan: PlaybackPlan;
  pulseSeconds: number;
}

export interface PlayOptions {
  /** Inräkningen, eller `null` utan inräkning. */
  countIn: CountIn | null;
  /** Får platsen för det Ackord som klingar, eller `null` när inget klingar. */
  onChord: (position: Position | null) => void;
}

export interface ProgressionAudio {
  /** Spelar planen i loop från början, efter inräkningen om den finns. */
  play(playback: Playback, options: PlayOptions): void;
  /** Byter plan och tempo under uppspelningen, utan att börja om. */
  update(playback: Playback): void;
  stop(): void;
  /** Stänger av och sätter på ett Instrument, även under uppspelningen. */
  setMuted(instrument: Instrument, muted: boolean): void;
  /** Stoppar och tar bort ljudlagrets noder. */
  dispose(): void;
}

const SOUNDS = withBasePath("/sounds/progression/");
const DRUM_NOTES = { kick: "C1", snare: "D1", hihat: "F#1" } as const;

/**
 * Laddar Tone.js och samplingarna. `context` ska vara skapad och startad i klickets händelse,
 * eftersom webbläsare (särskilt Safari på iOS) annars inte släpper fram något ljud.
 */
export async function createProgressionAudio(context: AudioContext): Promise<ProgressionAudio> {
  const Tone: ToneModule = await import("tone");
  Tone.setContext(context);
  const transport = Tone.getTransport();
  const draw = Tone.getDraw();

  const channels: Record<Instrument, InstanceType<ToneModule["Channel"]>> = {
    drums: new Tone.Channel({ volume: -4 }).toDestination(),
    bass: new Tone.Channel({ volume: -6 }).toDestination(),
    piano: new Tone.Channel({ volume: -8 }).toDestination(),
    pad: new Tone.Channel({ volume: -20 }).toDestination(),
  };
  const drums = new Tone.Sampler({
    urls: { [DRUM_NOTES.kick]: "kick.wav", [DRUM_NOTES.snare]: "snare.wav", [DRUM_NOTES.hihat]: "hihat.wav" },
    baseUrl: SOUNDS,
  }).connect(channels.drums);
  const piano = new Tone.Sampler({
    urls: { C3: "piano-C3.wav", E3: "piano-E3.wav", "G#3": "piano-Gs3.wav", C4: "piano-C4.wav", E4: "piano-E4.wav", "G#4": "piano-Gs4.wav", C5: "piano-C5.wav", E5: "piano-E5.wav" },
    baseUrl: SOUNDS,
    release: 0.4,
  }).connect(channels.piano);
  const bass = new Tone.MonoSynth({
    oscillator: { type: "sawtooth" },
    filter: { type: "lowpass", Q: 1 },
    envelope: { attack: 0.005, decay: 0.3, sustain: 0.7, release: 0.08 },
    filterEnvelope: { attack: 0.005, decay: 0.25, sustain: 0.3, release: 0.1, baseFrequency: 90, octaves: 2.5 },
  }).connect(channels.bass);
  const padFilter = new Tone.Filter({ type: "lowpass", frequency: 1400 }).connect(channels.pad);
  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fatsawtooth", count: 3, spread: 24 },
    envelope: { attack: 0.5, decay: 0.4, sustain: 0.8, release: 1.2 },
  }).connect(padFilter);
  const nodes = [drums, piano, bass, pad, padFilter, ...Object.values(channels)];

  let countIn: PlayOptions["countIn"] = null;
  let onChord: PlayOptions["onChord"] = () => {};
  let plan: PlaybackPlan | null = null;

  function stop() {
    transport.stop();
    transport.cancel(0);
    draw.cancel(0);
    bass.triggerRelease();
    pad.releaseAll();
    piano.releaseAll();
    onChord(null);
  }

  function dispose() {
    stop();
    nodes.forEach((node) => node.dispose());
  }

  try {
    await Tone.loaded();
  } catch (error) {
    nodes.forEach((node) => node.dispose());
    throw error;
  }

  const ticks = (pulses: number) => `${Math.round(pulses * transport.PPQ)}i`;
  const noteName = (midi: number) => Tone.Frequency(midi, "midi").toNote();
  const offset = () => countIn?.length ?? 0;

  /** Det Ackord som klingar där transporten står nu, eller `null`. */
  function soundingNow(): Position | null {
    const pulse = transport.ticks / transport.PPQ - offset();
    return plan?.chords.find((chord) => chord.start <= pulse && pulse < chord.end)?.position ?? null;
  }

  /** Schemalägger inräkningen och planen efter den. Det som redan var schemalagt tas bort. */
  function schedule(playback: Playback) {
    transport.cancel(0);
    draw.cancel(0);
    plan = playback.plan;
    const start = offset();
    // Ett Taktslag är en fjärdedel för Tone.js, så att tempot kan ändras utan att planen räknas om.
    transport.bpm.value = 60 / playback.pulseSeconds;
    transport.loopStart = ticks(start);
    transport.loopEnd = ticks(start + Math.max(plan.length, 1));
    transport.loop = true;

    const hit = ({ time, drum, velocity }: DrumHit, at: number) =>
      transport.schedule((t) => drums.triggerAttack(DRUM_NOTES[drum], t, velocity), ticks(at + time));
    countIn?.hits.forEach((h) => hit(h, 0));
    plan.drums.forEach((h) => hit(h, start));

    const seconds = (pulses: number) => pulses * (60 / transport.bpm.value);
    const scheduleNotes = (events: readonly NoteEvent[], trigger: (notes: string[], duration: number, t: number) => void) =>
      events.forEach(({ time, duration, notes }) =>
        transport.schedule((t) => trigger(notes.map(noteName), seconds(duration) * 0.95, t), ticks(start + time)),
      );
    scheduleNotes(plan.bass, (notes, duration, t) => bass.triggerAttackRelease(notes[0], duration, t, 0.8));
    scheduleNotes(plan.piano, (notes, duration, t) => piano.triggerAttackRelease(notes, duration, t, 0.6));
    scheduleNotes(plan.pad, (notes, duration, t) => pad.triggerAttackRelease(notes, duration, t, 0.5));

    // Det klingande Ackordet: vid loopens början det som står där, annars inget, och sedan varje Ackord.
    const first = plan.chords[0];
    const atStart = first?.start === 0 ? first.position : null;
    transport.schedule((t) => draw.schedule(() => onChord(atStart), t), ticks(start));
    for (const chord of plan.chords) {
      if (chord.start > 0) transport.schedule((t) => draw.schedule(() => onChord(chord.position), t), ticks(start + chord.start));
      // Vid en Tystnad klingar inget Ackord förrän nästa börjar.
      const silenced = chord.end < plan.length && !plan.chords.some((next) => next.start === chord.end);
      if (silenced) transport.schedule((t) => draw.schedule(() => onChord(null), t), ticks(start + chord.end));
    }
  }

  return {
    play(playback, options) {
      transport.stop();
      ({ countIn, onChord } = options);
      schedule(playback);
      transport.position = 0;
      transport.start();
    },
    update(playback) {
      // Positionen ligger kvar, så musiken fortsätter där den var. Efter inräkningen går loopen
      // tillbaka till planens början och inte till inräkningen.
      if (transport.state !== "started") return;
      schedule(playback);
      onChord(soundingNow());
    },
    stop,
    setMuted(instrument, muted) {
      channels[instrument].mute = muted;
    },
    dispose,
  };
}
