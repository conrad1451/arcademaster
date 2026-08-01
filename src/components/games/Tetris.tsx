// CHQ: Gemini AI scaffolded, and I edited heavily

import React, { useState, useEffect, useCallback } from "react";

import type { MouseEventHandler } from "react";

// --- Constants & Config ---
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_DROP_TIME = 800; // ms per tick

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
  collided: boolean;
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
        gridTemplateRows: `repeat(${BOARD_HEIGHT}, 24px)`,
        gridTemplateColumns: `repeat(${BOARD_WIDTH}, 24px)`,
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
              width: "24px",
              height: "24px",
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

const ControlsHints = () => {
  return (
    <div
      style={{
        marginTop: "20px",
        fontSize: "12px",
        color: "#888",
        textAlign: "center",
      }}
    >
      <p>
        Controls: ⬅️ / ➡️ to Move | ⬆️ to Rotate | ⬇️ to Soft Drop | Space to
        Hard Drop
      </p>
      <p>Click on the game area to ensure keyboard focus.</p>
    </div>
  );
};

// --- Main Component ---
export const Tetris: React.FC = () => {
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
    collided: false,
  });

  // Spawn new tetromino
  const resetPlayer = useCallback(() => {
    const nextTetromino = getRandomTetromino();
    setPlayer({
      pos: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 },
      tetromino: nextTetromino.shape,
      color: nextTetromino.color,
      collided: false,
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

  const drop = () => {
    // Increase speed as levels progress
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
      // Game Over condition (collided at top)
      if (player.pos.y < 1) {
        setGameOver(true);
        setDropTime(null);
        return;
      }
      setPlayer((prev) => ({ ...prev, collided: true }));
    }
  };

  const hardDrop = () => {
    let currentY = player.pos.y;
    while (
      !checkCollision(player, grid, { x: 0, y: currentY - player.pos.y + 1 })
    ) {
      currentY++;
    }
    setPlayer((prev) => ({
      ...prev,
      pos: { x: prev.pos.x, y: currentY },
      collided: true,
    }));
  };

  // Merging current piece into board & handling line sweeps
  useEffect(() => {
    if (player.collided) {
      // 1. Merge piece into grid
      const newGrid = grid.map((row) => [...row]);
      player.tetromino.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            const gridY = y + player.pos.y;
            const gridX = x + player.pos.x;
            if (
              gridY >= 0 &&
              gridY < BOARD_HEIGHT &&
              gridX >= 0 &&
              gridX < BOARD_WIDTH
            ) {
              newGrid[gridY][gridX] = [player.color, "merged"];
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
    }
  }, [
    player.collided,
    player.pos,
    player.tetromino,
    player.color,
    grid,
    level,
    resetPlayer,
  ]);

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

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#1a1a1a",
        color: "#ffffff",
        fontFamily: "monospace, sans-serif",
        outline: "none",
      }}
    >
      <h1 style={{ marginBottom: "10px" }}>TETRIS</h1>

      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
        {/* Game Board */}
        <GameBoard displayGrid={displayGrid} />

        {/* Sidebar Info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            minWidth: "120px",
          }}
        >
          <Score score={score} />

          <Lines lines={lines} />

          <LevelIndicator level={level} />

          <StartGameButton startGame={startGame} gameOver={gameOver} />

          {gameOver && <GameOverScreen />}
        </div>
      </div>

      {/* Controls Hint */}
      <ControlsHints />
    </div>
  );
};

export default Tetris;
