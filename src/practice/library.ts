import { exportTrack, validateTrack } from "../domain/tracks";
import type { Arrangement } from "../domain/types";

export interface ArrangementStore {
  list(): Promise<Arrangement[]>;
  save(arrangement: Arrangement): Promise<void>;
}

export async function saveArrangement(
  store: ArrangementStore,
  settings: Arrangement,
  copy = false,
  newId = () => `personal:${crypto.randomUUID()}`,
): Promise<Arrangement> {
  const existing = !copy && (await store.list()).find((item) => item.id === settings.id);
  const arrangement: Arrangement = {
    ...validateTrack(exportTrack(settings)),
    id: existing ? existing.id : newId(),
    category: "Your track",
  };
  await store.save(arrangement);
  return arrangement;
}
