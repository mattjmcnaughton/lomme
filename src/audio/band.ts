import * as Tone from "tone";
import {
  DRUM_PATTERNS,
  KEYS_PATTERNS,
  chordAt,
  keysPlaying,
  parseChord,
  voiceChord,
} from "../domain/music";
import type { Instrument, Setup } from "../domain/types";
import type { PlaybackEngine, Position } from "./playback";

export type { PlaybackEngine, PlaybackFactory, Position } from "./playback";

const instruments: Instrument[] = ["drums", "bass", "keys"];

export class Band implements PlaybackEngine {
  private step = 0;
  private voicing: number[] = [];
  private event: number | undefined;
  private generation = 0;
  private running = false;
  private disposed = false;
  private readonly limiter = new Tone.Limiter(-2).toDestination();
  private readonly master = new Tone.Gain(0.75).connect(this.limiter);
  private readonly channels: Record<Instrument, Tone.Gain> = {
    drums: new Tone.Gain(1).connect(this.master),
    bass: new Tone.Gain(1).connect(this.master),
    keys: new Tone.Gain(1).connect(this.master),
  };
  private readonly kick = new Tone.MembraneSynth({
    pitchDecay: 0.025,
    octaves: 5,
    envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.1 },
    volume: -5,
  }).connect(this.channels.drums);
  private readonly snareFilter = new Tone.Filter(1800, "highpass").connect(this.channels.drums);
  private readonly snare = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.001, decay: 0.12, sustain: 0 },
    volume: -13,
  }).connect(this.snareFilter);
  private readonly hatFilter = new Tone.Filter(6500, "highpass").connect(this.channels.drums);
  private readonly hat = new Tone.NoiseSynth({
    envelope: { attack: 0.001, decay: 0.035, sustain: 0 },
    volume: -23,
  }).connect(this.hatFilter);
  private readonly bass = new Tone.MonoSynth({
    oscillator: { type: "triangle" },
    filter: { Q: 1, frequency: 700, type: "lowpass" },
    envelope: { attack: 0.008, decay: 0.18, sustain: 0.2, release: 0.18 },
    filterEnvelope: {
      attack: 0.001,
      decay: 0.1,
      sustain: 0.1,
      baseFrequency: 180,
      octaves: 2,
    },
    volume: -10,
  }).connect(this.channels.bass);
  private readonly reverb = new Tone.Freeverb({
    roomSize: 0.45,
    dampening: 3200,
    wet: 0.18,
  }).connect(this.channels.keys);
  private readonly keys = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 3,
    modulationIndex: 1.4,
    oscillator: { type: "sine" },
    envelope: { attack: 0.006, decay: 1.2, sustain: 0.08, release: 0.65 },
    modulation: { type: "sine" },
    modulationEnvelope: {
      attack: 0.002,
      decay: 0.5,
      sustain: 0.05,
      release: 0.2,
    },
    volume: -17,
  }).connect(this.reverb);
  private readonly click = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.01 },
    volume: -17,
  }).connect(this.master);

  constructor(
    private readonly getSettings: () => Setup,
    private readonly onTick: (tick: Position) => void,
  ) {}

  async start(): Promise<void> {
    if (this.disposed) throw new Error("This band has been disposed.");
    this.stop();
    const generation = this.generation;
    await Tone.start();
    // Context resume is not cancellable. Its continuation must be.
    if (this.disposed || generation !== this.generation) return;
    this.running = true;
    this.update();
    const transport = Tone.getTransport();
    this.event = transport.scheduleRepeat((time) => {
      if (this.running && generation === this.generation) this.tick(time);
    }, "16n");
    transport.start("+0.08");
  }

  stop(): void {
    if (this.disposed) return;
    this.generation++;
    this.running = false;
    const transport = Tone.getTransport();
    transport.stop();
    if (this.event !== undefined) transport.clear(this.event);
    this.event = undefined;
    transport.position = 0;
    // Cancel overdue frames too, not just those beyond the audio look-ahead.
    Tone.getDraw().cancel(0);
    this.keys.releaseAll();
    this.bass.triggerRelease();
    this.step = 0;
    this.voicing = [];
  }

  update(): void {
    if (this.disposed) return;
    const settings = this.getSettings();
    Tone.getTransport().bpm.value = settings.bpm;
    for (const name of instruments) {
      const { volume, muted } = settings.mix[name];
      this.channels[name].gain.rampTo(muted ? 0 : volume / 100, 0.04);
    }
    this.master.gain.rampTo(settings.master / 100, 0.04);
  }

  dispose(): void {
    if (this.disposed) return;
    this.stop();
    this.disposed = true;
    for (const node of [
      this.kick,
      this.snare,
      this.hat,
      this.bass,
      this.keys,
      this.click,
      this.snareFilter,
      this.hatFilter,
      this.reverb,
      ...Object.values(this.channels),
      this.master,
      this.limiter,
    ])
      node.dispose();
  }

  private draw(position: Position, time: number): void {
    const generation = this.generation;
    Tone.getDraw().schedule(() => {
      if (this.running && !this.disposed && generation === this.generation) this.onTick(position);
    }, time);
  }

  private tick(time: number): void {
    const s = this.getSettings();
    const countSteps = s.countIn ? 16 : 0;
    if (this.step < countSteps) {
      const beat = Math.floor(this.step / 4);
      if (this.step % 4 === 0)
        this.click.triggerAttackRelease(beat === 0 ? "C6" : "G5", "32n", time, 0.6);
      this.draw({ counting: true, beat, bar: 0, absoluteBar: 0 }, time);
      this.step++;
      return;
    }
    const step = this.step - countSteps;
    const absoluteBar = Math.floor(step / 16);
    const bar = absoluteBar % s.chords.length;
    const sixteenth = step % 16;
    const eighth = Math.floor(sixteenth / 2);
    const beat = Math.floor(eighth / 2);
    const symbol = chordAt(s.chords[bar], beat);
    const chord = parseChord(symbol);
    const pattern = DRUM_PATTERNS.find((p) => p.id === s.drumPattern) || DRUM_PATTERNS[0];
    const quarter = 60 / s.bpm;
    const swing =
      pattern.style === "swing" ? quarter / 6 : pattern.style === "pocket" ? quarter * 0.045 : 0;
    const at = time + (eighth % 2 ? swing : 0);
    const velocity: Record<string, number> = { X: 0.85, x: 0.6, o: 0.28 };
    for (const lane of ["kick", "snare", "hat"] as const) {
      const hit = velocity[pattern[lane][sixteenth]];
      if (!hit) continue;
      if (lane === "kick") this.kick.triggerAttackRelease("C1", "16n", at, hit);
      else this[lane].triggerAttackRelease(lane === "hat" ? "32n" : "16n", at, hit);
    }
    if (sixteenth % 2 !== 0) {
      this.step++;
      return;
    }
    const chordChange = eighth === 0 || (eighth === 4 && s.chords[bar].includes("+"));
    if (chordChange) this.voicing = voiceChord(symbol, this.voicing);
    if (eighth % 2 === 0) {
      let interval = 0;
      const chordBeat = s.chords[bar].includes("+") ? beat % 2 : beat;
      if (s.bassMotion === "moving") interval = [0, 7, 12, 7][chordBeat];
      if (s.bassMotion === "moving" && pattern.style === "swing")
        interval = [
          0,
          chord.intervals[1],
          chord.intervals[2],
          chord.intervals[chord.intervals.length - 1],
        ][chordBeat];
      let midi = 36 + chord.root + interval;
      if (midi > 55) midi -= 12;
      this.bass.triggerAttackRelease(
        Tone.Frequency(midi, "midi").toFrequency(),
        quarter * 0.68,
        at,
        beat === 0 ? 0.85 : 0.65,
      );
    }
    const keyboard = KEYS_PATTERNS.find((p) => p.id === s.keysPattern) || KEYS_PATTERNS[0];
    const compSteps =
      keyboard.steps || (["bossa", "swing"].includes(pattern.style) ? [0, 3, 6] : [0, 3, 7]);
    if (keysPlaying(s.mode, absoluteBar) && (chordChange || compSteps.includes(eighth))) {
      const paired = s.chords[bar].includes("+");
      const notes =
        keyboard.id === "arpeggio"
          ? [this.voicing[(eighth % (paired ? 4 : 8)) % this.voicing.length]]
          : this.voicing;
      const duration =
        keyboard.id === "sustain"
          ? paired
            ? 1.8
            : 3.8
          : keyboard.id === "auto"
            ? chordChange
              ? 1.3
              : 0.55
            : 0.45;
      this.keys.triggerAttackRelease(
        notes.map((n) => Tone.Frequency(n, "midi").toFrequency()),
        quarter * duration,
        at,
        eighth === 0 ? 0.7 : 0.42,
      );
    }
    if (s.metronome && eighth % 2 === 0)
      this.click.triggerAttackRelease(beat === 0 ? "C6" : "G5", "32n", time, 0.35);
    this.draw({ counting: false, bar, beat, absoluteBar, eighth }, time);
    this.step++;
  }
}
