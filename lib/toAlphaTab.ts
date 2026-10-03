import { model, platform, Settings, StaveProfile, TabRhythmMode } from "@coderline/alphatab";
import type { Cursor } from "./editor";
import type { Beat, BendTarget, Duration, Score, Track, ViewMode } from "./score";
import { findTuningPreset, STANDARD_TUNING_NAME } from "./tuning";

// Översätter Partiturmodellen till alphaTabs modell för rendering och uppspelning (ADR 0001).

/**
 * Vilka stavar varje Vy-läge ritar. När notsystemet saknas ritar alphaTab rytmskaft i
 * tabulaturen (se `configureStaves`), vilket ger Rytmtab.
 */
const STAVES: Record<ViewMode, { standardNotation: boolean; tablature: boolean }> = {
  scoreAndTab: { standardNotation: true, tablature: true },
  scoreOnly: { standardNotation: true, tablature: false },
  rhythmTab: { standardNotation: false, tablature: true },
};

const DURATIONS: Record<Duration, model.Duration> = {
  1: model.Duration.Whole,
  2: model.Duration.Half,
  4: model.Duration.Quarter,
  8: model.Duration.Eighth,
  16: model.Duration.Sixteenth,
  32: model.Duration.ThirtySecond,
};

/** General MIDI-programmet (nollräknat) för stålsträngad akustisk gitarr. */
const GUITAR_PROGRAM = 25;

/** MIDI-kanal 10 (index 9) är reserverad för trummor och hoppas över. */
const DRUM_CHANNEL = 9;

/** Den n:te MIDI-kanalen som inte är trumkanalen. */
function channel(n: number): number {
  return n < DRUM_CHANNEL ? n : n + 1;
}

/**
 * De visningsinställningar som översättarens modell förutsätter: stavarna styrs av varje
 * stav, alltså av Vy-läget, och tabulaturen får rytmskaft när notsystemet saknas.
 */
export function configureStaves(settings: Settings): void {
  settings.display.staveProfile = StaveProfile.Default;
  settings.notation.rhythmMode = TabRhythmMode.Automatic;
}

export function toAlphaTab(score: Score): model.Score {
  const result = new model.Score();
  result.title = score.metadata.title;
  result.subTitle = score.metadata.subtitle;
  result.artist = score.metadata.artist;
  result.tab = score.metadata.tabbedBy;
  // alphaTab döljer "Tabbed by" som standard. Tom rad utelämnas ändå.
  result.style = new model.ScoreStyle();
  result.style.headerAndFooter.set(
    model.ScoreSubElement.Transcriber,
    new model.HeaderFooterStyle("Tabbed by %TABBER%", true, platform.TextAlign.Right),
  );

  const barCount = Math.max(...score.tracks.map((t) => t.bars.length));
  let timeSignature = score.timeSignature;
  for (let i = 0; i < barCount; i++) {
    // Byten och repriser är lika i alla Spår, så de läses från det första Spår som har Takten
    const bar = score.tracks.map((t) => t.bars[i]).find((b) => b !== undefined)!;
    const masterBar = new model.MasterBar();
    timeSignature = bar.timeSignature ?? timeSignature;
    masterBar.timeSignatureNumerator = timeSignature.beats;
    masterBar.timeSignatureDenominator = timeSignature.beatValue;
    // alphaTab läser Partiturets tempo från tempomarkeringen i första Takten
    const tempo = i === 0 ? score.tempo : bar.tempo;
    if (tempo !== undefined) masterBar.tempoAutomations.push(model.Automation.buildTempoAutomation(false, 0, tempo, 2));
    masterBar.isRepeatStart = bar.repeatStart === true;
    // alphaTab räknar varven på samma sätt: ett reprisslut har minst två
    if (bar.repeatEnd) masterBar.repeatCount = bar.repeatEnd;
    result.addMasterBar(masterBar);
  }
  score.tracks.forEach((track, index) => result.addTrack(toTrack(track, index, score.viewMode)));

  result.finish(new Settings());
  return result;
}

/** Slaget i alphaTabs modell vid Markörens position, eller `null` om det inte finns. */
export function beatAt(rendered: model.Score, cursor: Cursor): model.Beat | null {
  const staff = rendered.tracks[cursor.track]?.staves[0];
  return staff?.bars[cursor.bar]?.voices[0]?.beats[cursor.beat] ?? null;
}

/** Tonen i alphaTabs modell på Markörens sträng, eller `null` om strängen är tom där. */
export function noteAt(rendered: model.Score, cursor: Cursor): model.Note | null {
  const beat = beatAt(rendered, cursor);
  if (!beat) return null;
  const string = alphaTabString(cursor.string, beat.voice.bar.staff.tuning.length);
  return beat.notes.find((n) => n.string === string) ?? null;
}

/** alphaTab numrerar strängar från den grövsta, vi från den ljusaste. */
function alphaTabString(string: number, stringCount: number): number {
  return stringCount - string + 1;
}

function toTrack(track: Track, index: number, viewMode: ViewMode): model.Track {
  const result = new model.Track();
  result.playbackInfo.program = GUITAR_PROGRAM;
  // Två kanaler per Spår: alphaTab spelar vissa effekter på den andra
  const [primary, secondary] = [2 * index, 2 * index + 1].map(channel);
  result.playbackInfo.primaryChannel = primary;
  result.playbackInfo.secondaryChannel = secondary;
  const staff = new model.Staff();
  result.addStaff(staff);
  // Stämningen ritas i huvudet: med namn för förvalen och med strängarna utom för standardstämningen
  const name = findTuningPreset(track.tuning)?.name ?? "";
  staff.stringTuning = new model.Tuning(name, [...track.tuning], name === STANDARD_TUNING_NAME);
  // alphaTab lägger Capo till tonhöjden och visar banden relativt Capo, precis som modellen
  staff.capo = track.capo;
  staff.showStandardNotation = STAVES[viewMode].standardNotation;
  staff.showTablature = STAVES[viewMode].tablature;

  for (const bar of track.bars) {
    const alphaTabBar = new model.Bar();
    // Gitarr noteras i G-klav en oktav under klingande ton
    alphaTabBar.clef = model.Clef.G2;
    alphaTabBar.clefOttava = model.Ottavia._8vb;
    staff.addBar(alphaTabBar);
    const voice = new model.Voice();
    alphaTabBar.addVoice(voice);
    for (const beat of bar.beats) {
      voice.addBeat(toBeat(beat, track.tuning.length, staff));
    }
  }
  return result;
}

function toBeat(beat: Beat, stringCount: number, staff: model.Staff): model.Beat {
  const result = new model.Beat();
  if (beat.chordName) result.chordId = addChordName(staff, beat.chordName);
  // Anteckningen ritas som sångtext: under notsystemet, eller ovanför tabben när notsystemet saknas
  if (beat.annotation) result.lyrics = [beat.annotation];
  result.duration = DURATIONS[beat.duration];
  if (beat.dotted) result.dots = 1;
  if (beat.triplet) {
    result.tupletNumerator = 3;
    result.tupletDenominator = 2;
  }
  result.isEmpty = false;
  for (const note of beat.notes) {
    const alphaTabNote = new model.Note();
    alphaTabNote.string = alphaTabString(note.string, stringCount);
    alphaTabNote.fret = note.fret;
    // alphaTab hittar själv målet för hammer-on, pull-off och slide: nästa ton på samma sträng
    alphaTabNote.isHammerPullOrigin = note.hammerPull === true;
    if (note.slide) alphaTabNote.slideOutType = model.SlideOutType.Shift;
    if (note.bend) addBend(alphaTabNote, note.bend);
    alphaTabNote.isPalmMute = note.palmMute === true;
    result.addNote(alphaTabNote);
  }
  return result;
}

/**
 * alphaTab ritar ett Ackordnamn som ett ackord på staven, som slagen pekar på. Namnet blir id,
 * så att slag med samma Ackordnamn delar ackord. Inget greppdiagram, eftersom namnet inte tolkas.
 */
function addChordName(staff: model.Staff, name: string): string {
  if (!staff.getChord(name)) {
    const chord = new model.Chord();
    chord.name = name;
    chord.showDiagram = false;
    staff.addChord(name, chord);
  }
  return name;
}

/**
 * En bend från tonens band upp till målet, som nås halvvägs in i tonen och hålls resten av den.
 * alphaTab räknar i kvartstoner.
 */
function addBend(note: model.Note, semitones: BendTarget): void {
  note.bendType = model.BendType.Bend;
  note.addBendPoint(new model.BendPoint(0, 0));
  note.addBendPoint(new model.BendPoint(model.BendPoint.MaxPosition / 2, semitones * 2));
  note.addBendPoint(new model.BendPoint(model.BendPoint.MaxPosition, semitones * 2));
}
