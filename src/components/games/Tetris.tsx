// CHQ: Gemini AI scaffolded, and I edited heavily

import React, { useState, useEffect, useCallback } from "react";

import type { MouseEventHandler } from "react";
import { submitScore } from "../../utils/submitScore"; // CHQ: I import and use this
interface GameProps {
  username?: string;
}

// --- Constants & Config ---
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_DROP_TIME = 800; // ms per tick
// CHQ: Claude AI (Sonnet): cell size shrinks on narrow phone screens via the min() below,
// but never grows past this on desktop
const CELL_SIZE = "min(16px, 7.5vw)";

// Tetromino definitions (Shape matrices & hex colors)
const TETROMINOES = {
  I: {
    shape: [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
    color: "#00f0f0",
  },
  J: {
    shape: [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
    color: "#0000f0",
  },
  L: {
    shape: [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    color: "#f0a000",
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "#f0f000",
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: "#00f000",
  },
  T: {
    shape: [
      [1, 1, 1],
      [0, 1, 0],
      [0, 0, 0],
    ],
    color: "#a000f0",
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: "#f00000",
  },
};

type TetrominoType = keyof typeof TETROMINOES;

// Grid cell structure: [color, occupiedState]
type Cell = [string, string]; // e.g. ['#000000', 'clear'] or ['#00f0f0', 'merged']
type Grid = Cell[][];

interface Player {
  pos: { x: number; y: number };
  tetromino: number[][];
  color: string;
}

// --- Helper Functions ---
const createEmptyGrid = (): Grid =>
  Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => ["#000000", "clear"] as Cell),
  );

const getRandomTetromino = () => {
  const types: TetrominoType[] = ["I", "J", "L", "O", "S", "T", "Z"];
  const randType = types[Math.floor(Math.random() * types.length)];
  return TETROMINOES[randType];
};

const checkCollision = (
  player: Player,
  grid: Grid,
  moveOffset: { x: number; y: number },
): boolean => {
  const { tetromino, pos } = player;

  for (let y = 0; y < tetromino.length; y += 1) {
    for (let x = 0; x < tetromino[y].length; x += 1) {
      if (tetromino[y][x] !== 0) {
        const newY = y + pos.y + moveOffset.y;
        const newX = x + pos.x + moveOffset.x;

        // Check if inside vertical boundaries
        if (newY >= BOARD_HEIGHT || newY < 0) return true;
        // Check if inside horizontal boundaries
        if (newX >= BOARD_WIDTH || newX < 0) return true;
        // Check if destination cell is already merged
        if (grid[newY]?.[newX]?.[1] === "merged") return true;
      }
    }
  }
  return false;
};

// --- Helper Components ---

const GameBoard = (props: { displayGrid: Cell[][] }) => {
  const { displayGrid } = props;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: `repeat(${BOARD_HEIGHT}, ${CELL_SIZE})`,
        gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE})`,
        gap: "1px",
        backgroundColor: "#333",
        border: "3px solid #555",
        borderRadius: "4px",
        padding: "2px",
      }}
    >
      {displayGrid.map((row, rIdx) =>
        row.map(([color], cIdx) => (
          <div
            key={`${rIdx}-${cIdx}`}
            style={{
              // CHQ: Claude AI (Sonnet): fill whatever size the grid
              // track ends up being (driven by CELL_SIZE) instead of
              // a fixed pixel size, so the board shrinks to fit
              // narrow phone screens
              width: "100%",
              height: "100%",
              backgroundColor: color !== "#000000" ? color : "#111111",
              borderRadius: "2px",
              boxShadow:
                color !== "#000000"
                  ? "inset 2px 2px 4px rgba(255,255,255,0.3), inset -2px -2px 4px rgba(0,0,0,0.4)"
                  : "none",
            }}
          />
        )),
      )}
    </div>
  );
};

const Score = (props: { score: number }) => {
  const { score } = props;

  return (
    <div
      style={{
        background: "#2a2a2a",
        padding: "10px",
        borderRadius: "4px",
      }}
    >
      <div>SCORE</div>
      <div style={{ fontSize: "20px", fontWeight: "bold" }}>{score}</div>
    </div>
  );
};

const Lines = (props: { lines: number }) => {
  const { lines } = props;

  return (
    <div
      style={{
        background: "#2a2a2a",
        padding: "10px",
        borderRadius: "4px",
      }}
    >
      <div>LINES</div>
      <div style={{ fontSize: "20px", fontWeight: "bold" }}>{lines}</div>
    </div>
  );
};

const LevelIndicator = (props: { level: number }) => {
  const { level } = props;
  return (
    <div
      style={{
        background: "#2a2a2a",
        padding: "10px",
        borderRadius: "4px",
      }}
    >
      <div>LEVEL</div>
      <div style={{ fontSize: "20px", fontWeight: "bold" }}>{level}</div>
    </div>
  );
};

const GameOverScreen = () => {
  return (
    <div
      style={{
        color: "#ff4d4d",
        fontWeight: "bold",
        textAlign: "center",
      }}
    >
      GAME OVER
    </div>
  );
};

const StartGameButton = (props: {
  startGame: MouseEventHandler<HTMLButtonElement>;
  gameOver: boolean;
}) => {
  const { startGame, gameOver } = props;
  return (
    <button
      onClick={startGame}
      style={{
        padding: "10px",
        fontSize: "14px",
        fontWeight: "bold",
        cursor: "pointer",
        backgroundColor: "#00f0f0",
        border: "none",
        borderRadius: "4px",
        color: "#000",
      }}
    >
      {gameOver ? "RETRY" : "START / RESET"}
    </button>
  );
};

// CHQ: Claude AI (Sonnet): trimmed to a single line - the old second
// paragraph about clicking to focus was dead advice on touch devices
// and was one of several things pushing content below the fold on
// short mobile screens
const ControlsHints = () => {
  return (
    <div
      style={{
        marginTop: "12px",
        fontSize: "12px",
        color: "#888",
        textAlign: "center",
      }}
    >
      <p style={{ margin: 0 }}>
        Controls: ⬅️ / ➡️ Move | ⬆️ Rotate | ⬇️ Soft Drop | Space Hard Drop
      </p>
    </div>
  );
};

// CHQ: Claude AI (Sonnet): On-screen D-pad for phones/tablets,
// since there's no keyboard. Buttons use onClick (which
// touchscreens fire fine) plus touchAction: "manipulation"
// so there's no ~300ms tap delay.
// CHQ: Claude AI (Sonnet): shrank button size/gaps (56px->44px,
// 10px->6px gaps) - this was one of the biggest contributors to
// the whole layout not fitting on a phone screen without scrolling
const TouchControls = (props: {
  onLeft: () => void;
  onRight: () => void;
  onRotate: () => void;
  onSoftDrop: () => void;
  onHardDrop: () => void;
}) => {
  const { onLeft, onRight, onRotate, onSoftDrop, onHardDrop } = props;

  const buttonStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: "bold",
    padding: "12px",
    minWidth: "44px",
    minHeight: "44px",
    backgroundColor: "#2a2a2a",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: "8px",
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    userSelect: "none",
  };

  return (
    <div
      style={{
        marginTop: "12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <div style={{ display: "flex", gap: "6px" }}>
        <button style={buttonStyle} onClick={onRotate} aria-label="Rotate">
          ⟳
        </button>
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
        <button style={buttonStyle} onClick={onLeft} aria-label="Move left">
          ⬅️
        </button>
        <button style={buttonStyle} onClick={onSoftDrop} aria-label="Soft drop">
          ⬇️
        </button>
        <button style={buttonStyle} onClick={onRight} aria-label="Move right">
          ➡️
        </button>
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
        <button
          style={{
            ...buttonStyle,
            minWidth: "160px",
            backgroundColor: "#00f0f0",
            color: "#000",
          }}
          onClick={onHardDrop}
          aria-label="Hard drop"
        >
          HARD DROP
        </button>
      </div>
    </div>
  );
};

// --- Main Component ---
export const Tetris: React.FC<GameProps> = ({ username = "Guest" }) => {
  const [grid, setGrid] = useState<Grid>(createEmptyGrid());
  const [score, setScore] = useState<number>(0);
  const [lines, setLines] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [dropTime, setDropTime] = useState<number | null>(null);

  const [player, setPlayer] = useState<Player>({
    pos: { x: 0, y: 0 },
    tetromino: [[0]],
    color: "#000000",
  });

  // Spawn new tetromino
  const resetPlayer = useCallback(() => {
    const nextTetromino = getRandomTetromino();
    setPlayer({
      pos: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 },
      tetromino: nextTetromino.shape,
      color: nextTetromino.color,
    });
  }, []);

  const startGame = () => {
    setGrid(createEmptyGrid());
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setDropTime(INITIAL_DROP_TIME);
    resetPlayer();
  };

  // Rotate Matrix
  const rotateMatrix = (matrix: number[][]): number[][] => {
    return matrix[0].map((_, index) =>
      matrix.map((row) => row[index]).reverse(),
    );
  };

  const playerRotate = () => {
    const clonedPlayer = JSON.parse(JSON.stringify(player));
    clonedPlayer.tetromino = rotateMatrix(clonedPlayer.tetromino);

    // Basic wall kick handling
    const pos = clonedPlayer.pos.x;
    let offset = 1;
    while (checkCollision(clonedPlayer, grid, { x: 0, y: 0 })) {
      clonedPlayer.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > clonedPlayer.tetromino[0].length) {
        // Rotation not possible, revert
        clonedPlayer.pos.x = pos;
        return;
      }
    }
    setPlayer(clonedPlayer);
  };

  const movePlayer = (dir: number) => {
    if (!checkCollision(player, grid, { x: dir, y: 0 })) {
      setPlayer((prev) => ({
        ...prev,
        pos: { x: prev.pos.x + dir, y: prev.pos.y },
      }));
    }
  };

  // CHQ: Claude AI (Sonnet): Locking a piece (merge into grid,
  // clear lines, update score, spawn next piece) used to live
  // in a useEffect keyed off a `player.collided` flag. That
  // caused setState calls to run synchronously inside an effect
  // body, which React warns about (cascading renders). It's
  // moved here into a plain function that's called directly
  // from the drop/hardDrop event handlers instead - no effect,
  // no flag needed.
  const lockPiece = useCallback(
    (finalPlayer: Player) => {
      // Game Over condition (collided at top)
      if (finalPlayer.pos.y < 1) {
        setGameOver(true);
        submitScore(username, "TETRIS", score);
        setDropTime(null);
        return;
      }

      // 1. Merge piece into grid
      const newGrid = grid.map((row) => [...row]);
      finalPlayer.tetromino.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            const gridY = y + finalPlayer.pos.y;
            const gridX = x + finalPlayer.pos.x;
            if (
              gridY >= 0 &&
              gridY < BOARD_HEIGHT &&
              gridX >= 0 &&
              gridX < BOARD_WIDTH
            ) {
              newGrid[gridY][gridX] = [finalPlayer.color, "merged"];
            }
          }
        });
      });

      // 2. Clear completed rows
      let rowsCleared = 0;
      const sweptGrid = newGrid.reduce((acc, row) => {
        if (row.every((cell) => cell[1] === "merged")) {
          rowsCleared += 1;
          acc.unshift(
            Array.from(
              { length: BOARD_WIDTH },
              () => ["#000000", "clear"] as Cell,
            ),
          );
        } else {
          acc.push(row);
        }
        return acc;
      }, [] as Grid);

      if (rowsCleared > 0) {
        // Standard Tetris scoring multiplier
        const linePoints = [0, 40, 100, 300, 1200];
        setScore((prev) => prev + linePoints[rowsCleared] * level);
        setLines((prev) => prev + rowsCleared);
      }

      setGrid(sweptGrid);
      resetPlayer();
    },
    [grid, level, resetPlayer, score, username],
  );

  const drop = () => {
    // CHQ: Claude AI (Sonnet): Increase speed as levels progress
    if (lines >= level * 10) {
      setLevel((prev) => prev + 1);
      setDropTime((prev) =>
        prev ? Math.max(100, prev - 100) : INITIAL_DROP_TIME,
      );
    }

    if (!checkCollision(player, grid, { x: 0, y: 1 })) {
      setPlayer((prev) => ({
        ...prev,
        pos: { x: prev.pos.x, y: prev.pos.y + 1 },
      }));
    } else {
      lockPiece(player);
    }
  };

  const hardDrop = () => {
    let currentY = player.pos.y;
    while (
      !checkCollision(player, grid, { x: 0, y: currentY - player.pos.y + 1 })
    ) {
      currentY++;
    }
    lockPiece({ ...player, pos: { x: player.pos.x, y: currentY } });
  };

  // Game Loop Ticker
  useEffect(() => {
    if (!dropTime || gameOver) return;
    const interval = setInterval(() => {
      drop();
    }, dropTime);
    return () => clearInterval(interval);
  }, [dropTime, gameOver, player, grid]);

  // Controls handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (gameOver) return;

    if (e.key === "ArrowLeft") {
      movePlayer(-1);
    } else if (e.key === "ArrowRight") {
      movePlayer(1);
    } else if (e.key === "ArrowDown") {
      drop();
    } else if (e.key === "ArrowUp") {
      playerRotate();
    } else if (e.key === " ") {
      e.preventDefault();
      hardDrop();
    }
  };

  // Prepare display grid (overlay active piece on top of saved grid)
  const displayGrid = grid.map((row) => [...row]);
  if (!gameOver) {
    player.tetromino.forEach((row, y) => {
      row.forEach((val, x) => {
        if (val !== 0) {
          const boardY = y + player.pos.y;
          const boardX = x + player.pos.x;
          if (
            boardY >= 0 &&
            boardY < BOARD_HEIGHT &&
            boardX >= 0 &&
            boardX < BOARD_WIDTH
          ) {
            displayGrid[boardY][boardX] = [player.color, "clear"];
          }
        }
      });
    });
  }

  //  CHQ: Claude AI (Sonnet): tabIndex div was minHeight: "100vh" - Tetris now
  // renders *inside* FirstApp's own full-viewport wrapper (plus a
  // "Back to Home" button above it), so forcing another full
  // viewport height here just pushed everything below the fold on
  // mobile. Let content size itself naturally instead.

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "auto",
        backgroundColor: "#1a1a1a",
        color: "#ffffff",
        fontFamily: "monospace, sans-serif",
        outline: "none",
        padding: "10px",
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ margin: "0 0 10px 0", fontSize: "24px" }}>TETRIS</h1>

      <div
        style={{
          display: "flex",
          gap: "20px",
          alignItems: "flex-start",
          // CHQ: let the sidebar wrap below the board on narrow phones
          // instead of squeezing everything into one row
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/* Game Board */}
        <GameBoard displayGrid={displayGrid} />

        {/* Sidebar Info */}

        <div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "2px",
              minWidth: "12px",
              maxWidth: "20vw",
            }}
          >
            <Score score={score} />

            <Lines lines={lines} />

            <LevelIndicator level={level} />

            <StartGameButton startGame={startGame} gameOver={gameOver} />

            {gameOver && <GameOverScreen />}
          </div>

          {/* CHQ: Claude AI (Sonnet): Touch controls - only
          useful on touch devices, but harmless
          (just extra buttons) if shown on desktop too */}
          <TouchControls
            onLeft={() => !gameOver && movePlayer(-1)}
            onRight={() => !gameOver && movePlayer(1)}
            onRotate={() => !gameOver && playerRotate()}
            onSoftDrop={() => !gameOver && drop()}
            onHardDrop={() => !gameOver && hardDrop()}
          />

          {/* Controls Hint */}
          <ControlsHints />
        </div>
      </div>
    </div>
  );
};

export default Tetris;
