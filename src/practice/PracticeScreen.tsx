import { HelpCircle, Minus, Music2, Plus, X } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { NOTES, chordAt, formatChord, keysPlaying, tapTempo, transposeBar } from "../domain/music";
import { PRESETS } from "../domain/presets";
import { exportTrack, validateTrack } from "../domain/tracks";
import type { Arrangement, Instrument, Setup } from "../domain/types";
import { BandControls } from "./components/BandControls";
import { Chart } from "./components/Chart";
import { Fretboard } from "./components/Fretboard";
import { Library } from "./components/Library";
import { Transport } from "./components/Transport";
import { DetailsDialog, HelpDialog, ProgressionDialog, PromptDialog, errorText } from "./dialogs";
import { usePlayback } from "./usePlayback";
import { usePracticeSession } from "./usePracticeSession";

export default function PracticeScreen() {
  const { settings, setSettings, savedTracks, saving, remember, message, setMessage } =
    usePracticeSession();
  const playback = usePlayback(settings, setMessage);
  const { playing, starting, tick, setTick, stop, toggle, restart } = playback;
  const [dialog, setDialog] = useState<"details" | "progression" | "prompt" | "help" | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const taps = useRef<number[]>([]);
  const tapReset = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [tapCount, setTapCount] = useState(0);
  const current = useRef(settings);
  current.current = settings;
  const library = [...PRESETS, ...savedTracks];
  const bar = Math.min(tick.bar, settings.chords.length - 1);
  const symbol = chordAt(settings.chords[bar], tick.beat);

  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      const target = event.target;
      if (
        event.code !== "Space" ||
        dialog ||
        (target instanceof HTMLElement &&
          (/INPUT|TEXTAREA|SELECT|BUTTON|A/.test(target.tagName) || target.isContentEditable))
      )
        return;
      event.preventDefault();
      void toggle();
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [toggle, dialog]);
  useEffect(() => () => clearTimeout(tapReset.current), []);

  function change(patch: Partial<Arrangement>) {
    setSettings((old) => ({ ...old, ...patch }));
  }
  function changeChart(patch: Partial<Arrangement>) {
    stop();
    setMessage("");
    change(patch);
  }
  function select(track: Arrangement) {
    stop();
    setMessage("");
    setSettings(structuredClone(track));
  }
  function setMix(name: Instrument, patch: Partial<Setup["mix"][Instrument]>) {
    setSettings((old) => ({ ...old, mix: { ...old.mix, [name]: { ...old.mix[name], ...patch } } }));
  }
  async function save(copy = false, snapshot = settings) {
    const saved = await remember(snapshot, copy);
    // An acknowledgement applies to the saved snapshot, not later musical edits.
    if (current.current.id === snapshot.id) {
      setSettings((old) => ({
        ...old,
        id: saved.id,
        category: saved.category,
        name: saved.name,
        description: saved.description,
        metadata: saved.metadata,
      }));
    }
    setMessage(
      copy ? "A new copy is saved in your library." : "Arrangement saved to your library.",
    );
  }
  async function saveFromToolbar(copy: boolean) {
    try {
      await save(copy);
    } catch (error) {
      setMessage(errorText(error));
    }
  }
  async function loadTrack(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 65536) throw new Error("Track files must be smaller than 64 KB.");
      const validated = validateTrack(JSON.parse(await file.text()));
      const saved = await remember(validated, true);
      select(saved);
      setMessage(`Loaded “${saved.name}”. Your band is ready.`);
    } catch (error) {
      setMessage(
        error instanceof SyntaxError
          ? "That file isn’t valid JSON. Choose a Lomme track file."
          : errorText(error),
      );
    }
  }
  function exportFile() {
    const blob = new Blob([JSON.stringify(exportTrack(settings), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${settings.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "lomme"}.pocket.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function tap() {
    const result = tapTempo(taps.current, performance.now());
    taps.current = result.taps;
    setTapCount(result.taps.length);
    if (result.bpm !== null) change({ bpm: result.bpm });
    clearTimeout(tapReset.current);
    tapReset.current = setTimeout(() => setTapCount(0), 2000);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href={import.meta.env.BASE_URL} aria-label="Lomme home">
          <span className="brand-mark">
            <span />
          </span>
          lomme<span className="brand-dot">.</span>
        </a>
        <span className="tagline">A little band. A lot of possibility.</span>
        <div className="header-right">
          <span className="local-status">
            <i /> All sound, no cloud
          </span>
          <button
            type="button"
            className="icon-button"
            aria-label="How to use Lomme"
            onClick={() => setDialog("help")}
          >
            <HelpCircle size={19} />
          </button>
        </div>
      </header>
      <div className="workspace">
        <aside className="sidebar">
          <div className="sidebar-intro">
            <span className="small-label">Your practice room</span>
            <h1>
              Find your
              <br />
              pocket.
            </h1>
            <p>
              Less setting up.
              <br />
              More getting lost in it.
            </p>
          </div>
          <Library
            library={library}
            selectedId={settings.id}
            onSelect={select}
            onLucky={() => {
              const choices = library.filter((track) => track.id !== settings.id);
              select(choices[Math.floor(Math.random() * choices.length)]);
            }}
          />
          <div className="sidebar-bottom">
            <span className="tiny-pocket" /> Made for the long way home.
          </div>
        </aside>
        <main>
          <section className="session-heading">
            <div>
              <div className="session-eyebrow">
                <span className="session-light" /> Your band is{" "}
                {playing ? "in the pocket" : "ready"}
              </div>
              <h2>
                {settings.name}
                <span className="heading-dot">.</span>
              </h2>
              <p>{settings.description}</p>
              <div className="session-tags" aria-label="Track metadata">
                {[
                  ...(settings.metadata?.genres ?? []),
                  ...(settings.metadata?.tags ?? []).slice(0, 2),
                  settings.metadata?.difficulty,
                ]
                  .filter((tag): tag is string => Boolean(tag))
                  .map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
              </div>
            </div>
            <div className="key-control">
              <span>Playing in</span>
              <div>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Transpose down a semitone"
                  onClick={() =>
                    changeChart({
                      chords: settings.chords.map((chord) => transposeBar(chord, -1)),
                      key: (settings.key + 11) % 12,
                    })
                  }
                >
                  <Minus size={15} />
                </button>
                <strong>
                  {formatChord(NOTES[settings.key])}
                  <small>{settings.minor ? "minor" : "major"}</small>
                </strong>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Transpose up a semitone"
                  onClick={() =>
                    changeChart({
                      chords: settings.chords.map((chord) => transposeBar(chord, 1)),
                      key: (settings.key + 1) % 12,
                    })
                  }
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
          </section>
          <input
            ref={input}
            type="file"
            accept=".json,application/json"
            hidden
            aria-label="Lomme track file"
            onChange={loadTrack}
          />
          <Chart
            settings={settings}
            playing={playing}
            tick={tick}
            setTick={setTick}
            saving={saving}
            onEdit={() => setDialog("progression")}
            onDetails={() => setDialog("details")}
            onPrompt={() => setDialog("prompt")}
            onImport={() => input.current?.click()}
            onExport={exportFile}
            onSave={() => void saveFromToolbar(false)}
            onSaveCopy={() => void saveFromToolbar(true)}
          />
          <BandControls
            settings={settings}
            onChange={change}
            onMix={setMix}
            keysActive={keysPlaying(settings.mode, tick.absoluteBar) && !settings.mix.keys.muted}
            onTap={tap}
            tapCount={tapCount}
          />
          <Fretboard
            settings={settings}
            symbol={symbol}
            onShowScale={(showScale) => change({ showScale })}
          />
          <section className="practice-section" aria-labelledby="practice-title">
            <div className="section-heading">
              <h3 id="practice-title">Give yourself a little direction</h3>
              <Music2 size={17} />
            </div>
            <div className="mode-switch" aria-label="Practice mode">
              {(
                [
                  ["solo", "Solo"],
                  ["comp", "Comp"],
                  ["trade", "Trade fours"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  type="button"
                  key={mode}
                  aria-pressed={settings.mode === mode}
                  className={settings.mode === mode ? "selected" : ""}
                  onClick={() => change({ mode })}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="practice-tip">
              {settings.mode === "comp"
                ? "Keys step out. Lock in with the bass and drums, and make the harmony your own."
                : settings.mode === "trade"
                  ? "Four bars with keys. Four bars without. Listen, respond, and keep the conversation going."
                  : settings.tip}
            </p>
            <span className="mode-caption">
              <i />
              {settings.mode === "trade"
                ? keysPlaying("trade", tick.absoluteBar)
                  ? "Band’s four · listen or play along"
                  : "Your four · keys are giving you space"
                : settings.mode === "comp"
                  ? "Your guitar is the chord player"
                  : "The band’s got your back"}
            </span>
          </section>
          <footer className="main-footer">
            <span>Stay curious. Sound like yourself.</span>
            <span>
              Built with Tone.js <span className="footer-star">✳</span>
            </span>
          </footer>
        </main>
      </div>
      <Transport
        settings={settings}
        playing={playing}
        starting={starting}
        tick={tick}
        symbol={symbol}
        bar={bar}
        onToggle={() => void toggle()}
        onRestart={() => void restart()}
        onChange={change}
      />
      {message && (
        <div className="toast" role="alert">
          {message}
          <button type="button" aria-label="Dismiss message" onClick={() => setMessage("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {dialog === "progression" && (
        <ProgressionDialog
          settings={settings}
          onApply={changeChart}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "details" && (
        <DetailsDialog
          settings={settings}
          saving={saving}
          onSave={(snapshot) => save(false, snapshot)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "prompt" && <PromptDialog onClose={() => setDialog(null)} />}
      {dialog === "help" && <HelpDialog onClose={() => setDialog(null)} />}
    </div>
  );
}
