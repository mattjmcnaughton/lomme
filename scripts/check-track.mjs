import { readFile } from "node:fs/promises";
import { NOTES } from "../src/domain/music.ts";
import { validateTrack } from "../src/domain/tracks.ts";

try {
  if (!process.argv[2]) throw new Error("Usage: npm run track:check -- path/to/track.json");
  const track = validateTrack(JSON.parse(await readFile(process.argv[2], "utf8")));
  console.log(
    `Valid Lomme track: ${track.name} · ${track.chords.length} bars · ${track.bpm} BPM · ${NOTES[track.key]} ${track.minor ? "minor" : "major"} · ${track.drumPattern}`,
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
