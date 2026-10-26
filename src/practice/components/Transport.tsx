import { Play, Radio, RotateCcw, Square, Volume2 } from "lucide-react";
import type { CSSProperties } from "react";
import { formatChord } from "../../domain/music";
import type { Arrangement } from "../../domain/types";
import type { Position } from "./Chart";

export interface TransportProps {
  settings: Arrangement;
  playing: boolean;
  starting: boolean;
  tick: Position;
  symbol: string;
  bar: number;
  onToggle: () => void;
  onRestart: () => void;
  onChange: (patch: Partial<Arrangement>) => void;
}

export function Transport({
  settings,
  playing,
  starting,
  tick,
  symbol,
  bar,
  onToggle,
  onRestart,
  onChange,
}: TransportProps) {
  const active = playing || starting;
  return (
    <div className="transport-wrap">
      <div className="transport">
        <div className="transport-left">
          <button
            type="button"
            className={`play-button ${active ? "is-playing" : ""}`}
            aria-label={active ? "Stop band" : "Play band"}
            onClick={onToggle}
          >
            {active ? (
              <Square size={19} fill="currentColor" />
            ) : (
              <Play size={21} fill="currentColor" />
            )}
          </button>
          <div>
            <strong>
              {starting
                ? "Warming up…"
                : playing
                  ? tick.counting
                    ? "Here we go…"
                    : "Right in the pocket."
                  : "Ready when you are."}
            </strong>
            <span>
              {playing ? (
                tick.counting ? (
                  `Count in · ${tick.beat + 1} of 4`
                ) : (
                  `${formatChord(symbol)} · ${settings.bpm} bpm`
                )
              ) : (
                <>
                  Press play. Find your way. <kbd>space</kbd>
                </>
              )}
            </span>
          </div>
          <button
            type="button"
            className="icon-button restart"
            aria-label="Restart band"
            onClick={onRestart}
            disabled={starting}
          >
            <RotateCcw size={17} />
          </button>
        </div>
        <div className="transport-center">
          <div
            className="beat-lights"
            aria-label={playing ? `Beat ${tick.beat + 1}` : "Band stopped"}
          >
            {[0, 1, 2, 3].map((i) => (
              <span className={playing && tick.beat === i ? "lit" : ""} key={i}>
                {i + 1}
              </span>
            ))}
          </div>
          <span>
            {playing && !tick.counting
              ? `Bar ${bar + 1} / ${settings.chords.length}`
              : "4 beats to a bar"}
          </span>
        </div>
        <div className="transport-right">
          <label className="check-control">
            <input
              type="checkbox"
              checked={settings.countIn}
              disabled={active}
              onChange={(e) => onChange({ countIn: e.target.checked })}
            />{" "}
            Count-in
          </label>
          <button
            type="button"
            className={`metronome ${settings.metronome ? "enabled" : ""}`}
            aria-label="Toggle metronome"
            aria-pressed={settings.metronome}
            onClick={() => onChange({ metronome: !settings.metronome })}
          >
            <Radio size={17} />
          </button>
          <Volume2 size={17} />
          <input
            aria-label="Master volume"
            type="range"
            min="0"
            max="100"
            value={settings.master}
            onChange={(e) => onChange({ master: +e.target.value })}
            style={{ "--fill": `${settings.master}%` } as CSSProperties}
          />
        </div>
      </div>
    </div>
  );
}
