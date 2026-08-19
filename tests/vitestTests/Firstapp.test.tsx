// tests/vitestTests/Firstapp.test.ts

// CHQ: Claude AI (Haiku) generated file, Claude AI (Sonnet) heavily edited

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import type { EnhancedStore } from "@reduxjs/toolkit"; // Add this line

import FirstApp from "../../src/FirstApp";
import userReducer from "../../src/store/userSlice";

// Mock child components to isolate FirstApp logic
vi.mock("../../src/components/games/PingPongGame", () => ({
  default: ({ username }: { username: string }) => (
    <div>PingPong: {username}</div>
  ),
}));

vi.mock("../../src/components/games/2048Game", () => ({
  The2048Game: ({ username }: { username: string }) => (
    <div>2048: {username}</div>
  ),
}));

vi.mock("../../src/components/games/Tetris", () => ({
  default: ({ username }: { username: string }) => (
    <div>Tetris: {username}</div>
  ),
}));

vi.mock("../../src/components/pages/Leaderboard", () => ({
  default: () => <div>Leaderboard Page</div>,
}));

vi.mock("../../src/components/pages/PrivacyPolicy", () => ({
  default: () => <div>Privacy Policy</div>,
}));

vi.mock("../../src/components/pages/TermsOfUse", () => ({
  default: () => <div>Terms of Use</div>,
}));

vi.mock("../../src/components/pages/Disclaimer", () => ({
  default: () => <div>Disclaimer</div>,
}));

// Mock fetch for ServerPinger
globalThis.fetch = vi.fn();

// Mock import.meta.env
vi.stubEnv("VITE_API_URL", "http://localhost:3000");

describe("FirstApp", () => {
  // let store: ReturnType<typeof configureStore>;
  let store: EnhancedStore<{ user: { username: string } }>;

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        user: userReducer,
      },
    });

    // Reset fetch mock
    vi.mocked(globalThis.fetch).mockReset();
  });

  // ============ INITIAL STATE & USERNAME DIALOG TESTS ============

  describe("Username Dialog", () => {
    it("should display username dialog on initial render", () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      expect(screen.getByText("Enter Your Username")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Enter your username/),
      ).toBeInTheDocument();
    });

    it("should show error when username is empty", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "a");
      await userEvent.clear(input);

      expect(screen.getByText("Username is required")).toBeInTheDocument();
    });

    it("should show error when username is less than 2 characters", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "a");

      expect(
        screen.getByText("Username must be at least 2 characters"),
      ).toBeInTheDocument();
    });

    it("should show error when username exceeds 20 characters", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "a".repeat(21));

      expect(
        screen.getByText("Username must be 20 characters or less"),
      ).toBeInTheDocument();
    });

    it("should enable Start button for valid usernames", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      const startButton = screen.getByRole("button", { name: /Start/ });

      // Initially disabled
      expect(startButton).toBeDisabled();

      // Enable with valid input
      await userEvent.type(input, "ValidUser");
      expect(startButton).not.toBeDisabled();
    });

    it("should submit username on Enter key press when valid", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "TestUser");
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(
          screen.queryByText("Enter Your Username"),
        ).not.toBeInTheDocument();
      });
    });

    it("should not submit username on Enter key press when invalid", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "a");
      fireEvent.keyDown(input, { key: "Enter" });

      // Dialog should still be visible
      expect(screen.getByText("Enter Your Username")).toBeInTheDocument();
    });

    it("should submit username on Start button click", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      const startButton = screen.getByRole("button", { name: /Start/ });

      await userEvent.type(input, "ValidUser");
      await userEvent.click(startButton);

      await waitFor(() => {
        expect(
          screen.queryByText("Enter Your Username"),
        ).not.toBeInTheDocument();
      });
    });

    it("should trim whitespace from username", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      const startButton = screen.getByRole("button", { name: /Start/ });

      await userEvent.type(input, "   ValidUser   ");
      await userEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText("Welcome, ValidUser")).toBeInTheDocument();
      });
    });

    it("should prevent dialog close on backdrop click", async () => {
      const { container } = render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const backdrop = container.querySelector(".MuiBackdrop-root");
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      // Dialog should still be visible
      expect(screen.getByText("Enter Your Username")).toBeInTheDocument();
    });
  });

  // ============ SERVER HEALTH CHECK TESTS ============

  // describe("ServerPinger", () => {
  //   it("should show loading state initially", async () => {
  //     (globalThis.fetch as any).mockImplementationOnce(
  //       () => new Promise(() => {}), // Never resolves
  //     );

  //     render(
  //       <Provider store={store}>
  //         <FirstApp />
  //       </Provider>,
  //     );

  //     // The CircularProgress is rendered by ServerPinger
  //     expect(screen.getByRole("progressbar")).toBeInTheDocument();
  //   });

  //   it("should show success message when server responds with 200", async () => {
  //     (globalThis.fetch as any).mockResolvedValueOnce({
  //       ok: true,
  //       status: 200,
  //     });

  //     render(
  //       <Provider store={store}>
  //         <FirstApp />
  //       </Provider>,
  //     );

  //     await waitFor(() => {
  //       expect(
  //         screen.getByText("Server is awake! Commence to Gaming!"),
  //       ).toBeInTheDocument();
  //     });
  //   });

  //   it("should show error message when server returns non-ok status", async () => {
  //     (globalThis.fetch as any).mockResolvedValueOnce({
  //       ok: false,
  //       status: 500,
  //     });

  //     render(
  //       <Provider store={store}>
  //         <FirstApp />
  //       </Provider>,
  //     );

  //     await waitFor(() => {
  //       expect(
  //         screen.getByText(/Can't reach the server right now/),
  //       ).toBeInTheDocument();
  //     });
  //   });

  //   it("should show error message when fetch throws", async () => {
  //     (globalThis.fetch as any).mockRejectedValueOnce(new Error("Network error"));

  //     render(
  //       <Provider store={store}>
  //         <FirstApp />
  //       </Provider>,
  //     );

  //     await waitFor(() => {
  //       expect(
  //         screen.getByText(/Can't reach the server right now/),
  //       ).toBeInTheDocument();
  //     });
  //   });

  //   it("should call the correct health endpoint", async () => {
  //     (globalThis.fetch as any).mockResolvedValueOnce({
  //       ok: true,
  //     });

  //     render(
  //       <Provider store={store}>
  //         <FirstApp />
  //       </Provider>,
  //     );

  //     await waitFor(() => {
  //       expect(globalThis.fetch).toHaveBeenCalledWith(
  //         "http://localhost:3000/api/health",
  //       );
  //     });
  //   });
  // });

  // ============ SERVER HEALTH CHECK TESTS ============

  // CHQ: Gemini AI generated
  describe("ServerPinger", () => {
    // Spy on console.error to intercept log outputs
    // let consoleSpy: any;
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it("should show loading state initially", async () => {
      // vi.mocked safely handles the type inference for you!
      vi.mocked(globalThis.fetch).mockImplementationOnce(
        () => new Promise(() => {}), // Never resolves
      ); // Cast as Response to fulfill the standard fetch structure

      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("should show success message when server responds with 200", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
      } as Response); // Cast as Response to fulfill the standard fetch structure

      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      await waitFor(() => {
        expect(
          screen.getByText("Server is awake! Commence to Gaming!"),
        ).toBeInTheDocument();
      });
    });

    it("should show error message when server returns non-ok status", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response); // Cast as Response to fulfill the standard fetch structure

      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Can't reach the server right now/),
        ).toBeInTheDocument();
      });

      // Optional: Verify that the error log was hit successfully
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should show error message when fetch throws", async () => {
      vi.mocked(globalThis.fetch).mockRejectedValueOnce(
        new Error("Network Error"),
      );

      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Can't reach the server right now/),
        ).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  // ============ NAVIGATION & ROUTING TESTS ============

  describe("Navigation", () => {
    beforeEach(() => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
      } as Response); // Cast as Response to fulfill the standard fetch structure
    });

    it("should render home page with welcome message and navigation buttons", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "TestPlayer");
      await userEvent.click(screen.getByRole("button", { name: /Start/ }));

      await waitFor(() => {
        expect(screen.getByText(/Welcome, TestPlayer/)).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Go to Ping Pong game/ }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Go to the 2048 game/ }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Go to Tetris game/ }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /View Leaderboard/ }),
        ).toBeInTheDocument();
      });
    });

    it("should navigate to Ping Pong game", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "TestPlayer");
      await userEvent.click(screen.getByRole("button", { name: /Start/ }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Go to Ping Pong game/ }),
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole("button", { name: /Go to Ping Pong game/ }),
      );

      expect(screen.getByText("PingPong: TestPlayer")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Back to Home/ }),
      ).toBeInTheDocument();
    });

    it("should navigate to 2048 game", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "Player123");
      await userEvent.click(screen.getByRole("button", { name: /Start/ }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Go to the 2048 game/ }),
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole("button", { name: /Go to the 2048 game/ }),
      );

      expect(screen.getByText("2048: Player123")).toBeInTheDocument();
    });

    it("should navigate to Tetris game", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "Gamer42");
      await userEvent.click(screen.getByRole("button", { name: /Start/ }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Go to Tetris game/ }),
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole("button", { name: /Go to Tetris game/ }),
      );

      expect(screen.getByText("Tetris: Gamer42")).toBeInTheDocument();
    });

    it("should navigate to Leaderboard", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "CompetitiveGamer");
      await userEvent.click(screen.getByRole("button", { name: /Start/ }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /View Leaderboard/ }),
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole("button", { name: /View Leaderboard/ }),
      );

      expect(screen.getByText("Leaderboard Page")).toBeInTheDocument();
    });

    it("should navigate to Privacy Policy", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "PrivacyAware");
      await userEvent.click(screen.getByRole("button", { name: /Start/ }));

      await waitFor(() => {
        const privacyButton = screen
          .getAllByRole("button")
          .find((btn) => btn.textContent === "Privacy Policy");
        expect(privacyButton).toBeInTheDocument();
      });

      const privacyButton = screen
        .getAllByRole("button")
        .find((btn) => btn.textContent === "Privacy Policy");
      await userEvent.click(privacyButton!);

      expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
    });

    it("should navigate to Terms of Use", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "TermsReader");
      await userEvent.click(screen.getByRole("button", { name: /Start/ }));

      await waitFor(() => {
        const termsButton = screen
          .getAllByRole("button")
          .find((btn) => btn.textContent === "Terms of Use");
        expect(termsButton).toBeInTheDocument();
      });

      const termsButton = screen
        .getAllByRole("button")
        .find((btn) => btn.textContent === "Terms of Use");
      await userEvent.click(termsButton!);

      expect(screen.getByText("Terms of Use")).toBeInTheDocument();
    });

    it("should navigate to Disclaimer", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "Cautious");
      await userEvent.click(screen.getByRole("button", { name: /Start/ }));

      await waitFor(() => {
        const disclaimerButton = screen
          .getAllByRole("button")
          .find((btn) => btn.textContent === "Disclaimer");
        expect(disclaimerButton).toBeInTheDocument();
      });

      const disclaimerButton = screen
        .getAllByRole("button")
        .find((btn) => btn.textContent === "Disclaimer");
      await userEvent.click(disclaimerButton!);

      expect(screen.getByText("Disclaimer")).toBeInTheDocument();
    });

    it("should return to home when Back button is clicked", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "Traveler");
      await userEvent.click(screen.getByRole("button", { name: /Start/ }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Go to Ping Pong game/ }),
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole("button", { name: /Go to Ping Pong game/ }),
      );

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Back to Home/ }),
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole("button", { name: /Back to Home/ }),
      );

      expect(screen.getByText(/Welcome, Traveler/)).toBeInTheDocument();
    });

    it("should pass username to game components via Redux", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      const testUsername = "ProGamer99";
      await userEvent.type(input, testUsername);
      await userEvent.click(screen.getByRole("button", { name: /Start/ }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Go to Ping Pong game/ }),
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole("button", { name: /Go to Ping Pong game/ }),
      );

      expect(screen.getByText(`PingPong: ${testUsername}`)).toBeInTheDocument();
    });
  });

  // ============ REDUX STATE TESTS ============

  describe("Redux State Management", () => {
    beforeEach(() => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
      } as Response); // Cast as Response to fulfill the standard fetch structure
    });

    it("should dispatch setUsername action when username is submitted", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      const testUsername = "ReduxTest";
      await userEvent.type(input, testUsername);
      await userEvent.click(screen.getByRole("button", { name: /Start/ }));

      await waitFor(() => {
        // const state = store.getState();
        const state = store.getState() as ReturnType<typeof store.getState>;
        expect(state.user.username).toBe(testUsername);
      });
    });

    it("should update welcome message with username from Redux state", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      const testUsername = "StateTest";
      await userEvent.type(input, testUsername);
      await userEvent.click(screen.getByRole("button", { name: /Start/ }));

      await waitFor(() => {
        expect(
          screen.getByText(`Welcome, ${testUsername}`),
        ).toBeInTheDocument();
      });
    });
  });

  // ============ LAYOUT & STYLING TESTS ============

  describe("Layout & Styling", () => {
    beforeEach(() => {
      // vi.mocked safely handles the type inference for you!
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
      } as Response); // Cast as Response to fulfill the standard fetch structure
    });

    it("should apply game-page class when on a game path", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "LayoutTest");
      await userEvent.click(screen.getByRole("button", { name: /Start/ }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Go to Ping Pong game/ }),
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole("button", { name: /Go to Ping Pong game/ }),
      );

      const root = document.getElementById("root");
      await waitFor(() => {
        expect(root?.classList.contains("game-page")).toBe(true);
      });
    });

    it("should remove game-page class when navigating away from game", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "LayoutTest2");
      await userEvent.click(screen.getByRole("button", { name: /Start/ }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Go to Tetris game/ }),
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole("button", { name: /Go to Tetris game/ }),
      );

      const root = document.getElementById("root");
      await waitFor(() => {
        expect(root?.classList.contains("game-page")).toBe(true);
      });

      await userEvent.click(
        screen.getByRole("button", { name: /Back to Home/ }),
      );

      await waitFor(() => {
        expect(root?.classList.contains("game-page")).toBe(false);
      });
    });

    it("should not display ads and footer on game pages", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "AdTest");
      await userEvent.click(screen.getByRole("button", { name: /Start/ }));

      await waitFor(() => {
        expect(
          // screen.getByRole("button", { name: /Go to 2048/ }),
          screen.getByRole("button", { name: /Go to the 2048 game/ }),
        ).toBeInTheDocument();
      });

      await userEvent.click(
        // screen.getByRole("button", { name: /Go to the 2048 game/ }),
        screen.getByRole("button", { name: /Go to the 2048 game/ }),
      );

      const adContainer = document.getElementById("apitiny-adz-container");
      await waitFor(() => {
        expect(adContainer).not.toBeInTheDocument();
      });
    });

    it("should display ads and footer on non-game pages", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "FooterTest");
      await userEvent.click(screen.getByRole("button", { name: /Start/ }));

      const adContainer = document.getElementById("apitiny-adz-container");
      expect(adContainer).toBeInTheDocument();

      const footerButtons = screen
        .getAllByRole("button")
        .filter(
          (btn) =>
            btn.textContent === "Terms of Use" ||
            btn.textContent === "Privacy Policy",
        );
      expect(footerButtons.length).toBeGreaterThan(0);
    });
  });

  // ============ EDGE CASES & ERROR HANDLING ============

  describe("Edge Cases", () => {
    beforeEach(() => {
      // vi.mocked safely handles the type inference for you!
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
      } as Response); // Cast as Response to fulfill the standard fetch structure
    });

    it("should handle rapid navigation between pages", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "RapidNav");
      await userEvent.click(screen.getByRole("button", { name: /Start/ }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Go to the 2048 game/ }),
        ).toBeInTheDocument();
      });

      // Rapid navigation
      await userEvent.click(
        screen.getByRole("button", { name: /Go to Ping Pong game/ }),
      );
      await userEvent.click(
        screen.getByRole("button", { name: /Back to Home/ }),
      );
      await userEvent.click(
        screen.getByRole("button", { name: /Go to the 2048 game/ }),
      );

      expect(screen.getByText("2048: RapidNav")).toBeInTheDocument();
    });

    it("should handle username with special characters", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "User@123!");
      await userEvent.click(screen.getByRole("button", { name: /Start/ }));

      await waitFor(() => {
        expect(screen.getByText("Welcome, User@123!")).toBeInTheDocument();
      });
    });

    it("should handle username at exactly 2 characters (minimum)", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "AB");
      await userEvent.click(screen.getByRole("button", { name: /Start/ }));

      await waitFor(() => {
        expect(screen.getByText("Welcome, AB")).toBeInTheDocument();
      });
    });

    it("should handle username at exactly 20 characters (maximum)", async () => {
      render(
        <Provider store={store}>
          <FirstApp />
        </Provider>,
      );

      const input = screen.getByPlaceholderText(/Enter your username/);
      await userEvent.type(input, "a".repeat(20));
      await userEvent.click(screen.getByRole("button", { name: /Start/ }));

      await waitFor(() => {
        expect(
          screen.getByText(`Welcome, ${"a".repeat(20)}`),
        ).toBeInTheDocument();
      });
    });
  });
});
