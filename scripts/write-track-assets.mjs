import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import {
  EXAMPLE_TRACK,
  TRACK_SCHEMA,
  createTrackPrompt,
  validateTrack,
} from "../src/domain/tracks.ts";

validateTrack(EXAMPLE_TRACK);
for (const [name, text] of [
  ["pocket-track.schema.json", `${JSON.stringify(TRACK_SCHEMA, null, 2)}\n`],
  ["example.pocket.json", `${JSON.stringify(EXAMPLE_TRACK, null, 2)}\n`],
  ["pocket-ai-prompt.txt", createTrackPrompt()],
]) {
  await writeFile(new URL(`../public/${name}`, import.meta.url), text);
}
execFileSync(
  "pnpm",
  [
    "exec",
    "biome",
    "format",
    "--write",
    "public/pocket-track.schema.json",
    "public/example.pocket.json",
  ],
  { stdio: "inherit" },
);
console.log("Generated v2 schema, external-AI prompt, and validated example track.");
