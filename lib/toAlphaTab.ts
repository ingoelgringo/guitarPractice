import { model, Settings } from "@coderline/alphatab";
import type { Beat, Duration, Score, Track } from "./score";

// Översätter Partiturmodellen till alphaTabs modell för rendering och uppspelning (ADR 0001).

const DURATIONS: Record<Duration, model.Duration> = {
  1: model.Duration.Whole,
  2: model.Duration.Half,
  4: model.Duration.Quarter,
  8: model.Duration.Eighth,
  16: model.Duration.Sixteenth,
  32: model.Duration.ThirtySecond,
};

export function toAlphaTab(score: Score): model.Score {
  const result = new model.Score();

  const barCount = Math.max(...score.tracks.map((t) => t.bars.length));
  for (let i = 0; i < barCount; i++) {
    const masterBar = new model.MasterBar();
    masterBar.timeSignatureNumerator = score.timeSignature.beats;
    masterBar.timeSignatureDenominator = score.timeSignature.beatValue;
    result.addMasterBar(masterBar);
  }
  for (const track of score.tracks) {
    result.addTrack(toTrack(track));
  }

  result.finish(new Settings());
  return result;
}

function toTrack(track: Track): model.Track {
  const result = new model.Track();
  const staff = new model.Staff();
  result.addStaff(staff);
  staff.stringTuning = new model.Tuning("", [...track.tuning], false);
  staff.showStandardNotation = true;
  staff.showTablature = true;

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
