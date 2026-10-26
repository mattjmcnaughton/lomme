/** Portable musical content, independent of storage identity and playback state. */
export type Instrument = "drums" | "bass" | "keys";

export interface Setup {
  name: string;
  description: string;
  chords: string[];
  key: number;
  minor: boolean;
  bpm: number;
  drumPattern: string;
  bassMotion: "roots" | "moving";
  keysPattern: string;
  mode: "solo" | "comp" | "trade";
  mix: Record<Instrument, { volume: number; muted: boolean }>;
  master: number;
  countIn: boolean;
  metronome: boolean;
  showScale: boolean;
  tip?: string;
  metadata?: {
    genres?: string[];
    moods?: string[];
    tags?: string[];
    difficulty?: "beginner" | "intermediate" | "advanced";
    author?: string;
  };
}

export interface Arrangement extends Setup {
  id: string;
  category: string;
  style?: string;
}
