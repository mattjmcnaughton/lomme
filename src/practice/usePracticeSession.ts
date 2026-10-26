import { useEffect, useRef, useState } from "react";
import { PRESETS } from "../domain/presets";
import type { Arrangement } from "../domain/types";
import { LocalArrangementStore, persistSession, restoreSession } from "../storage/localLibrary";
import { saveArrangement } from "./library";

// Access storage at the boundary so unavailable browser storage cannot prevent practice.
const browserStorage = {
  getItem: (key: string) => window.localStorage.getItem(key),
  setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
};

export function usePracticeSession() {
  const [initial] = useState(() => {
    try {
      return { settings: restoreSession(browserStorage, PRESETS[0]), warning: "" };
    } catch {
      return {
        settings: structuredClone(PRESETS[0]),
        warning:
          "Your last session could not be recovered. Saved library data has not been changed.",
      };
    }
  });
  const [settings, setSettings] = useState(initial.settings);
  const [savedTracks, setSavedTracks] = useState<Arrangement[]>([]);
  const [message, setMessage] = useState(initial.warning);
  const [saving, setSaving] = useState(false);
  const savingNow = useRef(false);
  const [store] = useState(() => new LocalArrangementStore(browserStorage));

  useEffect(() => {
    let active = true;
    store.list().then(
      (tracks) => {
        if (active) setSavedTracks(tracks);
      },
      () => {
        if (active)
          setMessage(
            "Your library could not be read. Existing data has not been changed; you can still practice and export.",
          );
      },
    );
    return () => {
      active = false;
    };
  }, [store]);

  useEffect(() => {
    if (initial.warning && settings === initial.settings) return;
    try {
      persistSession(browserStorage, settings);
    } catch {
      setMessage(
        "This session could not be remembered by your browser. Export a file to keep your changes.",
      );
    }
  }, [settings, initial]);

  async function remember(snapshot: Arrangement, copy = false) {
    if (savingNow.current)
      throw new Error("A save is already in progress. Please try again shortly.");
    savingNow.current = true;
    setSaving(true);
    try {
      const saved = await saveArrangement(store, snapshot, copy);
      setSavedTracks(await store.list());
      return saved;
    } catch (error) {
      throw new Error(
        `Your arrangement could not be saved. Export a file to keep it. ${error instanceof Error ? error.message : "Storage unavailable."}`,
      );
    } finally {
      savingNow.current = false;
      setSaving(false);
    }
  }

  return { settings, setSettings, savedTracks, message, setMessage, saving, remember };
}
