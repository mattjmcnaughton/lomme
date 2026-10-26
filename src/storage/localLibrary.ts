import { exportTrack, validateTrack } from "../domain/tracks";
import type { Arrangement } from "../domain/types";
import type { ArrangementStore } from "../practice/library";

type StorageAccess = Pick<Storage, "getItem" | "setItem">;

export class LocalArrangementStore implements ArrangementStore {
  constructor(private storage: StorageAccess) {}
  async list(): Promise<Arrangement[]> {
    const raw = this.storage.getItem("lomme-library");
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    if (Array.isArray(data)) {
      return data.map((track, index) => ({
        ...validateTrack(track),
        id: `legacy:${index}`,
        category: "Your track",
      }));
    }
    if (!isRecord(data) || data.version !== 1 || !Array.isArray(data.arrangements)) {
      throw new Error(
        "This library version is not supported. Your saved data has not been changed.",
      );
    }
    const identities = new Set<string>();
    return data.arrangements.map((entry: unknown) => {
      if (!isRecord(entry) || typeof entry.id !== "string" || identities.has(entry.id)) {
        throw new Error("Invalid saved arrangement identity. Your library has not been changed.");
      }
      identities.add(entry.id);
      return { ...validateTrack(entry.track), id: entry.id, category: "Your track" };
    });
  }
  async save(arrangement: Arrangement): Promise<void> {
    const arrangements = await this.list();
    const next = [...arrangements.filter((item) => item.id !== arrangement.id), arrangement];
    this.storage.setItem(
      "lomme-library",
      JSON.stringify({
        version: 1,
        arrangements: next.map((item) => ({ id: item.id, track: exportTrack(item) })),
      }),
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function restoreSession(storage: StorageAccess, fallback: Arrangement): Arrangement {
  const raw = storage.getItem("pocket-session");
  if (!raw) return structuredClone(fallback);
  const saved: unknown = JSON.parse(raw);
  if (!isRecord(saved)) throw new Error("The last session could not be recovered.");
  const drumPattern =
    saved.drumPattern ??
    (saved.style === "swing" ? "swing" : saved.style === "bossa" ? "bossa" : fallback.drumPattern);
  const complete = { ...fallback, ...saved, drumPattern, metadata: saved.metadata };
  const restored = validateTrack(exportTrack(complete as Arrangement));
  return {
    ...restored,
    id: typeof saved.id === "string" ? saved.id : "custom",
    category: typeof saved.category === "string" ? saved.category : "Your track",
  };
}

export function persistSession(storage: StorageAccess, settings: Arrangement): void {
  storage.setItem(
    "pocket-session",
    JSON.stringify({
      ...exportTrack(settings),
      id: settings.id,
      category: settings.category,
    }),
  );
}
