// @vitest-environment node
// tests/vitestTests/api/submitScore.test.ts
//
// submitScore is the fire-and-forget wrapper the games use: it must never throw.

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { submitScore } from "../../../src/utils/submitScore";

const BASE = "http://api.test";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
beforeEach(() => {
  vi.stubEnv("VITE_API_URL", BASE);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("submitScore", () => {
  it("sends the score and logs success", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/api/scores`, async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 201 });
      }),
    );

    await submitScore("ada", "TETRIS", 900);

    expect(body).toEqual({ username: "ada", gameType: "TETRIS", score: 900 });
    expect(console.log).toHaveBeenCalledWith("✅ Score saved successfully!");
    expect(console.error).not.toHaveBeenCalled();
  });

  it("does not throw when the server returns an error", async () => {
    server.use(http.post(`${BASE}/api/scores`, () => new HttpResponse(null, { status: 500 })));
    await expect(submitScore("ada", "TETRIS", 900)).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it("does not throw on a network failure", async () => {
    server.use(http.post(`${BASE}/api/scores`, () => HttpResponse.error()));
    await expect(submitScore("ada", "TETRIS", 900)).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it("does not throw (or call the network) when VITE_API_URL is unset", async () => {
    vi.stubEnv("VITE_API_URL", "");
    await expect(submitScore("ada", "TETRIS", 900)).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(
      "❌ Failed to save score:",
      expect.objectContaining({ name: "ApiConfigError" }),
    );
  });
});
