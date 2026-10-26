import { useCallback, useEffect, useRef, useState } from "react";
import { Band } from "../audio/band";
import {
  type PlaybackEngine,
  type PlaybackFactory,
  type Position,
  stoppedPosition,
} from "../audio/playback";
import type { Setup } from "../domain/types";

const createBand: PlaybackFactory = (settings, tick) => new Band(settings, tick);

export function usePlayback(
  settings: Setup,
  onError: (message: string) => void,
  factory: PlaybackFactory = createBand,
) {
  const latest = useRef({ settings, onError, factory });
  latest.current.onError = onError;
  latest.current.factory = factory;
  const engine = useRef<PlaybackEngine | null>(null);
  const intent = useRef(0);
  const active = useRef(false);
  const mounted = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [tick, setTick] = useState<Position>(stoppedPosition);

  const cancel = useCallback(() => {
    intent.current++;
    active.current = false;
    // A fresh engine per playback intent makes callbacks from an old start
    // unambiguously stale, even when it completes after a newer start.
    engine.current?.dispose();
    engine.current = null;
  }, []);

  const stop = useCallback(() => {
    cancel();
    if (!mounted.current) return;
    setPlaying(false);
    setStarting(false);
    setTick(stoppedPosition);
  }, [cancel]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancel();
    };
  }, [cancel]);

  useEffect(() => {
    latest.current.settings = settings;
    engine.current?.update();
  }, [settings]);

  const start = useCallback(async () => {
    if (!mounted.current) return;
    const token = ++intent.current;
    active.current = true;
    setStarting(true);
    setPlaying(false);
    try {
      const next = latest.current.factory(
        () => latest.current.settings,
        (position) => {
          if (mounted.current && token === intent.current) setTick(position);
        },
      );
      engine.current = next;
      next.update();
      await next.start();
      if (mounted.current && token === intent.current) {
        setStarting(false);
        setPlaying(true);
      }
    } catch {
      if (!mounted.current || token !== intent.current) return;
      stop();
      latest.current.onError(
        "Audio could not start. Check your browser’s sound permissions and try again.",
      );
    }
  }, [stop]);

  const toggle = useCallback(async () => {
    if (active.current) stop();
    else await start();
  }, [start, stop]);

  const restart = useCallback(async () => {
    const wasActive = active.current;
    stop();
    if (wasActive) await start();
  }, [start, stop]);

  return { playing, starting, tick, setTick, stop, toggle, restart };
}
