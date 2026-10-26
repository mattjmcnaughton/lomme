import { ChevronRight, Dices, Search } from "lucide-react";
import { useState } from "react";
import { NOTES, filterTracks } from "../../domain/music";
import type { Arrangement } from "../../domain/types";

export interface LibraryProps {
  library: Arrangement[];
  selectedId: string;
  onSelect: (track: Arrangement) => void;
  onLucky: () => void;
}

export function Library({ library, selectedId, onSelect, onLucky }: LibraryProps) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const genres = [
    ...new Set(
      library.flatMap((track) => track.metadata?.genres || []).map((g) => g.toLowerCase()),
    ),
  ].sort();
  const visibleTracks = filterTracks(library, { query, genre, difficulty });
  const resetFilters = () => {
    setQuery("");
    setGenre("");
    setDifficulty("");
  };
  return (
    <>
      <div className="section-kicker">Your track library</div>
      <div className="library-controls">
        <div className="library-search">
          <Search size={14} />
          <input
            type="search"
            aria-label="Search tracks"
            placeholder="Genre, mood, tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="lucky-button"
            onClick={() => {
              resetFilters();
              onLucky();
            }}
            aria-label="I'm feeling lucky"
            title="I'm feeling lucky"
          >
            <Dices size={17} />
          </button>
        </div>
        <div className="library-filters">
          <select
            aria-label="Filter by genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            <option value="">All genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">All levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div className="library-count" aria-live="polite" aria-atomic="true">
          <span>
            {visibleTracks.length} of {library.length} tracks
          </span>
          {(query || genre || difficulty) && (
            <button type="button" className="text-button" onClick={resetFilters}>
              Reset filters
            </button>
          )}
        </div>
      </div>
      <nav className="presets" aria-label="Practice presets">
        {visibleTracks.map((preset, index) => (
          <button
            type="button"
            key={preset.id}
            className={`preset ${selectedId === preset.id ? "selected" : ""}`}
            onClick={() => onSelect(preset)}
            aria-pressed={selectedId === preset.id}
          >
            <span className={`preset-art art-${index % 5}`}>
              <i />
              <i />
              <i />
              <i />
            </span>
            <span>
              <strong>{preset.name}</strong>
              <small>{preset.category}</small>
              <small className="preset-facts">
                {NOTES[preset.key]} {preset.minor ? "minor" : "major"} · {preset.bpm} bpm
              </small>
            </span>
            <ChevronRight size={15} />
          </button>
        ))}
        {!visibleTracks.length && (
          <div className="library-empty">
            No tracks match.
            <br />
            <span>Try a different mood or reset your filters.</span>
          </div>
        )}
      </nav>
    </>
  );
}
