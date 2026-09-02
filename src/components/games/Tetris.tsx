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
const INITIAL_DROP_TIME = 800;
const CELL_SIZE = "min(16px, 7.5vw)";

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
type Cell = [string, string];
type Grid = Cell[][];

interface Player {
  pos: { x: number; y: number };
  tetromino: number[][];
  color: string;
}

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

        if (newY >= BOARD_HEIGHT || newY < 0) return true;
        if (newX >= BOARD_WIDTH || newX < 0) return true;
        if (grid[newY]?.[newX]?.[1] === "merged") return true;
      }
    }
  }
  return false;
};

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

const Score = (props: { score: number }) => (
  <div style={{ background: "#2a2a2a", padding: "10px", borderRadius: "4px" }}>
    <div>SCORE</div>
    <div style={{ fontSize: "20px", fontWeight: "bold" }}>{props.score}</div>
  </div>
);

const Lines = (props: { lines: number }) => (
  <div style={{ background: "#2a2a2a", padding: "10px", borderRadius: "4px" }}>
    <div>LINES</div>
    <div style={{ fontSize: "20px", fontWeight: "bold" }}>{props.lines}</div>
  </div>
);

const LevelIndicator = (props: { level: number }) => (
  <div style={{ background: "#2a2a2a", padding: "10px", borderRadius: "4px" }}>
    <div>LEVEL</div>
    <div style={{ fontSize: "20px", fontWeight: "bold" }}>{props.level}</div>
  </div>
);

const GameOverScreen = () => (
  <div style={{ color: "#ff4d4d", fontWeight: "bold", textAlign: "center" }}>
    GAME OVER
  </div>
);

const StartGameButton = (props: {
  startGame: MouseEventHandler<HTMLButtonElement>;
  gameOver: boolean;
}) => (
  <button
    onClick={props.startGame}
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
    {props.gameOver ? "RETRY" : "START / RESET"}
  </button>
);

const ControlsHints = () => (
  <div style={{ marginTop: "12px", fontSize: "12px", color: "#888", textAlign: "center" }}>
    <p style={{ margin: 0 }}>
      Controls: ⬅️ / ➡️ Move | ⬆️ Rotate | ⬇️ Soft Drop | Space Hard Drop
    </p>
  </div>
);

const TouchControls = (props: {
  onLeft: () => void;
  onRight: () => void;
  onRotate: () => void;
  onSoftDrop: () => void;
  onHardDrop: () => void;
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
    <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <div style={{ display: "flex", gap: "6px" }}>
        <button style={buttonStyle} onClick={props.onRotate} aria-label="Rotate">⟳</button>
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
        <button style={buttonStyle} onClick={props.onLeft} aria-label="Move left">⬅️</button>
        <button style={buttonStyle} onClick={props.onSoftDrop} aria-label="Soft drop">⬇️</button>
        <button style={buttonStyle} onClick={props.onRight} aria-label="Move right">➡️</button>
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
        <button
          style={{ ...buttonStyle, minWidth: "160px", backgroundColor: "#00f0f0", color: "#000" }}
          onClick={props.onHardDrop}
          aria-label="Hard drop"
        >
          HARD DROP
        </button>
      </div>
    </div>
  );
};

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

  const playerRef = useRef(player);
  const gridRef = useRef(grid);
  const levelRef = useRef(level);
  const linesRef = useRef(lines);
  const scoreRef = useRef(score);

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { linesRef.current = lines; }, [lines]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const resetPlayer = useCallback(() => {
    const nextTetromino = getRandomTetromino();
    const newPlayer = {
      pos: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 },
      tetromino: nextTetromino.shape,
      color: nextTetromino.color,
    };

    // Check if spawn location collides immediately (Game Over)
    if (checkCollision(newPlayer, gridRef.current, { x: 0, y: 0 })) {
      setGameOver(true);
      submitScore(username, "TETRIS", scoreRef.current);
      setDropTime(null);
      return;
    }

    setPlayer(newPlayer);
  }, [username]);

  const startGame = () => {
    setGrid(createEmptyGrid());
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setDropTime(INITIAL_DROP_TIME);
    resetPlayer();
  };

  const rotateMatrix = (matrix: number[][]): number[][] => {
    return matrix[0].map((_, index) =>
      matrix.map((row) => row[index]).reverse(),
    );
  };

  const playerRotate = useCallback(() => {
    const clonedPlayer = JSON.parse(JSON.stringify(playerRef.current));
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
  }, []);

  const movePlayer = useCallback((dir: number) => {
    if (!checkCollision(playerRef.current, gridRef.current, { x: dir, y: 0 })) {
      setPlayer((prev) => ({
        ...prev,
        pos: { x: prev.pos.x + dir, y: prev.pos.y },
      }));
    }
  }, []);

  const lockPiece = useCallback(
    (finalPlayer: Player) => {
      const currentGrid = gridRef.current;
      const newGrid = currentGrid.map((row) => [...row]);

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
            Array.from({ length: BOARD_WIDTH }, () => ["#000000", "clear"] as Cell),
          );
        } else {
          acc.push(row);
        }
        return acc;
      }, [] as Grid);

      if (rowsCleared > 0) {
        const linePoints = [0, 40, 100, 300, 1200];
        const addedScore = linePoints[rowsCleared] * levelRef.current;
        setScore((prev) => prev + addedScore);
        setLines((prev) => prev + rowsCleared);
      }

      setGrid(sweptGrid);
      resetPlayer();
    },
    [resetPlayer],
  );

  const drop = useCallback(() => {
    if (linesRef.current >= levelRef.current * 10) {
      setLevel((prev) => prev + 1);
      setDropTime((prev) =>
        prev ? Math.max(100, prev - 100) : INITIAL_DROP_TIME,
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
  }, [lockPiece]);

  const hardDrop = useCallback(() => {
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
  }, [lockPiece]);

  useEffect(() => {
    if (!dropTime || gameOver) return;
    const interval = setInterval(() => {
      drop();
    }, dropTime);
    return () => clearInterval(interval);
  }, [dropTime, gameOver, drop]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (gameOver) return;

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
    }
  };

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
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <GameBoard displayGrid={displayGrid} />

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

          <TouchControls
            onLeft={() => !gameOver && movePlayer(-1)}
            onRight={() => !gameOver && movePlayer(1)}
            onRotate={() => !gameOver && playerRotate()}
            onSoftDrop={() => !gameOver && drop()}
            onHardDrop={() => !gameOver && hardDrop()}
          />

          <ControlsHints />
        </div>
      </div>
    </div>
  );
};

export default Tetris;