// tests/vitestTests/2048/input.test.ts

import { describe, it, expect } from "vitest";
import {
  SWIPE_THRESHOLD,
  getSwipeDirection,
  keyToDirection,
} from "../../../src/games/2048/input";

describe("keyToDirection", () => {
  it.each([
    ["ArrowUp", "UP"],
    ["ArrowDown", "DOWN"],
    ["ArrowLeft", "LEFT"],
    ["ArrowRight", "RIGHT"],
  ])("%s -> %s", (key, dir) => {
    expect(keyToDirection(key)).toBe(dir);
  });

  it("ignores other keys", () => {
    expect(keyToDirection("a")).toBeNull();
    expect(keyToDirection("Enter")).toBeNull();
  });
});

describe("getSwipeDirection", () => {
  const o = { x: 100, y: 100 };

  it("detects the four directions", () => {
    expect(getSwipeDirection(o, { x: 200, y: 105 })).toBe("RIGHT");
    expect(getSwipeDirection(o, { x: 0, y: 95 })).toBe("LEFT");
    expect(getSwipeDirection(o, { x: 105, y: 200 })).toBe("DOWN");
    expect(getSwipeDirection(o, { x: 95, y: 0 })).toBe("UP");
  });

  it("treats short movement as a tap", () => {
    expect(getSwipeDirection(o, { x: 100 + SWIPE_THRESHOLD - 1, y: 100 })).toBeNull();
    expect(getSwipeDirection(o, o)).toBeNull();
  });

  it("accepts movement exactly at the threshold", () => {
    expect(getSwipeDirection(o, { x: 100 + SWIPE_THRESHOLD, y: 100 })).toBe("RIGHT");
  });

  it("follows the axis with the larger travel on diagonals", () => {
    expect(getSwipeDirection(o, { x: 160, y: 140 })).toBe("RIGHT");
    expect(getSwipeDirection(o, { x: 140, y: 160 })).toBe("DOWN");
  });

  it("accepts a custom threshold", () => {
    expect(getSwipeDirection(o, { x: 110, y: 100 }, 5)).toBe("RIGHT");
  });
});
