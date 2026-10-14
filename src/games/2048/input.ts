// src/games/2048/input.ts
//
// Pure translation of raw input (keys, touch points) into game directions.

import type { Direction } from "./logic";

/** Minimum finger travel (px) before a touch counts as a swipe, not a tap. */
export const SWIPE_THRESHOLD = 30;

export interface Point {
  x: number;
  y: number;
}

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: "UP",
  ArrowDown: "DOWN",
  ArrowLeft: "LEFT",
  ArrowRight: "RIGHT",
};

export const keyToDirection = (key: string): Direction | null =>
  KEY_TO_DIRECTION[key] ?? null;

/** The direction the finger travelled furthest, or null if it barely moved. */
export function getSwipeDirection(
  start: Point,
  end: Point,
  threshold: number = SWIPE_THRESHOLD,
): Direction | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return null;

  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "RIGHT" : "LEFT";
  return dy > 0 ? "DOWN" : "UP";
}
