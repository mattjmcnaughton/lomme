import { describe, expect, it } from "vitest";
import { PRESETS } from "../domain/presets";
import type { Arrangement } from "../domain/types";
import { type ArrangementStore, saveArrangement } from "./library";

class MemoryStore implements ArrangementStore {
  arrangements: Arrangement[] = [];
  unavailable = false;
  async list() {
    return structuredClone(this.arrangements);
  }
  async save(arrangement: Arrangement) {
    if (this.unavailable) throw new Error("Storage is full");
    this.arrangements = [
      ...this.arrangements.filter((item) => item.id !== arrangement.id),
      structuredClone(arrangement),
    ];
  }
}

describe("personal arrangement identity", () => {
  it("keeps practice edits separate, updates by identity, and copies independently", async () => {
    const store = new MemoryStore();
    const preset = structuredClone(PRESETS[0]);
    const session = { ...preset, bpm: 73 };
    expect(await store.list()).toEqual([]);
    expect(PRESETS[0]).toEqual(preset);
    const saved = await saveArrangement(store, session, false, () => "personal:a");
    const renamed = await saveArrangement(store, { ...saved, name: "Evening", bpm: 91 });
    expect(renamed.id).toBe("personal:a");
    expect(await store.list()).toEqual([renamed]);
    const copy = await saveArrangement(store, renamed, true, () => "personal:b");
    expect(copy.name).toBe("Evening");
    expect(copy.id).toBe("personal:b");
    const loaded = await store.list();
    loaded[0].chords[0] = "F7";
    expect((await store.list())[0].chords[0]).toBe(renamed.chords[0]);
    expect(await store.list()).toHaveLength(2);
  });

  it("does not acknowledge failed saves or overwrite same-name imports", async () => {
    const store = new MemoryStore();
    const first = await saveArrangement(store, PRESETS[0], true, () => "personal:one");
    await saveArrangement(store, PRESETS[0], true, () => "personal:two");
    expect(await store.list()).toHaveLength(2);
    store.unavailable = true;
    await expect(saveArrangement(store, { ...first, bpm: 104 })).rejects.toThrow("Storage is full");
    expect((await store.list())[0].bpm).toBe(first.bpm);
  });
});
