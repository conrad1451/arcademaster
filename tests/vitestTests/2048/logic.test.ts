// tests/vitestTests/2048/logic.test.ts

import { describe, it, expect } from "vitest";
import {
  addRandomTile,
  checkGameOver,
  createEmptyBoard,
  createInitialBoard,
  createTileMetadata,
  moveBoard,
  rotateLeft,
  slideAndMergeRow,
  type Board,
} from "../../../src/games/2048/logic";

const countTiles = (b: Board) => b.flat().filter((v) => v !== 0).length;

describe("slideAndMergeRow", () => {
  it.each([
    [[0, 0, 0, 0], [0, 0, 0, 0], 0],
    [[2, 0, 0, 0], [2, 0, 0, 0], 0],
    [[0, 0, 0, 2], [2, 0, 0, 0], 0],
    [[2, 0, 2, 0], [4, 0, 0, 0], 4],
    [[2, 2, 2, 2], [4, 4, 0, 0], 8],
    [[2, 2, 2, 0], [4, 2, 0, 0], 4],
    [[4, 2, 2, 0], [4, 4, 0, 0], 4],
    [[2, 4, 8, 16], [2, 4, 8, 16], 0],
  ])("slides %j -> %j (+%i)", (row, expected, gained) => {
    const result = slideAndMergeRow(row);
    expect(result.newRow).toEqual(expected);
    expect(result.gainedScore).toBe(gained);
  });

  it("merges each tile at most once per move", () => {
    expect(slideAndMergeRow([4, 2, 2, 4]).newRow).toEqual([4, 4, 4, 0]);
  });

  it("reports only the merged positions", () => {
    expect(slideAndMergeRow([2, 2, 4, 0]).mergedIndices).toEqual([0]);
    expect(slideAndMergeRow([2, 2, 4, 4]).mergedIndices).toEqual([0, 1]);
    expect(slideAndMergeRow([2, 4, 8, 16]).mergedIndices).toEqual([]);
  });
});

describe("rotateLeft", () => {
  it("rotates counter-clockwise", () => {
    const b: Board = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
      [13, 14, 15, 16],
    ];
    expect(rotateLeft(b)).toEqual([
      [4, 8, 12, 16],
      [3, 7, 11, 15],
      [2, 6, 10, 14],
      [1, 5, 9, 13],
    ]);
  });

  it("returns to the original after four rotations", () => {
    const b: Board = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
      [13, 14, 15, 16],
    ];
    expect(rotateLeft(rotateLeft(rotateLeft(rotateLeft(b))))).toEqual(b);
  });
});

describe("addRandomTile", () => {
  it("adds exactly one tile and does not mutate the input", () => {
    const empty = createEmptyBoard();
    const next = addRandomTile(empty, () => 0.5);
    expect(countTiles(empty)).toBe(0);
    expect(countTiles(next)).toBe(1);
  });

  it("spawns a 2 below the 0.9 threshold and a 4 at or above it", () => {
    expect(addRandomTile(createEmptyBoard(), () => 0).flat()).toContain(2);
    expect(addRandomTile(createEmptyBoard(), () => 0.95).flat()).toContain(4);
  });

  it("only uses empty cells", () => {
    const b: Board = [
      [2, 2, 2, 2],
      [2, 2, 2, 2],
      [2, 2, 2, 2],
      [2, 2, 2, 0],
    ];
    expect(addRandomTile(b, () => 0)[3][3]).toBe(2);
  });

  it("returns the board unchanged when it is full", () => {
    const full: Board = Array.from({ length: 4 }, () => [2, 4, 2, 4]);
    expect(addRandomTile(full, () => 0)).toBe(full);
  });
});

describe("checkGameOver", () => {
  it("is false when a cell is empty", () => {
    expect(checkGameOver(createEmptyBoard())).toBe(false);
  });

  it("is false when a horizontal or vertical merge is possible", () => {
    const horizontal: Board = [
      [2, 2, 4, 8],
      [4, 8, 2, 4],
      [8, 4, 8, 2],
      [2, 8, 4, 8],
    ];
    const vertical: Board = [
      [2, 4, 2, 4],
      [2, 8, 4, 2],
      [8, 4, 8, 4],
      [4, 8, 2, 8],
    ];
    expect(checkGameOver(horizontal)).toBe(false);
    expect(checkGameOver(vertical)).toBe(false);
  });

  it("is true for a full board with no equal neighbours", () => {
    const stuck: Board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(checkGameOver(stuck)).toBe(true);
  });
});

describe("moveBoard", () => {
  const board: Board = [
    [2, 0, 0, 2],
    [0, 4, 4, 0],
    [0, 0, 0, 0],
    [8, 0, 0, 0],
  ];

  it("slides and merges LEFT", () => {
    const r = moveBoard(board, "LEFT");
    expect(r.board).toEqual([
      [4, 0, 0, 0],
      [8, 0, 0, 0],
      [0, 0, 0, 0],
      [8, 0, 0, 0],
    ]);
    expect(r.gained).toBe(12);
    expect(r.changed).toBe(true);
  });

  it("slides and merges RIGHT", () => {
    expect(moveBoard(board, "RIGHT").board).toEqual([
      [0, 0, 0, 4],
      [0, 0, 0, 8],
      [0, 0, 0, 0],
      [0, 0, 0, 8],
    ]);
  });

  it("slides UP and DOWN", () => {
    const col: Board = [
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [4, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    expect(moveBoard(col, "UP").board.map((r) => r[0])).toEqual([4, 4, 0, 0]);
    expect(moveBoard(col, "DOWN").board.map((r) => r[0])).toEqual([0, 0, 4, 4]);
  });

  it("does not mutate the input board", () => {
    const copy = board.map((r) => [...r]);
    moveBoard(board, "UP");
    expect(board).toEqual(copy);
  });

  it("reports changed=false for a move that does nothing", () => {
    const packed: Board = [
      [2, 4, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const r = moveBoard(packed, "LEFT");
    expect(r.changed).toBe(false);
    expect(r.gained).toBe(0);
  });

  describe("mergedPositions (board coordinates, for every direction)", () => {
    // Two 2s that merge into a single 4 at the expected cell.
    it("LEFT: merge lands on the left", () => {
      const b: Board = [
        [2, 2, 4, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      // Only [0][0] merged; the 4 beside it is a plain tile.
      expect(moveBoard(b, "LEFT").mergedPositions).toEqual([[0, 0]]);
    });

    it("RIGHT: merge lands on the right", () => {
      const b: Board = [
        [0, 4, 2, 2],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      expect(moveBoard(b, "RIGHT").mergedPositions).toEqual([[0, 3]]);
    });

    it("UP: merge lands at the top of the column", () => {
      const b: Board = [
        [0, 8, 0, 0],
        [0, 8, 0, 0],
        [0, 2, 0, 0],
        [0, 0, 0, 0],
      ];
      expect(moveBoard(b, "UP").mergedPositions).toEqual([[0, 1]]);
    });

    it("DOWN: merge lands at the bottom of the column", () => {
      const b: Board = [
        [0, 0, 0, 0],
        [0, 2, 0, 0],
        [0, 8, 0, 0],
        [0, 8, 0, 0],
      ];
      expect(moveBoard(b, "DOWN").mergedPositions).toEqual([[3, 1]]);
    });

    it("every reported position holds a merged (doubled) value", () => {
      const b: Board = [
        [4, 8, 4, 8],
        [16, 8, 16, 4],
        [2, 2, 4, 8],
        [4, 8, 16, 2],
      ];
      const r = moveBoard(b, "UP");
      expect(r.gained).toBe(16);
      expect(r.mergedPositions).toEqual([[0, 1]]);
      expect(r.board[0][1]).toBe(16);
    });
  });

  it("conserves the sum of tiles (merging never creates or loses value)", () => {
    const sum = (b: Board) => b.flat().reduce((a, v) => a + v, 0);
    for (const dir of ["UP", "DOWN", "LEFT", "RIGHT"] as const) {
      expect(sum(moveBoard(board, dir).board)).toBe(sum(board));
    }
  });
});

describe("createInitialBoard / createTileMetadata", () => {
  it("starts with two tiles", () => {
    expect(countTiles(createInitialBoard(() => 0.3))).toBe(2);
  });

  it("flags every cell as new, not merged", () => {
    const meta = createTileMetadata(createEmptyBoard());
    expect(meta.flat().every((t) => t.isNew && !t.isMerged)).toBe(true);
  });
});
