// tests/vitestTests/2048/The2048Game.test.tsx
//
// Component-level checks. Game rules are covered in logic/reducer tests; these
// only verify the wiring: keyboard, swipe, scoring callback, reset.

import { describe, it, expect, vi, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { The2048Game } from "../../../src/components/games/2048Game";
import type { Board } from "../../../src/games/2048/logic";

vi.mock("../../../src/utils/submitScore", () => ({
  submitScore: vi.fn().mockResolvedValue(undefined),
}));
import { submitScore } from "../../../src/utils/submitScore";

// A UP move merges the two 8s in column 1 (+16), the spawned 2 (Math.random=0)
// fills the last gap, and no moves remain.
const LAST_MOVE_BOARD: Board = [
  [4, 8, 4, 8],
  [16, 8, 16, 4],
  [2, 2, 4, 8],
  [4, 8, 16, 2],
];

const START: Board = [
  [2, 2, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
];

// The touch handlers live on the board element (the grid with 16 tile children).
const getBoardEl = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("div")).find(
    (el) => el.children.length >= 16,
  ) as HTMLElement;

afterEach(() => {
  vi.restoreAllMocks();
  vi.mocked(submitScore).mockClear();
});

describe("The2048Game", () => {
  it("moves and scores on arrow keys", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<The2048Game initialBoard={START} />);

    expect(screen.getByText("Score: 0")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByText("Score: 4")).toBeInTheDocument();
  });

  it("moves on a swipe", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { container } = render(<The2048Game initialBoard={START} />);
    const board = getBoardEl(container);

    fireEvent.touchStart(board, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchEnd(board, {
      changedTouches: [{ clientX: 100, clientY: 105 }],
    });
    expect(screen.getByText("Score: 4")).toBeInTheDocument();
  });

  it("ignores a tap that barely moves", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { container } = render(<The2048Game initialBoard={START} />);
    const board = getBoardEl(container);

    fireEvent.touchStart(board, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchEnd(board, {
      changedTouches: [{ clientX: 105, clientY: 100 }],
    });
    expect(screen.getByText("Score: 0")).toBeInTheDocument();
  });

  it("calls onGameOver exactly once with the final score", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const onGameOver = vi.fn();
    render(<The2048Game initialBoard={LAST_MOVE_BOARD} onGameOver={onGameOver} />);

    fireEvent.keyDown(window, { key: "ArrowUp" });
    expect(screen.getByText("Game Over!")).toBeInTheDocument();
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(16);

    // Further input after game over must not re-submit.
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyDown(window, { key: "ArrowUp" });
    expect(onGameOver).toHaveBeenCalledTimes(1);
  });

  it("submits the score for the username by default", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<The2048Game username="Ada" initialBoard={LAST_MOVE_BOARD} />);

    fireEvent.keyDown(window, { key: "ArrowUp" });
    expect(submitScore).toHaveBeenCalledTimes(1);
    expect(submitScore).toHaveBeenCalledWith("Ada", "GAME_2048", 16);
  });

  it("starts a new game from the Try Again button", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<The2048Game initialBoard={LAST_MOVE_BOARD} onGameOver={vi.fn()} />);

    fireEvent.keyDown(window, { key: "ArrowUp" });
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(screen.queryByText("Game Over!")).not.toBeInTheDocument();
    expect(screen.getByText("Score: 0")).toBeInTheDocument();
  });

  it("stops listening for keys after unmount", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<The2048Game initialBoard={START} />);
    unmount();
    expect(remove).toHaveBeenCalledWith("keydown", expect.any(Function));
  });
});
