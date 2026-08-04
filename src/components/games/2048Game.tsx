// CHQ: Gemini AI scaffolded, Claude AI (Sonnet) added a feature, and I edited heavily
// Touch swipe support added for mobile play

import React, { useState, useEffect, useCallback, useRef } from "react";

import { submitScore } from "../../utils/submitScore";
type Board = number[][];
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

interface GameProps {
  username?: string;
}

const BOARD_SIZE = 4;

function createEmptyBoard(): Board {
  return Array(BOARD_SIZE)
    .fill(0)
    .map(() => Array(BOARD_SIZE).fill(0));
}

// CHQ: Gemini AI: Add a random 2 or 4 to a free spot
const addRandomTile = (currentBoard: Board): Board => {
  const emptyCells: [number, number][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (currentBoard[r][c] === 0) emptyCells.push([r, c]);
    }
  }

  if (emptyCells.length === 0) return currentBoard;

  const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newBoard = currentBoard.map((row) => [...row]);
  newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newBoard;
};

// CHQ: Gemini AI: Helper: Rotate board counter-clockwise
const rotateLeft = (matrix: Board): Board => {
  const result = createEmptyBoard();
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      result[BOARD_SIZE - 1 - c][r] = matrix[r][c];
    }
  }
  return result;
};

// CHQ: Gemini AI: Core slide and merge logic (operates leftward)
const slideAndMergeRow = (
  row: number[],
): { newRow: number[]; gainedScore: number } => {
  const nonZero = row.filter((val) => val !== 0);
  const newRow: number[] = [];
  let gainedScore = 0;

  for (let i = 0; i < nonZero.length; i++) {
    if (i < nonZero.length - 1 && nonZero[i] === nonZero[i + 1]) {
      const mergedVal = nonZero[i] * 2;
      newRow.push(mergedVal);
      gainedScore += mergedVal;
      i++; // Skip merged tile
    } else {
      newRow.push(nonZero[i]);
    }
  }

  while (newRow.length < BOARD_SIZE) {
    newRow.push(0);
  }

  return { newRow, gainedScore };
};

const checkGameOver = (currentBoard: Board): boolean => {
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

// CHQ: Gemini AI: Color mapping for classic 2048 styling
const getTileStyle = (value: number): React.CSSProperties => {
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
      }}
    >
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
    <div style={{ marginBottom: "15px", fontSize: "20px", fontWeight: "bold" }}>
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
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  }
>((props, ref) => {
  const { gameOver, initGame, board, onTouchStart, onTouchEnd } = props;
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
        // CHQ: Claude AI (Sonnet): keep the board square on narrow phone widths
        aspectRatio: "1 / 1",
        margin: "0 auto",
        padding: "10px",
        backgroundColor: "#bbada0",
        borderRadius: "6px",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gridTemplateRows: "repeat(4, 1fr)",
        gap: "10px",
        // CHQ: Claude AI (Sonnet): stops the browser from scrolling/refreshing the page
        // while the user is swiping on the board
        touchAction: "none",
      }}
    >
      {board.map((row, rIdx) =>
        row.map((val, cIdx) => (
          <div key={`${rIdx}-${cIdx}`} style={getTileStyle(val)}>
            {val !== 0 ? val : ""}
          </div>
        )),
      )}

      {gameOver && <GameOverDisplay initGame={initGame} />}
    </div>
  );
});
GameBoard.displayName = "GameBoard";

// CHQ: Gemini AI: Helper function to create a ready-to-play initial board
const createInitialBoard = (): Board => {
  let board = createEmptyBoard();
  board = addRandomTile(board);
  board = addRandomTile(board);
  return board;
};

// CHQ: Claude AI (Sonnet): minimum finger travel (px) before a touch counts as a swipe,
// rather than an accidental tap/jiggle
const SWIPE_THRESHOLD = 30;

// async function submitScore(
//   username: string,
//   gameType: "GAME_2048" | "PING_PONG" | "TETRIS",
//   score: number,
// ) {
//   const baseUrl = import.meta.env.VITE_API_URL;

//   await fetch(baseUrl + "/api/scores", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ username, gameType, score }),
//   });
// }

export const The2048Game: React.FC<GameProps> = ({ username = "Guest" }) => {
  // CHQ: Gemini AI: replaced createEmptyBoard with a helper
  //      function createInitialBoard which gets called here
  const [board, setBoard] = useState<Board>(createInitialBoard);
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // CHQ: Claude AI (Sonnet): track where a touch started so we can measure the swipe on release
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // CHQ: Gemini AI: Reset handler for "New Game" and "Try Again" buttons
  const initGame = useCallback(() => {
    setBoard(createInitialBoard());
    setScore(0);
    setGameOver(false);
  }, []);

  const move = useCallback(
    (direction: Direction) => {
      if (gameOver) return;

      let tempBoard = board.map((row) => [...row]);
      let totalGainedScore = 0;

      // CHQ: Gemini AI: Rotate board so we always move "LEFT"
      const rotations = { LEFT: 0, DOWN: 3, RIGHT: 2, UP: 1 }[direction];
      for (let i = 0; i < rotations; i++) {
        tempBoard = rotateLeft(tempBoard);
      }

      // CHQ: Gemini AI: Process row sliding/merging
      const nextBoard: Board = [];
      for (let r = 0; r < BOARD_SIZE; r++) {
        const { newRow, gainedScore } = slideAndMergeRow(tempBoard[r]);
        nextBoard.push(newRow);
        totalGainedScore += gainedScore;
      }
      tempBoard = nextBoard;

      // CHQ: Gemini AI: Rotate back to original orientation
      for (let i = 0; i < (4 - rotations) % 4; i++) {
        tempBoard = rotateLeft(tempBoard);
      }

      // CHQ: Gemini AI: Check if board changed
      const hasChanged = JSON.stringify(board) !== JSON.stringify(tempBoard);

      // CHQ: ChatGPT fixed score submission using stale score
      if (hasChanged) {
        const updatedBoard = addRandomTile(tempBoard);
        setBoard(updatedBoard);

        const finalScore = score + totalGainedScore;
        setScore(finalScore);

        if (checkGameOver(updatedBoard)) {
          setGameOver(true);
          submitScore(username, "GAME_2048", finalScore);
        }
      }
    },
    [board, gameOver, score, username],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          move("UP");
          break;
        case "ArrowDown":
          e.preventDefault();
          move("DOWN");
          break;
        case "ArrowLeft":
          e.preventDefault();
          move("LEFT");
          break;
        case "ArrowRight":
          e.preventDefault();
          move("RIGHT");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move]);

  // CHQ: Claude AI (Sonnet): record the starting touch point
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  // CHQ: Claude AI (Sonnet): compare the touch end point to the start point to figure out
  // which direction the finger travelled furthest, then fire that move
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStartRef.current;
      if (!start) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;

      touchStartRef.current = null;

      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) {
        // too small to count as an intentional swipe
        return;
      }

      if (Math.abs(dx) > Math.abs(dy)) {
        move(dx > 0 ? "RIGHT" : "LEFT");
      } else {
        move(dy > 0 ? "DOWN" : "UP");
      }
    },
    [move],
  );

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
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      <SwipeHint />
      <NewGameButton initGame={initGame} />
    </div>
  );
};
