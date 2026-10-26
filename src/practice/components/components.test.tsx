import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { Arrangement } from "../../domain/types";
import { BandControls } from "./BandControls";
import { Chart, type Position } from "./Chart";
import { Fretboard } from "./Fretboard";
import { Library } from "./Library";
import { Transport } from "./Transport";

const arrangement: Arrangement = {
  id: "test",
  category: "Practice",
  name: "Evening",
  description: "A practice chart",
  chords: ["C", "Dm7+G7", "Cmaj7", "Am7", "Dm7", "G7", "C", "C", "F"],
  key: 0,
  minor: false,
  bpm: 90,
  drumPattern: "pocket",
  bassMotion: "roots",
  keysPattern: "auto",
  mode: "solo",
  mix: {
    drums: { volume: 78, muted: false },
    bass: { volume: 80, muted: false },
    keys: { volume: 75, muted: false },
  },
  master: 75,
  countIn: true,
  metronome: false,
  showScale: false,
  metadata: { genres: ["Jazz"], difficulty: "beginner" },
};
const stopped: Position = { bar: 0, beat: -1, absoluteBar: 0, counting: false };
const noop = () => {};

afterEach(cleanup);

describe("practice presentation", () => {
  it("filters the library and clears every filter before a lucky selection", () => {
    let lucky = 0;
    let selected: Arrangement | undefined;
    render(
      <Library
        library={[arrangement]}
        selectedId={arrangement.id}
        onSelect={(track) => {
          selected = track;
        }}
        onLucky={() => {
          lucky += 1;
        }}
      />,
    );
    fireEvent.change(screen.getByLabelText("Filter by genre"), { target: { value: "jazz" } });
    fireEvent.change(screen.getByLabelText("Filter by difficulty"), {
      target: { value: "advanced" },
    });
    fireEvent.change(screen.getByLabelText("Search tracks"), { target: { value: "missing" } });
    expect(screen.getByText("No tracks match.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "I'm feeling lucky" }));
    expect(lucky).toBe(1);
    expect(screen.getByLabelText("Search tracks")).toHaveValue("");
    expect(screen.getByLabelText("Filter by genre")).toHaveValue("");
    expect(screen.getByLabelText("Filter by difficulty")).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: /Evening/ }));
    expect(selected).toBe(arrangement);
  });

  it("pages the chart, selects bars, and preserves paired chord highlighting", () => {
    function Harness() {
      const [tick, setTick] = useState(stopped);
      const [playing, setPlaying] = useState(false);
      return (
        <>
          <Chart
            settings={arrangement}
            playing={playing}
            tick={tick}
            setTick={setTick}
            onEdit={noop}
            onDetails={noop}
            onPrompt={noop}
            onImport={noop}
            onExport={noop}
            onSave={noop}
            onSaveCopy={noop}
            saving={false}
          />
          <button
            type="button"
            onClick={() => {
              setTick({ ...stopped, bar: 1, beat: 2, eighth: 4 });
              setPlaying(true);
            }}
          >
            Start second half
          </button>
        </>
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Next 8 bars" }));
    expect(screen.getByRole("button", { name: "Bar 9: F" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByRole("button", { name: "Bar 1: C" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Previous 8 bars" }));
    fireEvent.click(screen.getByRole("button", { name: "Bar 2: Dm7+G7" }));
    expect(screen.getByRole("button", { name: "Bar 2: Dm7+G7" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Start second half" }));
    expect(screen.getByText("G7", { selector: ".sounding-chord" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bar 2: Dm7+G7" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next 8 bars" })).toBeDisabled();
  });

  it("keeps Stop available during pending start and locks count-in", () => {
    function Harness() {
      const [starting, setStarting] = useState(true);
      return (
        <Transport
          settings={arrangement}
          playing={false}
          starting={starting}
          tick={stopped}
          symbol="C"
          bar={0}
          onToggle={() => setStarting(false)}
          onRestart={noop}
          onChange={noop}
        />
      );
    }
    render(<Harness />);
    expect(screen.getByRole("checkbox", { name: "Count-in" })).toBeDisabled();
    const stop = screen.getByRole("button", { name: "Stop band" });
    expect(stop).toBeEnabled();
    fireEvent.click(stop);
    expect(screen.getByRole("button", { name: "Play band" })).toBeEnabled();
    expect(screen.getByRole("checkbox", { name: "Count-in" })).toBeEnabled();
  });

  it("controls tempo, groove and mix through patches without changing the source", () => {
    function Harness() {
      const [settings, setSettings] = useState(arrangement);
      return (
        <BandControls
          settings={settings}
          keysActive={true}
          onTap={noop}
          tapCount={0}
          onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
          onMix={(name, patch) =>
            setSettings((s) => ({ ...s, mix: { ...s.mix, [name]: { ...s.mix[name], ...patch } } }))
          }
        />
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Faster" }));
    expect(screen.getByRole("slider", { name: "Tempo" })).toHaveValue("91");
    fireEvent.change(screen.getByLabelText("Drum groove"), { target: { value: "swing" } });
    expect(screen.getByLabelText("Drum groove")).toHaveValue("swing");
    fireEvent.click(screen.getByRole("button", { name: "Mute bass" }));
    expect(screen.getByRole("button", { name: "Unmute bass" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(arrangement.bpm).toBe(90);
    expect(arrangement.mix.bass.muted).toBe(false);
  });

  it("renders all six strings and toggles the key scale separately from chord tones", () => {
    function Harness() {
      const [showScale, setShowScale] = useState(false);
      return (
        <Fretboard settings={{ ...arrangement, showScale }} symbol="C" onShowScale={setShowScale} />
      );
    }
    const { container } = render(<Harness />);
    expect(container.querySelectorAll(".guitar-string")).toHaveLength(6);
    expect(container.querySelectorAll(".fret")).toHaveLength(78);
    expect(container.querySelectorAll(".scale-note")).toHaveLength(0);
    fireEvent.click(screen.getByRole("checkbox", { name: "Show key scale" }));
    expect(container.querySelectorAll(".scale-note").length).toBeGreaterThan(0);
    expect(screen.getByRole("img")).toHaveAccessibleName(/Scale in C major/);
  });
});
