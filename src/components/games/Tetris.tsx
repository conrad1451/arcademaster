// src/components/games/Tetris.tsx

// CHQ: scaffoled with Gemini AI, and edited manually and with Claude AI (Sonnet)

import React, { useState, useEffect, useCallback, useRef } from "react";
import type { MouseEventHandler } from "react";
import { submitScore } from "../../utils/submitScore";

interface GameProps {
  username?: string;
}

// --- Constants & Config ---
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_DROP_TIME = 800; // ms per tick
const CELL_SIZE = "min(16px, 7.5vw)";

// Tetromino definitions
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
type Cell = [string, string]; // [color, state]
type Grid = Cell[][];

interface Player {
  pos: { x: number; y: number };
  tetromino: number[][];
  color: string;
  type: TetrominoType;
}

// --- Helper Functions ---
const createEmptyGrid = (): Grid =>
  Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => ["#000000", "clear"] as Cell)
  );

const getRandomTetrominoType = (): TetrominoType => {
  const types: TetrominoType[] = ["I", "J", "L", "O", "S", "T", "Z"];
  return types[Math.floor(Math.random() * types.length)];
};

const checkCollision = (
  player: Player,
  grid: Grid,
  moveOffset: { x: number; y: number }
): boolean => {
  const { tetromino, pos } = player;

  for (let y = 0; y < tetromino.length; y += 1) {
    for (let x = 0; x < tetromino[y].length; x += 1) {
      if (tetromino[y][x] !== 0) {
        const newY = y + pos.y + moveOffset.y;
        const newX = x + pos.x + moveOffset.x;

        if (newY >= BOARD_HEIGHT || newY < 0) return true;
        if (newX >= BOARD_WIDTH || newX < 0) return true;
        if (grid[newY]?.[newX]?.[1] === "merged") return true;
      }
    }
  }
  return false;
};

// CHQ: Gemini AI: Helper component for Next and Hold previews
const MiniPiecePreview = ({
  title,
  type,
}: {
  title: string;
  type: TetrominoType | null;
}) => {
  const previewGrid = Array.from({ length: 4 }, () => Array(4).fill(0));
  const piece = type ? TETROMINOES[type] : null;

  if (piece) {
    const shape = piece.shape;
    const yOffset = Math.floor((4 - shape.length) / 2);
    const xOffset = Math.floor((4 - shape[0].length) / 2);

    shape.forEach((row, y) => {
      row.forEach((val, x) => {
        if (val !== 0) {
          previewGrid[y + yOffset][x + xOffset] = piece.color;
        }
      });
    });
  }

  return (
    <div
      style={{
        background: "#2a2a2a",
        padding: "8px",
        borderRadius: "4px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: 1,
      }}
    >
      <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "4px" }}>
        {title}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateRows: `repeat(4, ${CELL_SIZE})`,
          gridTemplateColumns: `repeat(4, ${CELL_SIZE})`,
          gap: "1px",
          backgroundColor: "#111",
          padding: "2px",
          borderRadius: "2px",
        }}
      >
        {previewGrid.map((row, rIdx) =>
          row.map((cellColor, cIdx) => (
            <div
              key={`${rIdx}-${cIdx}`}
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: cellColor || "#111111",
                borderRadius: "2px",
                boxShadow: cellColor
                  ? "inset 1px 1px 2px rgba(255,255,255,0.3)"
                  : "none",
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};

// --- Helper Components ---
// CHQ: Gemini AI created component
const getGhostDropY = (player: Player, grid: Grid): number => {
  let ghostY = player.pos.y;
  while (!checkCollision(player, grid, { x: 0, y: ghostY - player.pos.y + 1 })) {
    ghostY++;
  }
  return ghostY;
};

const GameBoard = ({ displayGrid }: { displayGrid: Cell[][] }) => (
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
      row.map(([color, state], cIdx) => {
        const isGhost = state === "ghost";
        const isFilled = color !== "#000000";

        return (
          <div
            key={`${rIdx}-${cIdx}`}
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: isGhost
                ? "transparent"
                : isFilled
                ? color
                : "#111111",
              border: isGhost ? `2px dashed ${color}` : "none",
              boxSizing: "border-box",
              borderRadius: "2px",
              boxShadow:
                isFilled && !isGhost
                  ? "inset 2px 2px 4px rgba(255,255,255,0.3), inset -2px -2px 4px rgba(0,0,0,0.4)"
                  : "none",
            }}
          />
        );
      })
    )}
  </div>
);

const ScoreCard = ({ label, value }: { label: string; value: number }) => (
  <div
    style={{
      background: "#2a2a2a",
      padding: "8px 12px",
      borderRadius: "4px",
      textAlign: "center",
      flex: 1,
    }}
  >
    <div style={{ fontSize: "10px", color: "#aaa" }}>{label}</div>
    <div style={{ fontSize: "18px", fontWeight: "bold" }}>{value}</div>
  </div>
);

const GameOverScreen = () => (
  <div
    style={{
      color: "#ff4d4d",
      fontWeight: "bold",
      textAlign: "center",
      padding: "4px 0",
    }}
  >
    GAME OVER
  </div>
);

const StartGameButton = ({
  startGame,
  gameOver,
}: {
  startGame: MouseEventHandler<HTMLButtonElement>;
  gameOver: boolean;
}) => (
  <button
    onClick={startGame}
    style={{
      padding: "8px 12px",
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

const ControlsHints = () => (
  <div
    style={{
      marginTop: "12px",
      fontSize: "12px",
      color: "#888",
      textAlign: "center",
    }}
  >
    <p style={{ margin: 0 }}>
      Controls: ⬅️ / ➡️ Move | ⬆️ Rotate | ⬇️ Soft Drop | Space Hard Drop | C / Shift Hold | P / Esc Pause
    </p>
  </div>
);

const TouchControls = ({
  onLeft,
  onRight,
  onRotate,
  onSoftDrop,
  onHardDrop,
  onHold,
  canHold,
}: {
  onLeft: () => void;
  onRight: () => void;
  onRotate: () => void;
  onSoftDrop: () => void;
  onHardDrop: () => void;
  onHold: () => void;
  canHold: boolean;
}) => {
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
        <button
          style={{
            ...buttonStyle,
            opacity: canHold ? 1 : 0.5,
            cursor: canHold ? "pointer" : "not-allowed",
          }}
          onClick={onHold}
          aria-label="Hold Piece"
        >
          HOLD
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

  // Hold & Next state
  const [nextType, setNextType] = useState<TetrominoType>(getRandomTetrominoType());
  const [holdType, setHoldType] = useState<TetrominoType | null>(null);
  const [canHold, setCanHold] = useState<boolean>(true);

  const initialType = getRandomTetrominoType();
  const [player, setPlayer] = useState<Player>({
    pos: { x: 0, y: 0 },
    tetromino: TETROMINOES[initialType].shape,
    color: TETROMINOES[initialType].color,
    type: initialType,
  });

  // Refs mirroring state values for callbacks and intervals
  const playerRef = useRef(player);
  const gridRef = useRef(grid);
  const levelRef = useRef(level);
  const linesRef = useRef(lines);
  const scoreRef = useRef(score);
  const nextTypeRef = useRef(nextType);
  const holdTypeRef = useRef(holdType);
  const canHoldRef = useRef(canHold);

  // CHQ: Gemini AI added pause state and toggle
  const [isPaused, setIsPaused] = useState(false);

  const togglePause = () => {
    if (!gameOver) {
      setIsPaused((prev) => !prev);
    }
  };

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { linesRef.current = lines; }, [lines]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { nextTypeRef.current = nextType; }, [nextType]);
  useEffect(() => { holdTypeRef.current = holdType; }, [holdType]);
  useEffect(() => { canHoldRef.current = canHold; }, [canHold]);

  const resetPlayer = useCallback(
    (typeToSpawn?: TetrominoType) => {
      let spawnType = typeToSpawn;

      if (!spawnType) {
        spawnType = nextTypeRef.current;
        setNextType(getRandomTetrominoType());
      }

      const nextTetromino = TETROMINOES[spawnType];
      const newPlayer: Player = {
        pos: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 },
        tetromino: nextTetromino.shape,
        color: nextTetromino.color,
        type: spawnType,
      };

      if (checkCollision(newPlayer, gridRef.current, { x: 0, y: 0 })) {
        setGameOver(true);
        submitScore(username, "TETRIS", scoreRef.current);
        setDropTime(null);
        return;
      }

      setPlayer(newPlayer);
      setCanHold(true);
    },
    [username]
  );

  const holdPiece = useCallback(() => {
    if (!canHoldRef.current || gameOver || isPaused) return;

    const currentType = playerRef.current.type;
    const currentHeld = holdTypeRef.current;

    setHoldType(currentType);
    setCanHold(false);

    if (currentHeld) {
      resetPlayer(currentHeld);
    } else {
      resetPlayer();
    }
  }, [gameOver, isPaused, resetPlayer]);

  const startGame = () => {
    setGrid(createEmptyGrid());
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    setHoldType(null);
    setCanHold(true);

    const firstType = getRandomTetrominoType();
    setNextType(getRandomTetrominoType());
    setDropTime(INITIAL_DROP_TIME);

    setPlayer({
      pos: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 },
      tetromino: TETROMINOES[firstType].shape,
      color: TETROMINOES[firstType].color,
      type: firstType,
    });
  };

  const rotateMatrix = (matrix: number[][]): number[][] => {
    return matrix[0].map((_, index) =>
      matrix.map((row) => row[index]).reverse()
    );
  };

  const playerRotate = useCallback(() => {
    if (isPaused) return;
    const clonedPlayer: Player = JSON.parse(JSON.stringify(playerRef.current));
    clonedPlayer.tetromino = rotateMatrix(clonedPlayer.tetromino);

    const pos = clonedPlayer.pos.x;
    let offset = 1;
    while (checkCollision(clonedPlayer, gridRef.current, { x: 0, y: 0 })) {
      clonedPlayer.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > clonedPlayer.tetromino[0].length) {
        clonedPlayer.pos.x = pos;
        return;
      }
    }
    setPlayer(clonedPlayer);
  }, [isPaused]);

  const movePlayer = useCallback((dir: number) => {
    if (isPaused) return;
    if (!checkCollision(playerRef.current, gridRef.current, { x: dir, y: 0 })) {
      setPlayer((prev) => ({
        ...prev,
        pos: { x: prev.pos.x + dir, y: prev.pos.y },
      }));
    }
  }, [isPaused]);

  const lockPiece = useCallback(
    (finalPlayer: Player) => {
      if (finalPlayer.pos.y < 1) {
        setGameOver(true);
        submitScore(username, "TETRIS", scoreRef.current);
        setDropTime(null);
        return;
      }

      setGrid((prevGrid) => {
        const newGrid = prevGrid.map((row) => [...row]);

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

        let rowsCleared = 0;
        const sweptGrid = newGrid.reduce((acc, row) => {
          if (row.every((cell) => cell[1] === "merged")) {
            rowsCleared += 1;
            acc.unshift(
              Array.from(
                { length: BOARD_WIDTH },
                () => ["#000000", "clear"] as Cell
              )
            );
          } else {
            acc.push(row);
          }
          return acc;
        }, [] as Grid);

        if (rowsCleared > 0) {
          const linePoints = [0, 40, 100, 300, 1200];
          setScore((prev) => prev + linePoints[rowsCleared] * levelRef.current);
          setLines((prev) => prev + rowsCleared);
        }

        return sweptGrid;
      });

      resetPlayer();
    },
    [resetPlayer, username]
  );

  const drop = useCallback(() => {
    if (isPaused) return;

    if (linesRef.current >= levelRef.current * 10) {
      setLevel((prev) => prev + 1);
      setDropTime((prev) =>
        prev ? Math.max(100, prev - 100) : INITIAL_DROP_TIME
      );
    }

    const currentPlayer = playerRef.current;
    if (!checkCollision(currentPlayer, gridRef.current, { x: 0, y: 1 })) {
      setPlayer((prev) => ({
        ...prev,
        pos: { x: prev.pos.x, y: prev.pos.y + 1 },
      }));
    } else {
      lockPiece(currentPlayer);
    }
  }, [isPaused, lockPiece]);

  const hardDrop = useCallback(() => {
    if (isPaused) return;
    const currentPlayer = playerRef.current;
    let currentY = currentPlayer.pos.y;
    while (
      !checkCollision(currentPlayer, gridRef.current, {
        x: 0,
        y: currentY - currentPlayer.pos.y + 1,
      })
    ) {
      currentY++;
    }
    lockPiece({ ...currentPlayer, pos: { x: currentPlayer.pos.x, y: currentY } });
  }, [isPaused, lockPiece]);

  // Ticker Effect - includes isPaused to stop interval when paused
  useEffect(() => {
    if (!dropTime || gameOver || isPaused) return;
    const interval = setInterval(() => {
      drop();
    }, dropTime);
    return () => clearInterval(interval);
  }, [dropTime, gameOver, isPaused, drop]);

  // Keyboard controls
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (gameOver) return;

    // Toggle pause on 'P' or 'Escape'
    if (e.key === "p" || e.key === "P" || e.key === "Escape") {
      e.preventDefault();
      togglePause();
      return;
    }

    // Prevent input actions while paused
    if (isPaused) return;

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      movePlayer(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      movePlayer(1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      drop();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      playerRotate();
    } else if (e.key === " ") {
      e.preventDefault();
      hardDrop();
    } else if (e.key === "c" || e.key === "C" || e.key === "Shift") {
      e.preventDefault();
      holdPiece();
    }
  };

  // Overlay current active piece onto display grid
  const displayGrid = grid.map((row) => [...row]);

  if (!gameOver) {
    // 1. Calculate ghost drop position
    const ghostY = getGhostDropY(player, grid);

    // 2. Overlay ghost piece (outlined cells)
    if (ghostY > player.pos.y) {
      player.tetromino.forEach((row, y) => {
        row.forEach((val, x) => {
          if (val !== 0) {
            const boardY = y + ghostY;
            const boardX = x + player.pos.x;
            if (
              boardY >= 0 &&
              boardY < BOARD_HEIGHT &&
              boardX >= 0 &&
              boardX < BOARD_WIDTH
            ) {
              displayGrid[boardY][boardX] = [player.color, "ghost"];
            }
          }
        });
      });
    }

    // 3. Overlay active piece over ghost
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
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <div style={{ position: "relative", display: "inline-block" }}>
          <GameBoard displayGrid={displayGrid} />

          {isPaused && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.75)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "4px",
                zIndex: 10,
                backdropFilter: "blur(2px)",
              }}
            >
              <h2
                style={{
                  color: "#fff",
                  fontSize: "1.8rem",
                  margin: "0 0 12px 0",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                }}
              >
                Paused
              </h2>
              <button
                onClick={togglePause}
                style={{
                  padding: "8px 16px",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  color: "#fff",
                  backgroundColor: "#3b82f6",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              >
                Resume (P)
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: "200px" }}>
          {/* Hold & Next Previews */}
          <div style={{ display: "flex", gap: "6px" }}>
            <MiniPiecePreview title="HOLD" type={holdType} />
            <MiniPiecePreview title="NEXT" type={nextType} />
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <ScoreCard label="SCORE" value={score} />
            <ScoreCard label="LINES" value={lines} />
            <ScoreCard label="LEVEL" value={level} />
          </div>

          <StartGameButton startGame={startGame} gameOver={gameOver} />
          {gameOver && <GameOverScreen />}

          <TouchControls
            onLeft={() => !gameOver && movePlayer(-1)}
            onRight={() => !gameOver && movePlayer(1)}
            onRotate={() => !gameOver && playerRotate()}
            onSoftDrop={() => !gameOver && drop()}
            onHardDrop={() => !gameOver && hardDrop()}
            onHold={() => !gameOver && holdPiece()}
            canHold={canHold}
          />

          <ControlsHints />
        </div>
      </div>
    </div>
  );
};

export default Tetris;