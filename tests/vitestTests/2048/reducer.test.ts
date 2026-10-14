// tests/vitestTests/2048/reducer.test.ts

import { describe, it, expect } from "vitest";
import type { Board } from "../../../src/games/2048/logic";
import {
  createInitialState,
  gameReducer,
} from "../../../src/games/2048/reducer";

// Always picks the first empty cell and spawns a 2.
const rng = () => 0;

// One UP move merges the two 8s in column 1 (+16) and, with rng=0, the spawned
// 2 fills the last gap, leaving a full board with no equal neighbours.
export const LAST_MOVE_BOARD: Board = [
  [4, 8, 4, 8],
  [16, 8, 16, 4],
  [2, 2, 4, 8],
  [4, 8, 16, 2],
];

describe("createInitialState", () => {
  it("starts with score 0, not over, and two tiles", () => {
    const s = createInitialState(rng);
    expect(s.score).toBe(0);
    expect(s.gameOver).toBe(false);
    expect(s.board.flat().filter(Boolean)).toHaveLength(2);
  });

  it("accepts a starting board", () => {
    const s = createInitialState(rng, LAST_MOVE_BOARD);
    expect(s.board).toBe(LAST_MOVE_BOARD);
  });
});

describe("gameReducer MOVE", () => {
  const start: Board = [
    [2, 2, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];

  it("merges, scores, and spawns exactly one new tile", () => {
    const s = gameReducer(
      createInitialState(rng, start),
      { type: "MOVE", direction: "LEFT" },
      rng,
    );
    expect(s.score).toBe(4);
    expect(s.board[0][0]).toBe(4);
    // 4 (merged) + one spawned 2
    expect(s.board.flat().filter(Boolean)).toHaveLength(2);
    expect(s.gameOver).toBe(false);
  });

  it("flags the merged tile and the spawned tile for animation", () => {
    const s = gameReducer(
      createInitialState(rng, [
        [0, 0, 2, 2],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
      { type: "MOVE", direction: "LEFT" },
      rng,
    );
    expect(s.tileMetadata[0][0].isMerged).toBe(true);
    // rng=0 spawns in the first empty cell: [0][1]
    expect(s.tileMetadata[0][1].isNew).toBe(true);
    expect(s.tileMetadata[3][3].isNew).toBe(false);
  });

  // Pre-existing behaviour, kept as-is by the refactor: `isNew` is computed
  // against the board BEFORE the move, so any tile that lands on a
  // previously-empty cell counts as "new" (not just the spawned one).
  it.todo("flags only the spawned tile as isNew");

  it("returns the same state object for a move that changes nothing", () => {
    const packed: Board = [
      [2, 4, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const before = createInitialState(rng, packed);
    expect(
      gameReducer(before, { type: "MOVE", direction: "LEFT" }, rng),
    ).toBe(before);
  });

  it("accumulates score across moves", () => {
    let s = createInitialState(rng, start);
    s = gameReducer(s, { type: "MOVE", direction: "LEFT" }, rng);
    expect(s.score).toBe(4);
    s = { ...s, board: [[2, 2, 0, 0], ...s.board.slice(1)] };
    s = gameReducer(s, { type: "MOVE", direction: "LEFT" }, rng);
    expect(s.score).toBe(8);
  });

  it("ends the game when the board fills with no moves left", () => {
    const s = gameReducer(
      createInitialState(rng, LAST_MOVE_BOARD),
      { type: "MOVE", direction: "UP" },
      rng,
    );
    expect(s.gameOver).toBe(true);
    expect(s.score).toBe(16);
  });

  it("ignores moves once the game is over", () => {
    const over = gameReducer(
      createInitialState(rng, LAST_MOVE_BOARD),
      { type: "MOVE", direction: "UP" },
      rng,
    );
    expect(
      gameReducer(over, { type: "MOVE", direction: "LEFT" }, rng),
    ).toBe(over);
  });
});

describe("gameReducer RESET", () => {
  it("returns a fresh game", () => {
    const over = gameReducer(
      createInitialState(rng, LAST_MOVE_BOARD),
      { type: "MOVE", direction: "UP" },
      rng,
    );
    const fresh = gameReducer(over, { type: "RESET" }, rng);
    expect(fresh.gameOver).toBe(false);
    expect(fresh.score).toBe(0);
    expect(fresh.board.flat().filter(Boolean)).toHaveLength(2);
  });
});

describe("gameReducer CLEAR_ANIMATIONS", () => {
  it("clears isNew / isMerged flags", () => {
    const s = createInitialState(rng); // all tiles start flagged isNew
    const cleared = gameReducer(s, { type: "CLEAR_ANIMATIONS" });
    expect(
      cleared.tileMetadata.flat().some((t) => t.isNew || t.isMerged),
    ).toBe(false);
  });

  it("returns the same object when nothing is flagged (no re-render loop)", () => {
    const cleared = gameReducer(createInitialState(rng), {
      type: "CLEAR_ANIMATIONS",
    });
    expect(gameReducer(cleared, { type: "CLEAR_ANIMATIONS" })).toBe(cleared);
  });
});
