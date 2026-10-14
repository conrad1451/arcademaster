// src/games/2048/logic.ts
//
// Pure 2048 rules: no React, no DOM, no network, no hidden randomness.
// Anything random takes an `rng` parameter (defaults to Math.random) so tests
// can pass a deterministic one.

export type Board = number[][];
export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
export type Rng = () => number;

export interface TileInfo {
  value: number;
  isNew: boolean;
  isMerged: boolean;
}

export const BOARD_SIZE = 4;

export function createEmptyBoard(): Board {
  return Array(BOARD_SIZE)
    .fill(0)
    .map(() => Array(BOARD_SIZE).fill(0));
}

/** Add a 2 (90%) or 4 (10%) to a random empty cell. Returns a new board. */
export const addRandomTile = (
  currentBoard: Board,
  rng: Rng = Math.random,
): Board => {
  const emptyCells: [number, number][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (currentBoard[r][c] === 0) emptyCells.push([r, c]);
    }
  }

  if (emptyCells.length === 0) return currentBoard;

  const [r, c] = emptyCells[Math.floor(rng() * emptyCells.length)];
  const newBoard = currentBoard.map((row) => [...row]);
  newBoard[r][c] = rng() < 0.9 ? 2 : 4;
  return newBoard;
};

/** Rotate the board 90° counter-clockwise. */
export const rotateLeft = (matrix: Board): Board => {
  const result = createEmptyBoard();
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      result[BOARD_SIZE - 1 - c][r] = matrix[r][c];
    }
  }
  return result;
};

/**
 * Slide a row to the left and merge equal neighbours (once per tile).
 * `mergedIndices` are the positions in `newRow` that were produced by a merge.
 */
export const slideAndMergeRow = (
  row: number[],
): { newRow: number[]; gainedScore: number; mergedIndices: number[] } => {
  const nonZero = row.filter((val) => val !== 0);
  const newRow: number[] = [];
  const mergedIndices: number[] = [];
  let gainedScore = 0;

  for (let i = 0; i < nonZero.length; i++) {
    if (i < nonZero.length - 1 && nonZero[i] === nonZero[i + 1]) {
      const mergedVal = nonZero[i] * 2;
      mergedIndices.push(newRow.length);
      newRow.push(mergedVal);
      gainedScore += mergedVal;
      i++;
    } else {
      newRow.push(nonZero[i]);
    }
  }

  while (newRow.length < BOARD_SIZE) {
    newRow.push(0);
  }

  return { newRow, gainedScore, mergedIndices };
};

/** True when the board is full and no neighbouring tiles are equal. */
export const checkGameOver = (currentBoard: Board): boolean => {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (currentBoard[r][c] === 0) return false;
      if (c < BOARD_SIZE - 1 && currentBoard[r][c] === currentBoard[r][c + 1])
        return false;
      if (r < BOARD_SIZE - 1 && currentBoard[r][c] === currentBoard[r + 1][c])
        return false;
    }
  }
  return true;
};

// Number of CCW rotations that turn `direction` into "slide left".
const ROTATIONS: Record<Direction, number> = {
  LEFT: 0,
  UP: 1,
  RIGHT: 2,
  DOWN: 3,
};

const rotateTimes = (matrix: Board, times: number): Board => {
  let result = matrix;
  for (let i = 0; i < times; i++) result = rotateLeft(result);
  return result;
};

export interface MoveResult {
  /** Board after sliding/merging, BEFORE a new tile is spawned. */
  board: Board;
  /** Points earned by merges in this move. */
  gained: number;
  /** [row, col] of every tile created by a merge, in board coordinates. */
  mergedPositions: [number, number][];
  /** False when the move didn't change anything (no new tile should spawn). */
  changed: boolean;
}

/** Apply one move to the board. Pure: does not mutate `board`. */
export function moveBoard(board: Board, direction: Direction): MoveResult {
  const rotations = ROTATIONS[direction];
  const rotated = rotateTimes(board, rotations);

  const slid: Board = [];
  const mergeMask = createEmptyBoard();
  let gained = 0;

  rotated.forEach((row, r) => {
    const { newRow, gainedScore, mergedIndices } = slideAndMergeRow(row);
    slid.push(newRow);
    gained += gainedScore;
    mergedIndices.forEach((c) => {
      mergeMask[r][c] = 1;
    });
  });

  // Rotate the result AND the merge mask back to the original orientation.
  const back = (4 - rotations) % 4;
  const next = rotateTimes(slid, back);
  const maskBack = rotateTimes(mergeMask, back);

  const mergedPositions: [number, number][] = [];
  maskBack.forEach((row, r) =>
    row.forEach((flag, c) => {
      if (flag) mergedPositions.push([r, c]);
    }),
  );

  const changed = next.some((row, r) => row.some((v, c) => v !== board[r][c]));

  return { board: next, gained, mergedPositions, changed };
}

/** A fresh board with two starting tiles. */
export const createInitialBoard = (rng: Rng = Math.random): Board => {
  let board = createEmptyBoard();
  board = addRandomTile(board, rng);
  board = addRandomTile(board, rng);
  return board;
};

/** Animation metadata for a freshly set-up board (every tile flagged "new"). */
export const createTileMetadata = (board: Board): TileInfo[][] =>
  board.map((row) =>
    row.map((val) => ({ value: val, isNew: true, isMerged: false })),
  );
