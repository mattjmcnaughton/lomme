import {
  AudioLines,
  Drum,
  Hand,
  KeyboardMusic,
  type LucideIcon,
  Minus,
  Plus,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { CSSProperties } from "react";
import { DRUM_PATTERNS, KEYS_PATTERNS } from "../../domain/music";
import type { Arrangement, Instrument, Setup } from "../../domain/types";

export interface BandControlsProps {
  settings: Arrangement;
  onChange: (patch: Partial<Arrangement>) => void;
  onMix: (name: Instrument, patch: Partial<Setup["mix"][Instrument]>) => void;
  keysActive: boolean;
  onTap: () => void;
  tapCount: number;
}

export function BandControls({
  settings,
  onChange,
  onMix,
  keysActive,
  onTap,
  tapCount,
}: BandControlsProps) {
  const channels: [Instrument, LucideIcon, string, string][] = [
    ["drums", Drum, "Drums", "808-style kick, snare & hats"],
    [
      "bass",
      AudioLines,
      "Bass",
      settings.bassMotion === "roots"
        ? "Just the roots. Right on time."
        : "A little movement between changes",
    ],
    ["keys", KeyboardMusic, "Keys", "A little harmonic company"],
  ];
  return (
    <section className="band-section" aria-labelledby="band-title">
      <div className="section-heading">
        <h3 id="band-title">Make it yours</h3>
        <span className="subtle">Three players. You’re the fourth.</span>
      </div>
      <div className="band-controls">
        <div className="groove-controls">
          <div className="feel-control">
            <label htmlFor="groove">Drum groove</label>
            <select
              id="groove"
              value={settings.drumPattern}
              onChange={(e) => {
                const pattern = DRUM_PATTERNS.find((p) => p.id === e.target.value);
                if (pattern) onChange({ drumPattern: pattern.id, style: pattern.style });
              }}
            >
              {DRUM_PATTERNS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="tempo-control">
            <div className="tempo-row">
              <span>Tempo</span>
              <div>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Slower"
                  onClick={() => onChange({ bpm: Math.max(45, settings.bpm - 1) })}
                >
                  <Minus size={14} />
                </button>
                <output>
                  {settings.bpm}
                  <small>bpm</small>
                </output>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Faster"
                  onClick={() => onChange({ bpm: Math.min(180, settings.bpm + 1) })}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <input
              aria-label="Tempo"
              type="range"
              min="45"
              max="180"
              value={settings.bpm}
              onChange={(e) => onChange({ bpm: +e.target.value })}
              style={{ "--fill": `${((settings.bpm - 45) / 135) * 100}%` } as CSSProperties}
            />
          </div>
          <button
            type="button"
            className={`tap-button ${tapCount ? "tapped" : ""}`}
            onClick={onTap}
            aria-label="Tap for beat"
            title="Tap quarter notes to set the tempo"
          >
            <Hand size={15} /> Tap for beat{" "}
            <span aria-live="polite">
              {tapCount === 1
                ? "Keep tapping…"
                : tapCount > 1
                  ? `${settings.bpm} bpm`
                  : "Set your tempo"}
            </span>
          </button>
          <div className="bass-motion">
            <label htmlFor="bass-motion">Bass line</label>
            <select
              id="bass-motion"
              value={settings.bassMotion}
              onChange={(e) =>
                onChange({ bassMotion: e.target.value === "moving" ? "moving" : "roots" })
              }
            >
              <option value="roots">Chord roots</option>
              <option value="moving">Moving line</option>
            </select>
          </div>
          <div className="feel-control keys-pattern">
            <label htmlFor="keys-pattern">Keyboard rhythm</label>
            <select
              id="keys-pattern"
              value={settings.keysPattern}
              onChange={(e) => onChange({ keysPattern: e.target.value })}
            >
              {KEYS_PATTERNS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mixer">
          {channels.map(([name, Icon, title, description]) => {
            const muted = settings.mix[name].muted || (name === "keys" && !keysActive);
            return (
              <div className={`mixer-channel ${muted ? "is-muted" : ""}`} key={name}>
                <div className="channel-top">
                  <span className={`instrument-icon ${name}`}>
                    <Icon size={21} strokeWidth={1.5} />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <span>
                      {name === "keys" && settings.mode === "comp"
                        ? "Your guitar has this part"
                        : description}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="mute-button"
                    aria-label={`${settings.mix[name].muted ? "Unmute" : "Mute"} ${title.toLowerCase()}`}
                    aria-pressed={settings.mix[name].muted}
                    onClick={() => onMix(name, { muted: !settings.mix[name].muted })}
                  >
                    {settings.mix[name].muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                </div>
                <div className="channel-slider">
                  <input
                    aria-label={`${title} volume`}
                    type="range"
                    min="0"
                    max="100"
                    value={settings.mix[name].volume}
                    style={{ "--fill": `${settings.mix[name].volume}%` } as CSSProperties}
                    onChange={(e) => onMix(name, { volume: +e.target.value })}
                  />
                  <span>{settings.mix[name].volume}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
