// src/components/games/2048Game.tsx

// CHQ: Gemini AI scaffolded, Claude AI (Sonnet) added a feature, and I edited heavily
// Touch swipe support added for mobile play
// CHQ: Claude AI (Haiku): Added smooth tile animations for movements and merges
//
// Refactor: game rules now live in src/games/2048/{logic,reducer,input}.ts.
// This file keeps only the view and the side effects (listeners, timers, scoring).

import React, { useCallback, useEffect, useReducer, useRef } from "react";

import { submitScore } from "../../utils/submitScore";
import type { Board, TileInfo } from "../../games/2048/logic";
import {
  createInitialState,
  gameReducer,
  type GameAction,
  type GameState,
} from "../../games/2048/reducer";
import {
  getSwipeDirection,
  keyToDirection,
  type Point,
} from "../../games/2048/input";

interface GameProps {
  username?: string;
  /** Called once when the game ends. Defaults to submitting the score. */
  onGameOver?: (score: number) => void;
  /** Starting board (mainly a test seam). Defaults to a random board. */
  initialBoard?: Board;
}

// CHQ: Gemini AI: Color mapping for classic 2048 styling
const getTileStyle = (
  value: number,
  isNew: boolean,
  isMerged: boolean,
): React.CSSProperties => {
  const colors: Record<number, { bg: string; text: string }> = {
    2: { bg: "#eee4da", text: "#776e65" },
    4: { bg: "#ede0c8", text: "#776e65" },
    8: { bg: "#f2b179", text: "#f9f6f2" },
    16: { bg: "#f59563", text: "#f9f6f2" },
    32: { bg: "#f67c5f", text: "#f9f6f2" },
    64: { bg: "#f65e3b", text: "#f9f6f2" },
    128: { bg: "#edcf72", text: "#f9f6f2" },
    256: { bg: "#edcc61", text: "#f9f6f2" },
    512: { bg: "#edc850", text: "#f9f6f2" },
    1024: { bg: "#edc53f", text: "#f9f6f2" },
    2048: { bg: "#edc22e", text: "#f9f6f2" },
  };

  const style = colors[value] || { bg: "#3c3a32", text: "#f9f6f2" };
  return {
    backgroundColor: value === 0 ? "#ccc0b3" : style.bg,
    color: style.text,
    fontSize: value > 512 ? "24px" : "32px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
    userSelect: "none",
    // CHQ: Claude AI (Sonnet): Smooth transitions for all properties
    transition: "all 0.12s ease-in-out",
    // Scale up new tiles
    transform: isNew ? "scale(0.8)" : isMerged ? "scale(1.05)" : "scale(1)",
    // Fade in newly spawned tiles
    opacity: value === 0 ? 1 : isNew ? 0.8 : 1,
  };
};

const GameOverDisplay = (props: { initGame: () => void }) => {
  const { initGame } = props;
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(238, 228, 218, 0.73)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "6px",
        animation: "fadeIn 0.3s ease-in-out",
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
      <h2
        style={{
          fontSize: "36px",
          color: "#776e65",
          margin: "0 0 10px 0",
        }}
      >
        Game Over!
      </h2>
      <button
        onClick={initGame}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          fontWeight: "bold",
          backgroundColor: "#8f7a66",
          color: "#fff",
          border: "none",
          borderRadius: "3px",
          cursor: "pointer",
          transition: "background-color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor = "#9f8a76";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor = "#8f7a66";
        }}
      >
        Try Again
      </button>
    </div>
  );
};

const ScoreBoard = (props: { score: number }) => {
  const { score } = props;
  return (
    <div
      style={{
        marginBottom: "15px",
        fontSize: "20px",
        fontWeight: "bold",
        transition: "color 0.3s ease",
      }}
    >
      Score: {score}
    </div>
  );
};

const NewGameButton = (props: { initGame: () => void }) => {
  const { initGame } = props;
  return (
    <button
      onClick={initGame}
      style={{
        marginTop: "20px",
        padding: "10px 20px",
        fontSize: "16px",
        backgroundColor: "#8f7a66",
        color: "#fff",
        border: "none",
        borderRadius: "3px",
        cursor: "pointer",
        transition: "background-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLButtonElement).style.backgroundColor = "#9f8a76";
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLButtonElement).style.backgroundColor = "#8f7a66";
      }}
    >
      New Game
    </button>
  );
};

// CHQ: Claude AI (Sonnet): added a small hint so mobile players know the board is swipeable
const SwipeHint = () => {
  return (
    <div
      style={{
        marginTop: "10px",
        fontSize: "13px",
        color: "#9c9088",
      }}
    >
      Swipe to move
    </div>
  );
};

// CHQ: Claude AI (Sonnet): added more props to GameBoard
const GameBoard = React.forwardRef<
  HTMLDivElement,
  {
    gameOver: boolean;
    initGame: () => void;
    board: Board;
    tileMetadata: TileInfo[][];
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  }
>((props, ref) => {
  const { gameOver, initGame, board, tileMetadata, onTouchStart, onTouchEnd } =
    props;
  return (
    <div
      ref={ref}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: "relative",
        width: "340px",
        maxWidth: "88vw",
        height: "340px",
        aspectRatio: "1 / 1",
        margin: "0 auto",
        padding: "10px",
        backgroundColor: "#bbada0",
        borderRadius: "6px",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gridTemplateRows: "repeat(4, 1fr)",
        gap: "10px",
        touchAction: "none",
      }}
    >
      {board.map((row, rIdx) =>
        row.map((val, cIdx) => {
          const metadata = tileMetadata[rIdx][cIdx];
          return (
            <div
              key={`${rIdx}-${cIdx}`}
              style={getTileStyle(val, metadata.isNew, metadata.isMerged)}
            >
              {val !== 0 ? val : ""}
            </div>
          );
        }),
      )}

      {gameOver && <GameOverDisplay initGame={initGame} />}
    </div>
  );
});
GameBoard.displayName = "GameBoard";

const reducer = (state: GameState, action: GameAction): GameState =>
  gameReducer(state, action);

export const The2048Game: React.FC<GameProps> = ({
  username = "Guest",
  onGameOver,
  initialBoard,
}) => {
  const [state, dispatch] = useReducer(reducer, initialBoard, (board) =>
    createInitialState(Math.random, board),
  );
  const { board, tileMetadata, score, gameOver } = state;

  // Track where a touch started so we can measure the swipe on release
  const touchStartRef = useRef<Point | null>(null);

  const initGame = useCallback(() => dispatch({ type: "RESET" }), []);

  // Clear animation flags after a delay (so animations finish)
  useEffect(() => {
    const timer = setTimeout(
      () => dispatch({ type: "CLEAR_ANIMATIONS" }),
      150, // Match the transition duration in getTileStyle
    );
    return () => clearTimeout(timer);
  }, [tileMetadata]);

  // Report the final score exactly once per game
  const gameOverHandlerRef = useRef<(finalScore: number) => void>(() => {});
  useEffect(() => {
    gameOverHandlerRef.current =
      onGameOver ??
      ((finalScore) => {
        void submitScore(username, "GAME_2048", finalScore);
      });
  }, [onGameOver, username]);

  useEffect(() => {
    if (gameOver) gameOverHandlerRef.current(score);
  }, [gameOver, score]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const direction = keyToDirection(e.key);
      if (!direction) return;
      e.preventDefault();
      dispatch({ type: "MOVE", direction });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const start = touchStartRef.current;
    if (!start) return;
    touchStartRef.current = null;

    const touch = e.changedTouches[0];
    const direction = getSwipeDirection(start, {
      x: touch.clientX,
      y: touch.clientY,
    });
    if (direction) dispatch({ type: "MOVE", direction });
  }, []);

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        textAlign: "center",
        marginTop: "20px",
      }}
    >
      <h1>2048</h1>
      <ScoreBoard score={score} />
      <GameBoard
        gameOver={gameOver}
        initGame={initGame}
        board={board}
        tileMetadata={tileMetadata}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      <SwipeHint />
      <NewGameButton initGame={initGame} />
    </div>
  );
};
