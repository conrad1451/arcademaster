// CHQ: Gemini AI scaffolded, and I edited heavily
// CHQ: Claude AI (Sonnet): Touch controls + responsive canvas sizing added for mobile

import React, { useEffect, useRef, useState, useCallback } from "react";

// --- Types & Interfaces ---
interface Ball {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  speed: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
  speed: number;
}

export const PingPongGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [scores, setScores] = useState<{ player: number; ai: number }>({
    player: 0,
    ai: 0,
  });

  // CHQ: Claude AI (Sonnet): Canvas Dimensions (internal drawing resolution - stays fixed;
  // CSS scaling below is what makes it fit small phone screens)
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;
  const PADDLE_WIDTH = 12;
  const PADDLE_HEIGHT = 90;
  const BALL_RADIUS = 8;
  const INITIAL_BALL_SPEED = 6;

  // Mutable Game State in Ref to avoid stale closures in requestAnimationFrame
  const gameState = useRef<{
    ball: Ball;
    player: Paddle;
    ai: Paddle;
    keysPressed: { [key: string]: boolean };
  }>({
    ball: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      radius: BALL_RADIUS,
      vx: INITIAL_BALL_SPEED,
      vy: INITIAL_BALL_SPEED,
      speed: INITIAL_BALL_SPEED,
    },
    player: {
      x: 20,
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      score: 0,
      speed: 7,
    },
    ai: {
      x: CANVAS_WIDTH - 20 - PADDLE_WIDTH,
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      score: 0,
      speed: 4.5, // AI tracking speed limit
    },
    keysPressed: {},
  });

  // Reset ball to middle after score
  const resetBall = useCallback((scoringPlayer: "player" | "ai") => {
    const state = gameState.current;
    state.ball.x = CANVAS_WIDTH / 2;
    state.ball.y = CANVAS_HEIGHT / 2;
    state.ball.speed = INITIAL_BALL_SPEED;

    // Serve towards the player who just got scored on
    const directionX = scoringPlayer === "player" ? -1 : 1;
    const angle = (Math.random() * Math.PI) / 4 - Math.PI / 8; // Random launch angle
    state.ball.vx = directionX * INITIAL_BALL_SPEED * Math.cos(angle);
    state.ball.vy = INITIAL_BALL_SPEED * Math.sin(angle);
  }, []);

  // Update logic (Physics & Collisions)
  const update = useCallback(() => {
    const state = gameState.current;
    const { ball, player, ai, keysPressed } = state;

    // 1. Move Player Paddle
    if (
      (keysPressed["ArrowUp"] || keysPressed["w"] || keysPressed["W"]) &&
      player.y > 0
    ) {
      player.y -= player.speed;
    }
    if (
      (keysPressed["ArrowDown"] || keysPressed["s"] || keysPressed["S"]) &&
      player.y < CANVAS_HEIGHT - player.height
    ) {
      player.y += player.speed;
    }

    // 2. Simple AI Movement
    const aiTargetY = ball.y - ai.height / 2;
    if (ai.y < aiTargetY) {
      ai.y += Math.min(ai.speed, aiTargetY - ai.y);
    } else if (ai.y > aiTargetY) {
      ai.y -= Math.min(ai.speed, ai.y - aiTargetY);
    }
    // Clamp AI within bounds
    ai.y = Math.max(0, Math.min(CANVAS_HEIGHT - ai.height, ai.y));

    // 3. Move Ball
    ball.x += ball.vx;
    ball.y += ball.vy;

    // 4. Wall Collisions (Top / Bottom)
    if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= CANVAS_HEIGHT) {
      ball.vy = -ball.vy;
    }

    // Helper: AABB Collision check between Ball and Paddle
    const checkCollision = (b: Ball, p: Paddle) => {
      return (
        b.x - b.radius < p.x + p.width &&
        b.x + b.radius > p.x &&
        b.y + b.radius > p.y &&
        b.y - b.radius < p.y + p.height
      );
    };

    // 5. Paddle Collisions
    let paddleHit: Paddle | null = null;
    if (ball.vx < 0 && checkCollision(ball, player)) {
      paddleHit = player;
    } else if (ball.vx > 0 && checkCollision(ball, ai)) {
      paddleHit = ai;
    }

    if (paddleHit) {
      // Calculate hit point relative to center of paddle (-1 top, 0 center, +1 bottom)
      const hitPoint =
        (ball.y - (paddleHit.y + paddleHit.height / 2)) /
        (paddleHit.height / 2);
      const bounceAngle = (hitPoint * Math.PI) / 4; // Max 45 degree exit angle

      // Increase speed slightly on hit
      ball.speed = Math.min(ball.speed + 0.4, 15);

      const directionX = paddleHit === player ? 1 : -1;
      ball.vx = directionX * ball.speed * Math.cos(bounceAngle);
      ball.vy = ball.speed * Math.sin(bounceAngle);
    }

    // 6. Scoring Check
    if (ball.x - ball.radius < 0) {
      // AI Scores
      ai.score += 1;
      setScores({ player: player.score, ai: ai.score });
      resetBall("ai");
    } else if (ball.x + ball.radius > CANVAS_WIDTH) {
      // Player Scores
      player.score += 1;
      setScores({ player: player.score, ai: ai.score });
      resetBall("player");
    }
  }, [resetBall]);

  // Render logic (Canvas Drawing)
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const { ball, player, ai } = gameState.current;

    // Clear Background
    ctx.fillStyle = "#0f172a"; // Dark slate
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Middle Net
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Draw Player Paddle
    ctx.fillStyle = "#38bdf8"; // Sky blue
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw AI Paddle
    ctx.fillStyle = "#f43f5e"; // Rose pink
    ctx.fillRect(ai.x, ai.y, ai.width, ai.height);

    // Draw Ball
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  // Main Game Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      if (isPlaying) {
        update();
      }
      draw(ctx);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, update, draw]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "w", "W", "s", "S"].includes(e.key)) {
        e.preventDefault();
        gameState.current.keysPressed[e.key] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "w", "W", "s", "S"].includes(e.key)) {
        gameState.current.keysPressed[e.key] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // CHQ: Claude AI (Sonnet): Shared helper - given a clientY from either a
  // mouse or touch event, move the player paddle so it's centered on that
  // point. The canvas is scaled down via CSS on small screens, so we convert
  // using the canvas's *rendered* size, not the fixed internal CANVAS_HEIGHT,
  // to keep touch tracking accurate at any screen size.
  const movePaddleToClientY = useCallback((clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleY = CANVAS_HEIGHT / rect.height;
    const y = (clientY - rect.top) * scaleY;

    const player = gameState.current.player;
    player.y = Math.max(
      0,
      Math.min(CANVAS_HEIGHT - player.height, y - player.height / 2),
    );
  }, []);

  // CHQ: Claude AI (Sonnet): Mouse Control for Player Paddle
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying) return;
    movePaddleToClientY(e.clientY);
  };

  // CHQ: Claude AI (Sonnet): Touch controls - a finger drag on the canvas moves the paddle the
  // same way the mouse does. preventDefault stops the page from scrolling
  // while dragging on the canvas.
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPlaying) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) movePaddleToClientY(touch.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPlaying) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) movePaddleToClientY(touch.clientY);
  };

  const handleStart = () => {
    if (scores.player === 0 && scores.ai === 0) {
      resetBall("player"); // Randomize initial serve direction on game start
    }
    setIsPlaying(true);
  };

  const handleReset = () => {
    const state = gameState.current;
    state.player.score = 0;
    state.ai.score = 0;
    state.player.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    state.ai.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    setScores({ player: 0, ai: 0 });
    resetBall("player");
    setIsPlaying(false);
  };

  return (
    <div style={styles.container}>
      {/* Header / Score Board */}
      <div style={styles.scoreboard}>
        <div style={styles.scoreBox}>
          <span style={{ color: "#38bdf8" }}>Player</span>
          <span style={styles.scoreNumber}>{scores.player}</span>
        </div>
        <div style={styles.vs}>VS</div>
        <div style={styles.scoreBox}>
          <span style={{ color: "#f43f5e" }}>CPU</span>
          <span style={styles.scoreNumber}>{scores.ai}</span>
        </div>
      </div>

      {/* Game Canvas */}
      <div style={styles.canvasWrapper} ref={wrapperRef}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          style={styles.canvas}
        />
        {!isPlaying && (
          <div style={styles.overlay}>
            <button style={styles.startButton} onClick={handleStart}>
              {scores.player === 0 && scores.ai === 0 ? "Start Game" : "Resume"}
            </button>
            <p style={styles.controlsHint}>
              Use W/S, Up/Down Arrows, Mouse, or drag your finger to move
            </p>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div style={styles.controls}>
        <button style={styles.button} onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          style={{ ...styles.button, backgroundColor: "#ef4444" }}
          onClick={handleReset}
        >
          Reset Match
        </button>
      </div>
    </div>
  );
};

// Inline CSS Styles for zero-dependency execution
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#020617",
    color: "#f8fafc",
    fontFamily: "sans-serif",
    padding: "20px",
    borderRadius: "12px",
    // CHQ: Claude AI (Sonnet): let the whole card shrink on narrow phone viewports
    width: "100%",
    maxWidth: "840px",
    margin: "0 auto",
    boxSizing: "border-box",
  },
  scoreboard: {
    display: "flex",
    alignItems: "center",
    gap: "30px",
    marginBottom: "15px",
  },
  scoreBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontSize: "18px",
    fontWeight: "bold",
  },
  scoreNumber: {
    fontSize: "36px",
    fontWeight: "800",
  },
  vs: {
    fontSize: "20px",
    color: "#64748b",
    fontWeight: "bold",
  },
  canvasWrapper: {
    position: "relative",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
    // CHQ: Claude AI (Sonnet): cap the wrapper to the viewport width so the canvas below
    // (which scales via width: 100%) never overflows on a phone
    width: "100%",
    maxWidth: `${800}px`,
  },
  canvas: {
    display: "block",
    cursor: "none",
    // CHQ: Claude AI (Sonnet): scale the fixed-resolution canvas down to fit narrow screens
    // while keeping its 800x500 aspect ratio intact
    width: "100%",
    height: "auto",
    // CHQ: Claude AI (Sonnet): stop the browser from scrolling/zooming the page while
    // dragging a finger across the canvas
    touchAction: "none",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "0 16px",
    boxSizing: "border-box",
  },
  startButton: {
    padding: "12px 28px",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#2563eb",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  controlsHint: {
    marginTop: "12px",
    fontSize: "14px",
    color: "#94a3b8",
  },
  controls: {
    marginTop: "15px",
    display: "flex",
    gap: "12px",
  },
  button: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
    backgroundColor: "#334155",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default PingPongGame;
