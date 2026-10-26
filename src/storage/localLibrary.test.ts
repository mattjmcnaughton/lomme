import { beforeEach, expect, it } from "vitest";
import { PRESETS } from "../domain/presets";
import { EXAMPLE_TRACK, exportTrack } from "../domain/tracks";
import { LocalArrangementStore, persistSession, restoreSession } from "./localLibrary";

beforeEach(() => localStorage.clear());

it("reads legacy portable libraries, then preserves stable identities across reloads", async () => {
  localStorage.setItem("lomme-library", JSON.stringify([EXAMPLE_TRACK]));
  const store = new LocalArrangementStore(localStorage);
  const [legacy] = await store.list();
  expect(legacy.name).toBe("Soft landing");
  await store.save({ ...legacy, name: "Renamed", bpm: 93 });
  const reloaded = await new LocalArrangementStore(localStorage).list();
  expect(reloaded).toHaveLength(1);
  expect(reloaded[0]).toMatchObject({ id: legacy.id, name: "Renamed", bpm: 93 });
  expect(exportTrack(reloaded[0])).not.toHaveProperty("id");
});

it("does not treat unreadable libraries as empty or overwrite them", async () => {
  localStorage.setItem("lomme-library", "broken JSON");
  const store = new LocalArrangementStore(localStorage);
  await expect(store.list()).rejects.toThrow();
  await expect(store.save(PRESETS[0])).rejects.toThrow();
  expect(localStorage.getItem("lomme-library")).toBe("broken JSON");
});

it("recovers complete working settings without saving to the library", () => {
  const working = { ...PRESETS[0], bpm: 67, name: "Working draft", metronome: true };
  persistSession(localStorage, working);
  expect(restoreSession(localStorage, PRESETS[0])).toMatchObject(working);
  expect(localStorage.getItem("lomme-library")).toBeNull();
});
