import type { Setup } from "../domain/types";

export interface Position {
  bar: number;
  beat: number;
  absoluteBar: number;
  counting: boolean;
  eighth?: number;
}

export interface PlaybackEngine {
  start(): Promise<void>;
  stop(): void;
  update(): void;
  dispose(): void;
}

export type PlaybackFactory = (
  getSettings: () => Setup,
  onTick: (tick: Position) => void,
) => PlaybackEngine;

export const stoppedPosition: Position = {
  bar: 0,
  beat: -1,
  absoluteBar: 0,
  counting: false,
};
