import { Check, Copy, Headphones, MessageSquareText, Pencil, Play, Tags, X } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { NOTES, formatChord, parseProgression } from "../domain/music";
import { createTrackPrompt, exportTrack, validateTrack } from "../domain/tracks";
import type { Arrangement } from "../domain/types";

function Dialog({
  titleId,
  className = "",
  onClose,
  children,
}: {
  titleId: string;
  className?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <div className="modal-backdrop">
      <dialog
        ref={ref}
        className={className}
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          onClose();
        }}
      >
        <button
          type="button"
          className="modal-close icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        {children}
      </dialog>
    </div>
  );
}

export function ProgressionDialog({
  settings,
  onApply,
  onClose,
}: {
  settings: Arrangement;
  onApply: (patch: Partial<Arrangement>) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(settings.chords.join("  "));
  const [key, setKey] = useState(settings.key);
  const [minor, setMinor] = useState(settings.minor);
  const [error, setError] = useState("");
  return (
    <Dialog titleId="editor-title" onClose={onClose}>
      <span className="modal-icon">
        <Pencil size={23} />
      </span>
      <h2 id="editor-title">Write your changes.</h2>
      <p>
        Separate bars with spaces, commas, or |. Join two chords with + to give each two beats:
        Dm7+G7 Cmaj7.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          try {
            onApply({ chords: parseProgression(draft), key, minor });
            onClose();
          } catch (failure) {
            setError(errorText(failure));
          }
        }}
      >
        <label htmlFor="chord-input">Your progression</label>
        <textarea
          id="chord-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          aria-describedby="chord-help"
        />
        <p id="chord-help" className="input-help">
          Up to 64 bars · Try m, 7, maj7, m7, 6, m6, 9, maj9, m9, sus4, 7sus4, dim, dim7, m7b5.
          Sharps and flats welcome.
        </p>
        <div className="editor-key">
          <label htmlFor="key-select">Home key</label>
          <select id="key-select" value={key} onChange={(e) => setKey(+e.target.value)}>
            {NOTES.map((note, index) => (
              <option key={note} value={index}>
                {formatChord(note)}
              </option>
            ))}
          </select>
          <select
            aria-label="Key tonality"
            value={minor ? "minor" : "major"}
            onChange={(e) => setMinor(e.target.value === "minor")}
          >
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </select>
        </div>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button className="primary-button" type="submit">
          <Check size={17} /> Use these changes
        </button>
      </form>
    </Dialog>
  );
}

export function DetailsDialog({
  settings,
  onSave,
  onClose,
  saving,
}: {
  settings: Arrangement;
  onSave: (snapshot: Arrangement) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState({
    name: settings.name,
    description: settings.description,
    genres: (settings.metadata?.genres ?? []).join(", "),
    moods: (settings.metadata?.moods ?? []).join(", "),
    tags: (settings.metadata?.tags ?? []).join(", "),
    difficulty: settings.metadata?.difficulty ?? "",
    author: settings.metadata?.author ?? "",
  });
  const [error, setError] = useState("");
  const labels = (text: string) => [
    ...new Set(
      text
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
  const field = (name: keyof typeof draft, label: string, placeholder = "") => (
    <label key={name} className={name === "name" || name === "tags" ? "full-field" : ""}>
      {label}
      <input
        required={name === "name"}
        maxLength={name === "name" || name === "author" ? 80 : undefined}
        value={draft[name]}
        placeholder={placeholder}
        onChange={(e) => setDraft((old) => ({ ...old, [name]: e.target.value }))}
      />
    </label>
  );
  return (
    <Dialog titleId="details-title" className="details-dialog" onClose={onClose}>
      <span className="modal-icon">
        <Tags size={23} />
      </span>
      <h2 id="details-title">Give it a little context.</h2>
      <p>
        Tag your session so you can find it again. These details travel with your exported file;
        they don’t change the sound.
      </p>
      <form
        className="details-form"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            const metadata = {
              genres: labels(draft.genres),
              moods: labels(draft.moods),
              tags: labels(draft.tags),
              ...(draft.difficulty ? { difficulty: draft.difficulty } : {}),
              ...(draft.author.trim() ? { author: draft.author.trim() } : {}),
            };
            const content = validateTrack({
              ...exportTrack(settings),
              name: draft.name.trim(),
              description: draft.description.trim(),
              metadata,
            });
            await onSave({ ...content, id: settings.id, category: settings.category });
            onClose();
          } catch (failure) {
            setError(errorText(failure));
          }
        }}
      >
        {field("name", "Track name")}
        <label className="full-field">
          Description
          <textarea
            required
            rows={2}
            maxLength={300}
            value={draft.description}
            onChange={(e) => setDraft((old) => ({ ...old, description: e.target.value }))}
          />
        </label>
        {field("genres", "Genres", "Soul, R&B")}
        {field("moods", "Moods", "Warm, Mellow")}
        {field("tags", "Practice tags", "chord tones, rhythm")}
        <label>
          Difficulty
          <select
            value={draft.difficulty}
            onChange={(e) => setDraft((old) => ({ ...old, difficulty: e.target.value }))}
          >
            <option value="">Not specified</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>
        {field("author", "Author (optional)")}
        <p className="input-help full-field">
          Separate labels with commas · up to 12 per field, 40 characters each. Saving updates your
          personal arrangement; presets become personal copies. Names do not identify tracks.
        </p>
        {error && (
          <p role="alert" className="form-error full-field">
            {error}
          </p>
        )}
        <button className="primary-button full-field" type="submit" disabled={saving}>
          <Check size={17} /> {saving ? "Saving…" : "Save track details"}
        </button>
      </form>
    </Dialog>
  );
}

export function PromptDialog({ onClose }: { onClose: () => void }) {
  const [prompt] = useState(createTrackPrompt);
  const [status, setStatus] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  return (
    <Dialog titleId="prompt-title" className="prompt-dialog" onClose={onClose}>
      <span className="modal-icon">
        <MessageSquareText size={24} />
      </span>
      <span className="format-badge">LOOME TRACK · V2</span>
      <h2 id="prompt-title">Your AI. Your rhythm section.</h2>
      <p>
        Describe the track to an AI you already use. This prompt gives it Loome’s exact musical
        vocabulary and file format. No AI runs inside Loome.
      </p>
      <ol className="prompt-steps">
        <li>
          <strong>Copy the prompt.</strong> Paste it into your AI and replace “MY REQUEST” with your
          idea.
        </li>
        <li>
          <strong>Save its JSON.</strong> Use a plain-text file ending in <code>.pocket.json</code>,
          not an audio file.
        </li>
        <li>
          <strong>Load track. Play.</strong> Loome validates the file before changing your band.
          Export it to ask for a refinement.
        </li>
      </ol>
      <label className="prompt-label" htmlFor="ai-prompt">
        Complete prompt, example & JSON Schema
      </label>
      <textarea id="ai-prompt" ref={textarea} value={prompt} readOnly rows={6} spellCheck={false} />
      <button
        type="button"
        className="primary-button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(prompt);
            setStatus("Copied. Paste it into your AI and replace MY REQUEST.");
          } catch {
            textarea.current?.focus();
            textarea.current?.select();
            setStatus("Prompt selected. Copy it using your keyboard, or download it below.");
          }
        }}
      >
        <Copy size={16} /> Copy prompt
      </button>
      <p className="copy-status" aria-live="polite" aria-atomic="true">
        {status || "Nothing is sent anywhere by Loome. You choose what to share."}
      </p>
      <div className="prompt-downloads">
        {[
          ["pocket-ai-prompt.txt", "Download prompt"],
          ["pocket-track.schema.json", "JSON Schema"],
          ["example.pocket.json", "Example track"],
        ].map(([file, label]) => (
          <a key={file} href={`${import.meta.env.BASE_URL}${file}`} download>
            {label}
          </a>
        ))}
      </div>
    </Dialog>
  );
}

export function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog titleId="help-title" onClose={onClose}>
      <span className="modal-icon">
        <Headphones size={25} />
      </span>
      <h2 id="help-title">Meet your little band.</h2>
      <p>
        Pick a feeling, hit play, and give yourself a few minutes to settle in. Everything is
        synthesized right here in your browser.
      </p>
      <div className="help-items">
        <p>
          <strong>Make it your own</strong>Edit up to 64 bars, transpose the chart, or choose one of
          eight drum grooves. Use + for two chords sharing a bar. Long charts turn pages
          automatically. Chart and key edits stop playback; tempo, feel, and mix change live.
        </p>
        <p>
          <strong>Keep your arrangements</strong>Changes stay in your practice session until Save to
          library. Save updates a personal arrangement; Save a copy makes another. Export track
          downloads a complete portable file. Browser storage belongs to this browser and site.
        </p>
        <p>
          <strong>Bring your own AI</strong>Copy the arranging prompt for an AI you already use,
          then Load track to import its .pocket.json reply. Older v1 files still load; exports use
          v2. No AI key or music upload needed.
        </p>
        <p>
          <strong>Follow the yellow dots</strong>Filled dots are roots; outlined dots are chord
          tones. The optional scale is your home key, not a chord-by-chord scale recommendation.
        </p>
        <p>
          <strong>Take a different role</strong>Solo with the band, comp with keys sitting out, or
          trade four bars with the keyboard player.
        </p>
        <p>
          <strong>Leave it to chance</strong>The dice chooses another track from your whole library.
          Filters reset and playback waits for you.
        </p>
      </div>
      <button type="button" className="primary-button" onClick={onClose}>
        Let’s play <Play size={15} fill="currentColor" />
      </button>
    </Dialog>
  );
}

export function errorText(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
