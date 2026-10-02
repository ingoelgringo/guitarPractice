import { model, platform, Settings, StaveProfile, TabRhythmMode } from "@coderline/alphatab";
import type { Beat, Duration, Score, Track, ViewMode } from "./score";
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
  for (let i = 0; i < barCount; i++) {
    const masterBar = new model.MasterBar();
    masterBar.timeSignatureNumerator = score.timeSignature.beats;
    masterBar.timeSignatureDenominator = score.timeSignature.beatValue;
    // alphaTab läser Partiturets tempo från tempomarkeringen i första Takten
    if (i === 0) masterBar.tempoAutomations.push(model.Automation.buildTempoAutomation(false, 0, score.tempo, 2));
    result.addMasterBar(masterBar);
  }
  for (const track of score.tracks) {
    result.addTrack(toTrack(track, score.viewMode));
  }

  result.finish(new Settings());
  return result;
}

function toTrack(track: Track, viewMode: ViewMode): model.Track {
  const result = new model.Track();
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
      voice.addBeat(toBeat(beat, track.tuning.length));
    }
  }
  return result;
}

function toBeat(beat: Beat, stringCount: number): model.Beat {
  const result = new model.Beat();
  result.duration = DURATIONS[beat.duration];
  if (beat.dotted) result.dots = 1;
  if (beat.triplet) {
    result.tupletNumerator = 3;
    result.tupletDenominator = 2;
  }
  result.isEmpty = false;
  for (const note of beat.notes) {
    const alphaTabNote = new model.Note();
    // alphaTab numrerar strängar från den grövsta, vi från den ljusaste
    alphaTabNote.string = stringCount - note.string + 1;
    alphaTabNote.fret = note.fret;
    result.addNote(alphaTabNote);
  }
  return result;
}
