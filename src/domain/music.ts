import type { Arrangement, Setup } from "./types";

export const NOTES = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const ROOTS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export const QUALITIES: Record<string, number[]> = {
  "": [0, 4, 7],
  m: [0, 3, 7],
  7: [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  6: [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  9: [0, 4, 7, 10, 14],
  maj9: [0, 4, 7, 11, 14],
  m9: [0, 3, 7, 10, 14],
  sus4: [0, 5, 7],
  "7sus4": [0, 5, 7, 10],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  m7b5: [0, 3, 6, 10],
};

// Eighth-note positions; every pattern also articulates a mid-bar chord change.
export const KEYS_PATTERNS = [
  { id: "auto", name: "Follow groove", steps: null },
  { id: "sustain", name: "Held chords", steps: [0] },
  { id: "quarters", name: "Quarter-note stabs", steps: [0, 2, 4, 6] },
  { id: "offbeat", name: "Offbeat chops", steps: [1, 3, 5, 7] },
  {
    id: "arpeggio",
    name: "Eighth-note arpeggio",
    steps: [0, 1, 2, 3, 4, 5, 6, 7],
  },
];

// Sixteenth-note lanes: X = accent, x = normal hit, o = ghost, . = rest.
export const DRUM_PATTERNS = [
  {
    id: "pocket",
    name: "808 pocket",
    style: "pocket",
    kick: "X.......X.....o.",
    snare: "....X.......X...",
    hat: "x.o.x.o.x.o.x.o.",
  },
  {
    id: "half-time",
    name: "Half-time",
    style: "pocket",
    kick: "X.....o...x.....",
    snare: "........X.......",
    hat: "x.o.x.o.x.o.x.oo",
  },
  {
    id: "four-floor",
    name: "Four on the floor",
    style: "straight",
    kick: "X...x...X...x...",
    snare: "....X.......X...",
    hat: "..x...x...x...x.",
  },
  {
    id: "boom-bap",
    name: "Boom bap",
    style: "pocket",
    kick: "X..o......X.....",
    snare: "....X......oX...",
    hat: "x...x.o.x...x.o.",
  },
  {
    id: "funk",
    name: "Sixteenth funk",
    style: "straight",
    kick: "X..x..o.X..x....",
    snare: "....X..o.o..X.o.",
    hat: "XoxoXoxoXoxoXoxo",
  },
  {
    id: "swing",
    name: "Swing time",
    style: "swing",
    kick: "x.......o.......",
    snare: "....x.......x..o",
    hat: "x...X.x.x...X.x.",
  },
  {
    id: "jazz-light",
    name: "Light swing",
    style: "swing",
    kick: "o...............",
    snare: "....o.......o...",
    hat: "x...X.x.x...X.x.",
  },
  {
    id: "bossa",
    name: "Bossa breeze",
    style: "bossa",
    kick: "X.....x.X.....x.",
    snare: "....x.....x.x...",
    hat: "x.o.x.o.x.o.x.o.",
  },
];

export { PRESETS } from "./presets";

export function parseChord(symbol: string) {
  const normalized = symbol
    .trim()
    .replace(/♭/g, "b")
    .replace(/♯/g, "#")
    .replace(/−/g, "m")
    .replace(/min/g, "m")
    .replace(/Δ/g, "maj7");
  const match = /^([A-Ga-g])([b#]?)(.*)$/.exec(normalized);
  if (!match || !Object.prototype.hasOwnProperty.call(QUALITIES, match[3]))
    throw new Error(`“${symbol}” isn't supported. Try Dm7, G7, or Cmaj9.`);
  const root =
    (ROOTS[match[1].toUpperCase()] + (match[2] === "#" ? 1 : match[2] === "b" ? -1 : 0) + 12) % 12;
  return {
    root,
    quality: match[3],
    symbol: `${NOTES[root]}${match[3]}`,
    intervals: QUALITIES[match[3]],
  };
}

const searchText = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/♯/g, "#")
    .replace(/♭/g, "b")
    .replace(/[–—−]/g, "-");

export interface TrackFilters {
  query?: string;
  genre?: string;
  difficulty?: string;
}

export function filterTracks<T extends Setup & Partial<Pick<Arrangement, "category">>>(
  tracks: T[],
  { query = "", genre = "", difficulty = "" }: TrackFilters = {},
) {
  const words = searchText(query)
    .split(/[\s,]+/)
    .filter(Boolean);
  return tracks.filter((track) => {
    const metadata = track.metadata || {};
    if (genre && !metadata.genres?.some((g) => searchText(g) === searchText(genre))) return false;
    if (difficulty && metadata.difficulty !== difficulty) return false;
    const text = searchText(
      [
        track.name,
        track.description,
        track.category,
        ...(metadata.genres || []),
        ...(metadata.moods || []),
        ...(metadata.tags || []),
        metadata.difficulty,
        metadata.author,
        `${NOTES[track.key]} ${track.minor ? "minor" : "major"}`,
        track.bpm,
        `${track.chords.length} bars`,
        track.drumPattern,
      ]
        .filter(Boolean)
        .join(" "),
    );
    return words.every((word) => text.includes(word));
  });
}

export function parseBar(text: string) {
  const chords = text.split("+");
  if (chords.length > 2) throw new Error("Use one or two chords per bar, joined with +.");
  return chords.map((symbol) => parseChord(symbol).symbol);
}

export function chordAt(bar: string, beat = 0) {
  const chords = parseBar(bar);
  return chords[chords.length === 2 && beat >= 2 ? 1 : 0];
}

export function parseProgression(text: string) {
  const symbols = text
    .trim()
    .replace(/([A-Ga-g][#b♯♭]?)\s+(min|maj|m)\s*(7|9|6)?\b/g, "$1$2$3")
    .replace(/(min|maj|m)\s+(7|9|6)\b/g, "$1$2")
    .replace(/\s*\+\s*/g, "+")
    .split(/[\s,|]+/)
    .filter(Boolean);
  if (!symbols.length || symbols.length > 64)
    throw new Error("Enter between 1 and 64 bars. Join two chords in a bar with +.");
  return symbols.map((symbol) => parseBar(symbol).join("+"));
}

export function transposeBar(bar: string, semitones: number) {
  return parseBar(bar)
    .map((chord) => transposeChord(chord, semitones))
    .join("+");
}

export function transposeChord(symbol: string, semitones: number) {
  const chord = parseChord(symbol);
  return `${NOTES[(((chord.root + semitones) % 12) + 12) % 12]}${chord.quality}`;
}

export function chordTones(symbol: string) {
  const { root, intervals } = parseChord(symbol);
  return intervals.map((interval) => (root + interval) % 12);
}

// Inversions keep the comping in a compact register instead of jumping with the root.
export function voiceChord(symbol: string, previous: number[] = []) {
  const { root, intervals } = parseChord(symbol);
  const pitches = intervals.filter((i) => i !== 0).map((i) => (root + i) % 12);
  if (pitches.length < 3) pitches.unshift(root);
  const candidates = Array.from({ length: 12 }, (_, offset) => {
    const bottom = 48 + offset;
    return pitches.map((p) => bottom + ((p - (bottom % 12) + 12) % 12)).sort((a, b) => a - b);
  });
  const cost = (notes: number[]) =>
    notes.reduce((total, n, i) => total + Math.abs(n - (previous[i] ?? 55 + i * 4)), 0);
  return candidates.sort((a, b) => cost(a) - cost(b))[0];
}

export function keysPlaying(mode: Setup["mode"], absoluteBar: number) {
  return mode !== "comp" && (mode !== "trade" || Math.floor(absoluteBar / 4) % 2 === 0);
}

export function scaleTones(key: number, minor: boolean) {
  return (minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11]).map((n) => (n + key) % 12);
}

export function formatChord(symbol: string) {
  return symbol.replace(/b/g, "♭").replace(/#/g, "♯");
}

// Average recent quarter-note taps; a pause starts a new tempo rather than diluting it.
export function tapTempo(previous: number[], now: number) {
  const last = previous[previous.length - 1];
  if (last !== undefined && now - last < 200) return { taps: previous, bpm: null };
  const taps = last === undefined || now - last > 2000 ? [now] : [...previous.slice(-5), now];
  if (taps.length < 2) return { taps, bpm: null };
  const average = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
  return {
    taps,
    bpm: Math.max(45, Math.min(180, Math.round(60000 / average))),
  };
}
