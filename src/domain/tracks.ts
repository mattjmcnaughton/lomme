import Ajv from "ajv";
import { DRUM_PATTERNS, KEYS_PATTERNS, QUALITIES, parseBar } from "./music";
import type { Arrangement, Setup } from "./types";

export type TrackDocument = Setup & { version: number };
type TrackInput = Omit<Setup, keyof typeof TRACK_DEFAULTS> &
  Partial<Pick<Setup, keyof typeof TRACK_DEFAULTS>> & { version: number };

export const TRACK_VERSION = 2;
// Explicit migration defaults make a v1 file sound the same in every session.
export const TRACK_DEFAULTS = {
  keysPattern: "auto",
  master: 75,
  countIn: true,
  metronome: false,
  showScale: false,
};

const chordPattern = `[A-Ga-g][#b♯♭]?(?:${Object.keys(QUALITIES).join("|")})`;
const level = { type: "number", minimum: 0, maximum: 100 };
const channel = {
  type: "object",
  additionalProperties: false,
  required: ["volume", "muted"],
  properties: { volume: level, muted: { type: "boolean" } },
};

// The importer, downloadable schema, and external-AI prompt share this contract.
export const TRACK_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Lomme backing track v2",
  description:
    "A complete looping 4/4 arrangement for Lomme's synthesized band. Data only; no audio or code.",
  type: "object",
  additionalProperties: false,
  required: [
    "version",
    "name",
    "description",
    "chords",
    "key",
    "minor",
    "bpm",
    "drumPattern",
    "bassMotion",
    "keysPattern",
    "mode",
    "mix",
    "master",
    "countIn",
    "metronome",
    "showScale",
  ],
  properties: {
    version: { const: TRACK_VERSION },
    name: { type: "string", minLength: 1, maxLength: 80, pattern: "\\S" },
    description: {
      type: "string",
      minLength: 1,
      maxLength: 300,
      pattern: "\\S",
    },
    chords: {
      type: "array",
      minItems: 1,
      maxItems: 64,
      description:
        "One entry per bar. Dm7+G7 means two beats of each; repeat entries for longer holds.",
      items: {
        type: "string",
        maxLength: 40,
        pattern: `^${chordPattern}(?:\\+${chordPattern})?$`,
      },
    },
    key: {
      type: "integer",
      minimum: 0,
      maximum: 11,
      description:
        "Home key: C=0, Db=1, D=2, Eb=3, E=4, F=5, F#=6, G=7, Ab=8, A=9, Bb=10, B=11. Does not transpose the supplied chords.",
    },
    minor: { type: "boolean" },
    bpm: { type: "integer", minimum: 45, maximum: 180 },
    drumPattern: { enum: DRUM_PATTERNS.map((p) => p.id) },
    bassMotion: { enum: ["roots", "moving"] },
    keysPattern: { enum: KEYS_PATTERNS.map((p) => p.id) },
    mode: {
      enum: ["solo", "comp", "trade"],
      description:
        "solo: band accompanies you; comp: keys sit out; trade: keys alternate four bars on/four off, across loop boundaries.",
    },
    mix: {
      type: "object",
      additionalProperties: false,
      required: ["drums", "bass", "keys"],
      properties: { drums: channel, bass: channel, keys: channel },
    },
    master: level,
    countIn: {
      type: "boolean",
      description: "One bar of clicks before the chart starts.",
    },
    metronome: { type: "boolean" },
    showScale: {
      type: "boolean",
      description: "Show the static home-key scale on the fretboard; not per-chord scale advice.",
    },
    metadata: {
      type: "object",
      additionalProperties: false,
      description:
        "Optional searchable catalog information. Labels describe the exercise, not additional audio capabilities.",
      properties: {
        genres: {
          type: "array",
          maxItems: 12,
          uniqueItems: true,
          items: {
            type: "string",
            minLength: 1,
            maxLength: 40,
            pattern: "\\S",
          },
        },
        moods: {
          type: "array",
          maxItems: 12,
          uniqueItems: true,
          items: {
            type: "string",
            minLength: 1,
            maxLength: 40,
            pattern: "\\S",
          },
        },
        tags: {
          type: "array",
          maxItems: 12,
          uniqueItems: true,
          items: {
            type: "string",
            minLength: 1,
            maxLength: 40,
            pattern: "\\S",
          },
        },
        difficulty: { enum: ["beginner", "intermediate", "advanced"] },
        author: { type: "string", minLength: 1, maxLength: 80, pattern: "\\S" },
      },
    },
    tip: { type: "string", minLength: 1, maxLength: 600, pattern: "\\S" },
  },
};

const ajv = new Ajv();
const checkV2 = ajv.compile<TrackInput>(TRACK_SCHEMA);
const legacyProperties = Object.fromEntries(
  Object.entries(TRACK_SCHEMA.properties).filter(
    ([name]) => !(name in TRACK_DEFAULTS) && name !== "metadata",
  ),
);
const checkV1 = ajv.compile<TrackInput>({
  ...TRACK_SCHEMA,
  required: TRACK_SCHEMA.required.filter((name) => !(name in TRACK_DEFAULTS)),
  properties: {
    ...legacyProperties,
    version: { const: 1 },
    // v1 accepted aliases (min7, Δ) and ignored extra mixer fields.
    chords: {
      ...TRACK_SCHEMA.properties.chords,
      items: { type: "string", maxLength: 40 },
    },
    mix: {
      type: "object",
      required: ["drums", "bass", "keys"],
      properties: Object.fromEntries(
        ["drums", "bass", "keys"].map((name) => [name, { ...channel, additionalProperties: true }]),
      ),
    },
  },
});

export function exportTrack(settings: Setup): TrackDocument {
  return portableTrack(settings);
}

function portableTrack(settings: TrackInput | Setup): TrackDocument {
  const complete = { ...TRACK_DEFAULTS, ...settings };
  return {
    version: TRACK_VERSION,
    name: complete.name,
    description: complete.description,
    chords: complete.chords,
    key: complete.key,
    minor: complete.minor,
    bpm: complete.bpm,
    drumPattern: complete.drumPattern,
    bassMotion: complete.bassMotion,
    keysPattern: complete.keysPattern,
    mode: complete.mode,
    mix: complete.mix,
    master: complete.master,
    countIn: complete.countIn,
    metronome: complete.metronome,
    showScale: complete.showScale,
    ...(complete.metadata !== undefined ? { metadata: complete.metadata } : {}),
    tip: complete.tip || "Listen for the changes. Leave room for your own part.",
  };
}

export function validateTrack(track: unknown): Arrangement {
  if (
    !track ||
    typeof track !== "object" ||
    !("version" in track) ||
    (track.version !== 1 && track.version !== TRACK_VERSION)
  )
    throw new Error(
      "Use a Lomme track file with version 1 or 2. Future versions aren't supported yet.",
    );
  const check = track.version === 1 ? checkV1 : checkV2;
  if (!check(track)) {
    const error = check.errors?.[0];
    if (!error) throw new Error("Invalid track.");
    if (error.instancePath === "/bpm")
      throw new Error("Tempo must be a whole number from 45 to 180 BPM.");
    if (error.instancePath.startsWith("/chords"))
      throw new Error(
        "Invalid chords. Use 1–64 bars like Dm7 or Dm7+G7, with supported chord qualities.",
      );
    throw new Error(
      `Invalid track${error.instancePath || ""}: ${error.message}${error.params.additionalProperty ? ` (${error.params.additionalProperty})` : ""}.`,
    );
  }
  const chords = track.chords.map((bar) => parseBar(bar).join("+"));
  const channel = (name: keyof Setup["mix"]) => ({
    volume: track.mix[name].volume,
    muted: track.mix[name].muted,
  });
  const mix = { drums: channel("drums"), bass: channel("bass"), keys: channel("keys") };
  return {
    ...portableTrack(track),
    // An old file must clear the previous session's metadata, not inherit it.
    metadata: track.metadata,
    chords,
    mix,
    id: "custom",
    category: "Your track",
    style: DRUM_PATTERNS.find((p) => p.id === track.drumPattern)?.style,
  };
}

export const EXAMPLE_TRACK: TrackDocument = {
  version: TRACK_VERSION,
  name: "Soft landing",
  description: "A sparse G minor ii–V–i. Two bars to settle into the resolution.",
  chords: ["Am7b5", "D7", "Gm6", "Gm6"],
  key: 7,
  minor: true,
  bpm: 90,
  drumPattern: "jazz-light",
  bassMotion: "roots",
  keysPattern: "sustain",
  mode: "solo",
  mix: {
    drums: { volume: 60, muted: false },
    bass: { volume: 75, muted: false },
    keys: { volume: 42, muted: false },
  },
  master: 70,
  countIn: true,
  metronome: false,
  showScale: false,
  metadata: {
    genres: ["Jazz"],
    moods: ["Mellow", "Reflective"],
    tags: ["minor ii-v-i", "chord tones", "voice leading"],
    difficulty: "intermediate",
  },
  tip: "Play C over Am7b5, hold C over D7, then resolve to B♭ on Gm6. Leave the fourth bar empty and listen to the band.",
};

export function createTrackPrompt() {
  return `Create a Lomme backing track for my guitar practice.

MY REQUEST (replace this paragraph): A spacious 16-bar soul loop in E major, 84 BPM, laid-back drums, root bass, quiet offbeat keyboard chords, and a turnaround that loops naturally. Leave room for my guitar.

Return exactly one complete JSON object that conforms to the v2 schema below. No Markdown fences, commentary, code, URLs, or extra fields. I will save it as a .pocket.json file and use Load track in Lomme. Lomme is a static app; you are my external arranger, not an agent inside it. For revisions, I can attach my exported track: preserve all unrequested settings. The .pocket.json extension is retained for compatibility with tracks made before the app was renamed.

CAPABILITIES AND ARRANGING RULES
- 4/4 only, 1–64 bars, integer BPM 45–180. The entire chart repeats indefinitely. No sections, fills, melodies, custom drum lanes, samples, per-bar settings, or audio/MIDI imports.
- Each chords entry is ONE BAR. Dm7+G7 gives two beats to each chord. No more than two chords per bar. Repeat entries for longer holds. Supply actual transposed chords: key only sets the home-key scale display.
- Use A–G roots with optional # or b. Supported qualities: plain major, m, 7, maj7, m7, 6, m6, 9, maj9, m9, sus4, 7sus4, dim, dim7, m7b5. No slash bass, augmented chords, 13, b9, or #11. Simplify unsupported requests explicitly in description; never invent capabilities.
- Grooves: ${DRUM_PATTERNS.map((p) => `${p.id} (${p.name}, ${p.style} feel)`).join("; ")}. All use the synthesized 808-style kit, not acoustic/brush samples. The groove supplies straight, laid-back, or swing timing for the band.
- Bass roots = quarter-note roots; moving = deterministic chord-tone figure, not a human walking-bass generator.
- Keyboard patterns: ${KEYS_PATTERNS.map((p) => `${p.id} (${p.name})`).join("; ")}. auto follows the groove; sustain holds each chord; quarters stabs on beats; offbeat chops between beats with an extra hit at each chord change; arpeggio plays ascending compact chord tones on eighths, restarting at each chord change. All use electric-piano-style synthesis; no separate sound presets.
- solo = you solo over keys; comp = you supply chords, keys sit out; trade = keys alternate four absolute bars on, four off, even across loop boundaries. Muting keys overrides any pattern. For drums-and-bass-only, set mix.keys.muted true.
- Mix and master levels are 0–100 (not dB). Start restrained: drums 60–70, bass 70–80, keys 40–55, master 70. Include every control, including countIn, metronome, and showScale. Exclude playback position, tap history, microphone permissions, and recorded audio.
- Add metadata to make the track searchable: genres, moods, and tags are arrays of up to 12 unique short labels (40 characters each); difficulty is beginner, intermediate, or advanced; author is optional text up to 80 characters. Metadata itself is optional in v2, so older files remain valid. Choose accurate genre/mood labels and practice-goal tags such as chord tones, rhythm, or voice leading. These labels never change playback.
- Choose a home key matching the actual music, not merely its first chord. Major ii–V–I: m7 → 7 → maj7. Minor ii–V–i: m7b5 → 7 → m or m6. A standard is a chord-only practice arrangement; disclose simplifications/uncertainty, no melody or lyrics. Do not invent an authoritative chart.
- Give a short name, accurate description, and one actionable practice tip. Count the bars and check the loop boundary before replying.

EXAMPLE (4 bars, not the 16 bars in my request)
${JSON.stringify(EXAMPLE_TRACK, null, 2)}

JSON SCHEMA (the same contract Lomme uses to validate imports)
${JSON.stringify(TRACK_SCHEMA, null, 2)}
`;
}
