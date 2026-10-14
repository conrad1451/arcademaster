// src/games/2048/reducer.ts
//
// Whole-game state transitions as a pure reducer. Side effects (submitting the
// score, timers, key/touch listeners) stay in the component.

import {
  addRandomTile,
  checkGameOver,
  createInitialBoard,
  createTileMetadata,
  moveBoard,
  type Board,
  type Direction,
  type Rng,
  type TileInfo,
} from "./logic";

export interface GameState {
  board: Board;
  tileMetadata: TileInfo[][];
  score: number;
  gameOver: boolean;
}

export type GameAction =
  | { type: "MOVE"; direction: Direction }
  | { type: "RESET" }
  | { type: "CLEAR_ANIMATIONS" };

export function createInitialState(
  rng: Rng = Math.random,
  board: Board = createInitialBoard(rng),
): GameState {
  return {
    board,
    tileMetadata: createTileMetadata(board),
    score: 0,
    gameOver: false,
  };
}

export function gameReducer(
  state: GameState,
  action: GameAction,
  rng: Rng = Math.random,
): GameState {
  switch (action.type) {
    case "MOVE": {
      if (state.gameOver) return state;

      const { board: slid, gained, mergedPositions, changed } = moveBoard(
        state.board,
        action.direction,
      );
      if (!changed) return state;

      const board = addRandomTile(slid, rng);
      const merged = new Set(mergedPositions.map(([r, c]) => `${r}-${c}`));

      return {
        board,
        tileMetadata: board.map((row, r) =>
          row.map((value, c) => ({
            value,
            isNew: value !== 0 && state.board[r][c] === 0,
            isMerged: merged.has(`${r}-${c}`),
          })),
        ),
        score: state.score + gained,
        gameOver: checkGameOver(board),
      };
    }

    case "RESET":
      return createInitialState(rng);

    case "CLEAR_ANIMATIONS": {
      const anyFlagged = state.tileMetadata.some((row) =>
        row.some((t) => t.isNew || t.isMerged),
      );
      // Return the SAME object when there is nothing to clear so React bails
      // out of re-rendering.
      if (!anyFlagged) return state;
      return {
        ...state,
        tileMetadata: state.tileMetadata.map((row) =>
          row.map((t) => ({ ...t, isNew: false, isMerged: false })),
        ),
      };
    }
  }
}
