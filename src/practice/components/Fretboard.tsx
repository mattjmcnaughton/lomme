import type { CSSProperties } from "react";
import { NOTES, chordTones, formatChord, parseChord, scaleTones } from "../../domain/music";
import type { Arrangement } from "../../domain/types";

const FRETS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export interface FretboardProps {
  settings: Arrangement;
  symbol: string;
  onShowScale: (show: boolean) => void;
}

export function Fretboard({ settings, symbol, onShowScale }: FretboardProps) {
  const { showScale } = settings;
  const chord = parseChord(symbol);
  const tones = chordTones(symbol);
  const scale = scaleTones(settings.key, settings.minor);
  return (
    <section className="fret-section" aria-labelledby="fret-title">
      <div className="section-heading">
        <h3 id="fret-title">
          Follow the harmony <span className="current-chord">{formatChord(symbol)}</span>
        </h3>
        <label className="scale-toggle">
          <input
            type="checkbox"
            checked={showScale}
            onChange={(e) => onShowScale(e.target.checked)}
          />
          <span className="switch" /> Show key scale
        </label>
      </div>
      <div className="fretboard-scroll">
        <div
          className="fretboard"
          role="img"
          aria-label={`Guitar fretboard, standard tuning, frets 0 to 12. ${symbol} chord tones: ${tones.map((n) => NOTES[n]).join(", ")}${showScale ? `. Scale in ${NOTES[settings.key]} ${settings.minor ? "minor" : "major"}` : ""}`}
        >
          {[64, 59, 55, 50, 45, 40].map((open, string) => (
            <div
              className="guitar-string"
              key={open}
              style={{ "--string-width": `${0.65 + string * 0.22}px` } as CSSProperties}
            >
              <span className="string-name">{["e", "B", "G", "D", "A", "E"][string]}</span>
              {FRETS.map((fret) => {
                const note = (open + fret) % 12;
                const isChord = tones.includes(note);
                const isScale = showScale && scale.includes(note);
                return (
                  <span key={`${open}-${fret}`} className={`fret ${fret === 0 ? "open-fret" : ""}`}>
                    <span
                      className={
                        isChord
                          ? `fret-note ${note === chord.root ? "root-note" : ""}`
                          : isScale
                            ? "scale-note"
                            : [3, 5, 7, 9, 12].includes(fret) && [2, 3].includes(string)
                              ? "fret-dot"
                              : ""
                      }
                    >
                      {isChord ? NOTES[note].replace("b", "♭") : ""}
                    </span>
                  </span>
                );
              })}
            </div>
          ))}
          <div className="fret-numbers">
            <span />
            {FRETS.map((i) => (
              <span key={`fret-${i}`}>{i || "○"}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="fret-footer">
        <div className="legend">
          <span>
            <i className="root-legend" /> Root
          </span>
          <span>
            <i className="chord-legend" /> Chord tone
          </span>
          {showScale && (
            <span>
              <i className="scale-legend" /> Key scale
            </span>
          )}
        </div>
        <span>Standard tuning · E A D G B e</span>
      </div>
    </section>
  );
}
