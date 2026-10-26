import { act, renderHook } from "@testing-library/react";
import { type ReactNode, StrictMode } from "react";
import { describe, expect, it } from "vitest";
import type { PlaybackEngine, Position } from "../audio/playback";
import type { Setup } from "../domain/types";
import { usePlayback } from "./usePlayback";

// A delayed audio context: stop invalidates pending work, just as the real
// adapter must. emit also models overdue visual frames after cancellation.
class FakeEngine implements PlaybackEngine {
  audible = false;
  disposed = false;
  generation = 0;
  pending: { resolve: () => void; reject: () => void }[] = [];
  bpm = 0;
  constructor(
    readonly settings: () => Setup,
    readonly emit: (tick: Position) => void,
  ) {}
  start() {
    const generation = ++this.generation;
    return new Promise<void>((resolve, reject) => {
      this.pending.push({
        resolve: () => {
          if (!this.disposed && generation === this.generation) this.audible = true;
          resolve();
        },
        reject: () => reject(new Error("permission denied")),
      });
    });
  }
  stop() {
    this.generation++;
    this.audible = false;
  }
  update() {
    this.bpm = this.settings().bpm;
  }
  dispose() {
    this.stop();
    this.disposed = true;
  }
}

// Only tempo matters to this fake; no domain validation is bypassed in the app.
const settings = { bpm: 100 } as Setup;
const tick: Position = { bar: 2, beat: 1, absoluteBar: 6, counting: false };
function harness(strict = false) {
  const engines: FakeEngine[] = [];
  const errors: string[] = [];
  const factory = (getSettings: () => Setup, emit: (tick: Position) => void) => {
    const engine = new FakeEngine(getSettings, emit);
    engines.push(engine);
    return engine;
  };
  const hook = renderHook(
    ({ setup }) => usePlayback(setup, (message) => errors.push(message), factory),
    {
      initialProps: { setup: settings },
      wrapper: strict
        ? ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>
        : undefined,
    },
  );
  return { ...hook, engines, errors };
}

describe("usePlayback", () => {
  it("creates nothing on StrictMode mount, then keeps live settings without rebuilding", async () => {
    const h = harness(true);
    expect(h.engines).toHaveLength(0);
    act(() => {
      void h.result.current.toggle();
    });
    expect(h.result.current.starting).toBe(true);
    await act(async () => h.engines[0].pending[0].resolve());
    h.rerender({ setup: { ...settings, bpm: 137 } });
    expect(h.engines).toHaveLength(1);
    expect(h.engines[0].bpm).toBe(137);
    expect(h.result.current.playing).toBe(true);
    act(() => h.engines[0].emit(tick));
    expect(h.result.current.tick).toEqual(tick);
    h.unmount();
    expect(h.engines[0].disposed).toBe(true);
    expect(h.engines[0].audible).toBe(false);
  });

  it("Stop/track switch invalidates pending starts and stale ticks; newest start wins", async () => {
    const h = harness();
    act(() => {
      void h.result.current.toggle();
    });
    const old = h.engines[0];
    act(() => h.result.current.stop());
    h.rerender({ setup: { ...settings, bpm: 150 } });
    act(() => {
      void h.result.current.toggle();
    });
    const current = h.engines[1];
    await act(async () => old.pending[0].resolve());
    act(() => old.emit(tick));
    expect(old.audible).toBe(false);
    expect(h.result.current.starting).toBe(true);
    expect(h.result.current.tick.beat).toBe(-1);
    await act(async () => current.pending[0].resolve());
    expect(h.result.current.playing).toBe(true);
    expect(current.audible).toBe(true);
    act(() => h.result.current.stop());
    act(() => current.emit(tick));
    expect(h.result.current.tick.beat).toBe(-1);
    expect(current.audible).toBe(false);
  });

  it("toggle during startup cancels; unmount prevents a late start", async () => {
    const h = harness(true);
    act(() => {
      void h.result.current.toggle();
    });
    act(() => {
      void h.result.current.toggle();
    });
    expect(h.result.current.starting).toBe(false);
    await act(async () => h.engines[0].pending[0].resolve());
    expect(h.result.current.playing).toBe(false);
    act(() => {
      void h.result.current.toggle();
    });
    h.unmount();
    await act(async () => h.engines[1].pending[0].resolve());
    expect(h.engines.every((engine) => engine.disposed && !engine.audible)).toBe(true);
  });

  it("shows readable failure and allows retry; stale failures cannot stop a new attempt", async () => {
    const h = harness();
    act(() => {
      void h.result.current.toggle();
    });
    await act(async () => h.engines[0].pending[0].reject());
    expect(h.result.current.starting).toBe(false);
    expect(h.result.current.playing).toBe(false);
    expect(h.errors[0]).toMatch(/sound permissions.*try again/i);
    act(() => {
      void h.result.current.toggle();
    });
    act(() => h.result.current.stop());
    act(() => {
      void h.result.current.toggle();
    });
    await act(async () => h.engines[2].pending[0].resolve());
    await act(async () => h.engines[1].pending[0].reject());
    expect(h.result.current.playing).toBe(true);
    expect(h.engines[2].audible).toBe(true);
    expect(h.errors).toHaveLength(1);
  });

  it("restart resets a stopped clock and replaces active playback from the beginning", async () => {
    const h = harness();
    act(() => h.result.current.setTick(tick));
    await act(async () => h.result.current.restart());
    expect(h.engines).toHaveLength(0);
    expect(h.result.current.tick.beat).toBe(-1);
    act(() => {
      void h.result.current.toggle();
    });
    await act(async () => h.engines[0].pending[0].resolve());
    act(() => h.engines[0].emit(tick));
    act(() => {
      void h.result.current.restart();
    });
    expect(h.engines[0].audible).toBe(false);
    expect(h.result.current.tick.beat).toBe(-1);
    await act(async () => h.engines[1].pending[0].resolve());
    expect(h.result.current.playing).toBe(true);
  });
});
