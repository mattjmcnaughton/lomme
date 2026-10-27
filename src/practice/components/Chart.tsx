import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  MessageSquareText,
  Pencil,
  Repeat2,
  Save,
  Tags,
  Upload,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { Position } from "../../audio/playback";
import { formatChord } from "../../domain/music";
import type { Arrangement } from "../../domain/types";

export type { Position } from "../../audio/playback";

export interface ChartProps {
  settings: Arrangement;
  playing: boolean;
  tick: Position;
  setTick: Dispatch<SetStateAction<Position>>;
  onEdit: () => void;
  onDetails: () => void;
  onPrompt: () => void;
  onImport: () => void;
  onExport: () => void;
  onSave: () => void;
  onSaveCopy: () => void;
  saving: boolean;
}

export function Chart({
  settings,
  playing,
  tick,
  setTick,
  onEdit,
  onDetails,
  onPrompt,
  onImport,
  onExport,
  onSave,
  onSaveCopy,
  saving,
}: ChartProps) {
  const bar = Math.min(tick.bar, settings.chords.length - 1);
  const pageStart = Math.floor(bar / 8) * 8;
  return (
    <section className="chart-section" aria-labelledby="changes-title">
      <div className="section-heading">
        <h3 id="changes-title">
          The changes <span>{settings.chords.length} bars, on repeat</span>
        </h3>
        <div className="chart-actions">
          <button type="button" className="text-button" onClick={onDetails}>
            <Tags size={13} /> Track details
          </button>
          <button
            type="button"
            className="text-button"
            onClick={onPrompt}
            title="Copy an arranging prompt for your own AI; no model calls inside Lomme"
          >
            <MessageSquareText size={13} /> Bring your own AI
          </button>
          <button
            type="button"
            className="text-button"
            onClick={onImport}
            title="Import a versioned .pocket.json arrangement"
          >
            <Upload size={13} /> Load track
          </button>
          <button type="button" className="text-button" onClick={onSave} disabled={saving}>
            <Save size={13} /> Save to library
          </button>
          <button type="button" className="text-button" onClick={onSaveCopy} disabled={saving}>
            <Copy size={13} /> Save a copy
          </button>
          <button
            type="button"
            className="text-button"
            onClick={onExport}
            title="Save this arrangement for later or share it for refinement"
          >
            <Download size={13} /> Export track
          </button>
          <button type="button" className="text-button" onClick={onEdit}>
            <Pencil size={13} /> Edit progression
          </button>
        </div>
      </div>
      <div className={`chord-grid ${settings.chords.length > 8 ? "many-chords" : ""}`}>
        {settings.chords.slice(pageStart, pageStart + 8).map((c, offset) => {
          const i = pageStart + offset;
          return (
            <button
              type="button"
              key={`${i}-${c}`}
              className={`chord-card ${i === bar ? "active" : ""}`}
              aria-label={`Bar ${i + 1}: ${c}`}
              aria-pressed={i === bar}
              disabled={playing}
              onClick={() => setTick((t) => ({ ...t, bar: i, beat: -1 }))}
            >
              <span className="bar-number">{String(i + 1).padStart(2, "0")}</span>
              <span
                className={`chord-symbol ${c.includes("+") ? "split-chord" : c.length > 5 ? "long-chord" : ""}`}
              >
                {c.split("+").map((part, partIndex) => (
                  <span
                    key={`${i}-${partIndex}-${part}`}
                    className={
                      i === bar &&
                      playing &&
                      (c.includes("+") ? (tick.beat >= 2 ? 1 : 0) === partIndex : true)
                        ? "sounding-chord"
                        : ""
                    }
                  >
                    {formatChord(part)}
                  </span>
                ))}
              </span>
              <span className="chord-bottom">
                {i === bar && playing
                  ? tick.counting
                    ? "Count in"
                    : "Playing now"
                  : c.includes("+")
                    ? "2 + 2 beats"
                    : "1 bar"}
                <span className="chord-beats">
                  {[0, 1, 2, 3].map((b) => (
                    <i key={b} className={i === bar && playing && b === tick.beat ? "lit" : ""} />
                  ))}
                </span>
              </span>
              {i === bar && playing && !tick.counting && (
                <span
                  className="bar-progress"
                  style={{ width: `${(((tick.eighth ?? 0) + 1) / 8) * 100}%` }}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="chart-footer">
        <span>
          <Repeat2 size={13} />{" "}
          {playing
            ? tick.counting
              ? "One bar count-in. Get comfortable."
              : `Round ${Math.floor(tick.absoluteBar / settings.chords.length) + 1} · Bar ${bar + 1} of ${settings.chords.length}`
            : "One bar per card. Paired chords get two beats each."}
        </span>
        {settings.chords.length > 8 ? (
          <div className="chart-pages">
            <button
              type="button"
              className="icon-button"
              aria-label="Previous 8 bars"
              disabled={playing || pageStart === 0}
              onClick={() => setTick((t) => ({ ...t, bar: pageStart - 8, beat: -1 }))}
            >
              <ChevronLeft size={15} />
            </button>
            <span>
              Bars {pageStart + 1}–{Math.min(pageStart + 8, settings.chords.length)} of{" "}
              {settings.chords.length}
            </span>
            <button
              type="button"
              className="icon-button"
              aria-label="Next 8 bars"
              disabled={playing || pageStart + 8 >= settings.chords.length}
              onClick={() => setTick((t) => ({ ...t, bar: pageStart + 8, beat: -1 }))}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        ) : (
          <span className="time-signature">4 / 4</span>
        )}
      </div>
    </section>
  );
}
