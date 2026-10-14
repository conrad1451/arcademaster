// tests/vitestTests/Leaderboard.test.tsx

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Leaderboard from "../../src/components/pages/Leaderboard";
import { fetchScores, type Score } from "../../src/api/client";

vi.mock("../../src/api/client", () => ({ fetchScores: vi.fn() }));

const makeScore = (id: number, username: string, score: number): Score => ({
  id,
  username,
  gameType: "GAME_2048",
  score,
  updatedAt: "2026-10-13T12:00:00Z",
});

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.mocked(fetchScores).mockReset();
  vi.restoreAllMocks();
});

describe("Leaderboard", () => {
  it("loads the 2048 scores first and sorts them highest first", async () => {
    vi.mocked(fetchScores).mockResolvedValue([
      makeScore(1, "low", 100),
      makeScore(2, "high", 5000),
      makeScore(3, "mid", 800),
    ]);
    render(<Leaderboard />);

    expect(fetchScores).toHaveBeenCalledWith("GAME_2048");
    await screen.findByText("high");

    const names = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.textContent ?? "");
    expect(names[0]).toContain("high");
    expect(names[1]).toContain("mid");
    expect(names[2]).toContain("low");
  });

  it("refetches for the selected game when the tab changes", async () => {
    vi.mocked(fetchScores).mockResolvedValue([makeScore(1, "ada", 10)]);
    render(<Leaderboard />);
    await screen.findByText("ada");

    await userEvent.click(screen.getByRole("tab", { name: "Tetris" }));

    await waitFor(() => expect(fetchScores).toHaveBeenLastCalledWith("TETRIS"));
    expect(fetchScores).toHaveBeenCalledTimes(2);
  });

  it("shows the empty state when there are no scores", async () => {
    vi.mocked(fetchScores).mockResolvedValue([]);
    render(<Leaderboard />);
    expect(await screen.findByText(/No scores yet for 2048/)).toBeInTheDocument();
  });

  it("shows an error, not the empty state, when loading fails", async () => {
    vi.mocked(fetchScores).mockRejectedValue(new Error("VITE_API_URL is not set."));
    render(<Leaderboard />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't load the leaderboard",
    );
    expect(screen.queryByText(/No scores yet/)).not.toBeInTheDocument();
    // in dev/test builds the underlying reason is shown too
    expect(screen.getByRole("alert")).toHaveTextContent("VITE_API_URL is not set.");
  });

  it("clears the error after switching to a tab that loads", async () => {
    vi.mocked(fetchScores)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce([makeScore(1, "ada", 10)]);
    render(<Leaderboard />);
    await screen.findByRole("alert");

    await userEvent.click(screen.getByRole("tab", { name: "Ping Pong" }));

    await screen.findByText("ada");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
