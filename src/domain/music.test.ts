import assert from "node:assert/strict";
import { test } from "vitest";
import type { TrackFilters } from "./music";
import {
  PRESETS,
  chordAt,
  chordTones,
  filterTracks,
  keysPlaying,
  parseBar,
  parseChord,
  parseProgression,
  scaleTones,
  tapTempo,
  transposeBar,
  transposeChord,
  voiceChord,
} from "./music";
import {
  EXAMPLE_TRACK,
  TRACK_SCHEMA,
  createTrackPrompt,
  exportTrack,
  validateTrack,
} from "./tracks";
import type { Setup } from "./types";

test("chord charts accept flats, sharps, extensions, and bar separators without accepting invalid chords", () => {
  assert.deepEqual(parseProgression("f#m7 | B9, Emaj7 A♭m7b5"), ["F#m7", "B9", "Emaj7", "Abm7b5"]);
  assert.deepEqual(chordTones("Dm9"), [2, 5, 9, 0, 4]);
  assert.deepEqual(chordTones("B7"), [11, 3, 6, 9]);
  assert.deepEqual(chordTones("Cm7b5"), [0, 3, 6, 10]);
  assert.deepEqual(parseProgression("Gmaj7, Dmaj7, bmin7, f# min 7"), [
    "Gmaj7",
    "Dmaj7",
    "Bm7",
    "F#m7",
  ]);
  for (const invalid of [
    "",
    "C13",
    "H7",
    "<script>",
    "C/G",
    "Dm7+G7+Cmaj7",
    "Dm7+",
    Array(65).fill("C").join(" "),
  ])
    assert.throws(() => parseProgression(invalid));
  assert.equal(parseProgression(Array(64).fill("C").join(" ")).length, 64);
  assert.deepEqual(parseProgression("Dm7 + G7 | Cmaj7 Cmaj7"), ["Dm7+G7", "Cmaj7", "Cmaj7"]);
  assert.equal(chordAt("Am7b5+D7", 1), "Am7b5");
  assert.equal(chordAt("Am7b5+D7", 2), "D7");
  assert.equal(chordAt("Gm6", 3), "Gm6");
  assert.equal(transposeBar("Am7b5+D7", -3), "F#m7b5+B7");
});

test("transposition wraps in both directions and preserves chord quality", () => {
  assert.equal(transposeChord("Bmaj9", 1), "Cmaj9");
  assert.equal(transposeChord("Cm7b5", -1), "Bm7b5");
  assert.equal(transposeChord("F#7", 7), "Db7");
  for (const preset of PRESETS)
    for (const chord of preset.chords.flatMap(parseBar)) {
      for (let amount = -12; amount <= 12; amount++) {
        const transposed = transposeChord(chord, amount);
        assert.equal(transposeChord(transposed, -amount), parseChord(chord).symbol);
        assert.deepEqual(
          chordTones(transposed),
          chordTones(chord).map((n) => (((n + amount) % 12) + 12) % 12),
        );
      }
    }
});

test("comping voicings contain only chord tones in a compact guitar-friendly register", () => {
  let previous: number[] = [];
  for (const preset of PRESETS)
    for (const chord of preset.chords.flatMap(parseBar)) {
      const notes = voiceChord(chord, previous);
      assert.ok(notes.length >= 3);
      assert.ok(notes.every((n) => n >= 48 && n <= 70 && chordTones(chord).includes(n % 12)));
      assert.ok(notes[notes.length - 1] - notes[0] < 12);
      previous = notes;
    }
});

test("trade fours follows absolute bars, including across non-four-bar chart boundaries", () => {
  assert.deepEqual(
    Array.from({ length: 17 }, (_, bar) => keysPlaying("trade", bar)),
    [
      true,
      true,
      true,
      true,
      false,
      false,
      false,
      false,
      true,
      true,
      true,
      true,
      false,
      false,
      false,
      false,
      true,
    ],
  );
  assert.equal(keysPlaying("solo", 7), true);
  assert.equal(keysPlaying("comp", 0), false);
  assert.deepEqual(scaleTones(9, true), [9, 11, 0, 2, 4, 5, 7]);
});

test("tap tempo averages recent beats, ignores double clicks, and resets after a pause", () => {
  assert.deepEqual(tapTempo([], 1000), { taps: [1000], bpm: null });
  assert.equal(tapTempo([1000], 1500).bpm, 120);
  assert.equal(tapTempo([1000, 1500, 2020], 2500).bpm, 120);
  assert.equal(tapTempo([0], 800).bpm, 75);
  assert.equal(tapTempo([0], 1333).bpm, 45);
  assert.equal(tapTempo([0], 300).bpm, 180);
  assert.deepEqual(tapTempo([0, 500], 550), { taps: [0, 500], bpm: null });
  assert.deepEqual(tapTempo([0, 500], 2600), { taps: [2600], bpm: null });
  assert.deepEqual(tapTempo([0, 500, 1000, 1500, 2000, 2500], 3000), {
    taps: [500, 1000, 1500, 2000, 2500, 3000],
    bpm: 120,
  });
});

test("portable tracks preserve an arrangement and reject unsupported or unsafe playback settings", () => {
  // The original v1 fixture, kept inline so tests don't depend on prototype skills.
  const legacy = {
    version: 1,
    name: "Soft landing",
    description: "A sparse G minor ii–V–i. Two bars to settle into the resolution.",
    chords: ["Am7b5", "D7", "Gm6", "Gm6"],
    key: 7,
    minor: true,
    bpm: 90,
    drumPattern: "jazz-light",
    bassMotion: "roots" as const,
    mode: "solo" as const,
    mix: {
      drums: { volume: 60, muted: false },
      bass: { volume: 75, muted: false },
      keys: { volume: 42, muted: false },
    },
    tip: "Play C over Am7b5, hold C over D7, then resolve to B♭ on Gm6. Leave the fourth bar empty and listen to the band.",
  };
  const track = {
    ...legacy,
    version: 2,
    keysPattern: "offbeat",
    master: 38,
    countIn: false,
    metronome: true,
    showScale: true,
  };
  assert.deepEqual(exportTrack(validateTrack(track)), track);
  assert.deepEqual(exportTrack(validateTrack(legacy)), {
    ...legacy,
    version: 2,
    keysPattern: "auto",
    master: 75,
    countIn: true,
    metronome: false,
    showScale: false,
  });
  assert.deepEqual(validateTrack({ ...legacy, chords: ["bmin7", "F#Δ"] }).chords, [
    "Bm7",
    "F#maj7",
  ]);
  assert.equal(validateTrack(track).style, "swing");
  assert.deepEqual(validateTrack({ ...track, chords: ["A♭m7b5+D♭7", "F#maj7"] }).chords, [
    "Abm7b5+Db7",
    "F#maj7",
  ]);
  for (const patch of [
    { version: 3 },
    { bpm: 181 },
    { bpm: "90" },
    { key: 12 },
    { minor: "true" },
    { name: "" },
    { chords: [] },
    { chords: ["Am7b5 D7"] },
    { chords: ["D7b9"] },
    { chords: [null] },
    { chords: Array(65).fill("C") },
    { drumPattern: "invented" },
    { bassMotion: "walking" },
    { keysPattern: "random-jazz" },
    { mode: "unknown" },
    { master: -1 },
    { master: 101 },
    { countIn: "false" },
    { metronome: 1 },
    { showScale: null },
    { mix: null },
    { mix: { ...track.mix, bass: { volume: 101, muted: false } } },
    { mix: { ...track.mix, keys: { volume: 40, muted: "false" } } },
    { mix: { ...track.mix, guitar: { volume: 50, muted: false } } },
    { mix: { ...track.mix, keys: { volume: 40, muted: false, reverb: 80 } } },
    { script: "alert('not a track')" },
  ])
    assert.throws(() => validateTrack({ ...track, ...patch }), JSON.stringify(patch));
  for (const field of TRACK_SCHEMA.required) {
    const incomplete: Record<string, unknown> = { ...track };
    delete incomplete[field];
    assert.throws(() => validateTrack(incomplete), `Missing ${field}`);
  }
  const longTrack = validateTrack({
    ...track,
    chords: Array(64).fill("Dm7+G7"),
    bpm: 45,
  });
  assert.equal(longTrack.chords.length, 64);
  assert.equal(validateTrack({ ...track, bpm: 180 }).bpm, 180);
  for (const preset of PRESETS) {
    const document = exportTrack({ ...track, ...preset });
    assert.deepEqual(exportTrack(validateTrack(document)), {
      ...document,
      chords: document.chords.map((bar) => parseBar(bar).join("+")),
    });
  }
  assert.deepEqual(exportTrack(validateTrack(EXAMPLE_TRACK)), EXAMPLE_TRACK);
  const prompt = createTrackPrompt();
  const [example, schema] = prompt.split(/\nEXAMPLE [^\n]+\n/)[1].split(/\nJSON SCHEMA [^\n]+\n/);
  assert.deepEqual(exportTrack(validateTrack(JSON.parse(example))), JSON.parse(example));
  assert.deepEqual(JSON.parse(schema), TRACK_SCHEMA);
});

test("optional session metadata round-trips without leaking into older files", () => {
  const metadata: Setup["metadata"] = {
    genres: ["Soul", "Jazz"],
    moods: ["Late night"],
    tags: ["voice leading", "ii-v-i"],
    difficulty: "advanced",
    author: "Zoë",
  };
  const document = { ...EXAMPLE_TRACK, metadata };
  assert.deepEqual(exportTrack(validateTrack(document)), document);
  const old = { ...EXAMPLE_TRACK };
  Reflect.deleteProperty(old, "metadata");
  assert.deepEqual(exportTrack(validateTrack(old)), old);
  assert.equal(validateTrack(old).metadata, undefined);
  assert.deepEqual(validateTrack({ ...old, metadata: {} }).metadata, {});
  for (const metadata of [
    null,
    [],
    "jazz",
    { genres: "jazz" },
    { genres: [""] },
    { moods: [" "] },
    { tags: ["same", "same"] },
    { tags: Array.from({ length: 13 }, (_, i) => `tag ${i}`) },
    { genres: ["x".repeat(41)] },
    { difficulty: "expert" },
    { author: 7 },
    { author: "x".repeat(81) },
    { arbitrary: "unsupported" },
  ])
    assert.throws(() => validateTrack({ ...document, metadata }));
});

test("library searches metadata with AND terms and combines genre and difficulty filters", () => {
  const tracks: Setup[] = [
    {
      ...EXAMPLE_TRACK,
      name: "Window light",
      metadata: {
        genres: ["Jazz"],
        moods: ["Warm"],
        tags: ["ii–V–I", "voice leading"],
        difficulty: "advanced",
        author: "Zoë",
      },
    },
    {
      ...EXAMPLE_TRACK,
      name: "Other window",
      description: "A relaxed soul exercise.",
      drumPattern: "pocket",
      metadata: {
        genres: ["Soul"],
        moods: ["Warm"],
        tags: ["rhythm"],
        difficulty: "beginner",
      },
    },
    { ...EXAMPLE_TRACK, name: "No labels", metadata: undefined },
  ];
  const names = (filters: TrackFilters) => filterTracks(tracks, filters).map((t) => t.name);
  assert.deepEqual(names({ query: "warm JAZZ" }), ["Window light"]);
  assert.deepEqual(names({ query: "zoe ii-V-I" }), ["Window light"]);
  assert.deepEqual(names({ query: "warm", genre: "soul", difficulty: "beginner" }), [
    "Other window",
  ]);
  assert.deepEqual(names({ query: "warm", genre: "jazz", difficulty: "beginner" }), []);
  assert.deepEqual(names({ query: "90 G minor", genre: "jazz" }), ["Window light"]);
  assert.deepEqual(names({ query: "no labels" }), ["No labels"]);
  assert.equal(filterTracks(tracks).length, 3);
  assert.deepEqual(names({ query: "no such exercise" }), []);
});

test("the curated library has at least 100 distinct, tagged, playable arrangements", () => {
  assert.ok(PRESETS.length >= 100);
  assert.equal(new Set(PRESETS.map((p) => p.id)).size, PRESETS.length);
  assert.equal(new Set(PRESETS.map((p) => p.name.toLowerCase())).size, PRESETS.length);
  assert.equal(
    new Set(PRESETS.map((p) => p.chords.map((c) => parseBar(c).join("+")).join("|"))).size,
    PRESETS.length,
  );
  assert.ok(new Set(PRESETS.flatMap((p) => p.metadata?.genres ?? [])).size >= 12);
  for (const preset of PRESETS) {
    assert.ok(preset.metadata?.genres?.length && preset.metadata.tags?.length);
    const document = exportTrack({ ...EXAMPLE_TRACK, ...preset });
    assert.deepEqual(exportTrack(validateTrack(document)), {
      ...document,
      chords: document.chords.map((bar) => parseBar(bar).join("+")),
    });
  }
});

test("all 100 presets export independently with complete original startup defaults", () => {
  assert.equal(PRESETS.length, 100);
  for (const preset of PRESETS) {
    assert.equal(preset.mode, "solo");
    assert.deepEqual(preset.mix, {
      drums: { volume: 78, muted: false },
      bass: { volume: 80, muted: false },
      keys: { volume: 75, muted: false },
    });
    assert.equal(preset.master, 75);
    assert.equal(preset.countIn, true);
    assert.equal(preset.metronome, false);
    assert.equal(preset.showScale, false);
    const document = exportTrack(preset);
    for (const field of ["id", "category", "style"]) assert.ok(!(field in document));
    assert.deepEqual(exportTrack(validateTrack(document)), {
      ...document,
      chords: document.chords.map((bar) => parseBar(bar).join("+")),
    });
  }
  assert.notEqual(PRESETS[0].mix, PRESETS[1].mix);
  assert.notEqual(PRESETS[0].mix.drums, PRESETS[1].mix.drums);
});

test("v1 alone accepts aliases and extra mixer properties, then normalizes without mutating input", () => {
  const legacy: Record<string, unknown> = { ...EXAMPLE_TRACK, version: 1 };
  for (const field of ["keysPattern", "master", "countIn", "metronome", "showScale", "metadata"])
    delete legacy[field];
  legacy.chords = ["bmin7+F#Δ"];
  legacy.mix = {
    ...EXAMPLE_TRACK.mix,
    guitar: { volume: 80, muted: false },
    drums: { ...EXAMPLE_TRACK.mix.drums, reverb: 20 },
  };
  const before = JSON.stringify(legacy);
  const normalized = validateTrack(legacy);
  assert.equal(JSON.stringify(legacy), before);
  assert.deepEqual(normalized.chords, ["Bm7+F#maj7"]);
  assert.deepEqual(normalized.mix, EXAMPLE_TRACK.mix);
  assert.equal(normalized.id, "custom");
  assert.equal(normalized.category, "Your track");
  assert.equal(normalized.metadata, undefined);
  assert.throws(() => validateTrack({ ...EXAMPLE_TRACK, chords: legacy.chords }));
  assert.throws(() => validateTrack({ ...EXAMPLE_TRACK, mix: legacy.mix }));
});

test("the unknown import boundary rejects non-documents and preserves inclusive numeric limits", () => {
  for (const value of [
    null,
    undefined,
    false,
    2,
    "track",
    [],
    {},
    { version: "2" },
    { version: 0 },
  ])
    assert.throws(() => validateTrack(value));
  for (const level of [0, 100, 37.5]) {
    const track = validateTrack({
      ...EXAMPLE_TRACK,
      master: level,
      mix: { ...EXAMPLE_TRACK.mix, keys: { volume: level, muted: true } },
    });
    assert.equal(track.master, level);
    assert.equal(track.mix.keys.volume, level);
  }
  for (const bpm of [44, 181, 90.5]) assert.throws(() => validateTrack({ ...EXAMPLE_TRACK, bpm }));
  for (const key of [0, 11]) assert.equal(validateTrack({ ...EXAMPLE_TRACK, key }).key, key);
  for (const quality of ["Cconstructor", "C__proto__", "CtoString"])
    assert.throws(() => parseChord(quality));
});
