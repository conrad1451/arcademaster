// @vitest-environment node
// tests/vitestTests/api/client.test.ts
//
// Exercises the real fetch path against an msw server, so URL building, status
// handling, and the "got HTML instead of JSON" case are tested end to end.

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  ApiConfigError,
  ApiError,
  fetchScores,
  getBaseUrl,
  parseBaseUrl,
  pingHealth,
  postScore,
  type Score,
} from "../../../src/api/client";

const BASE = "http://api.test";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => vi.stubEnv("VITE_API_URL", BASE));
afterEach(() => vi.unstubAllEnvs());

const sampleScore: Score = {
  id: 1,
  username: "ada",
  gameType: "TETRIS",
  score: 1200,
  updatedAt: "2026-10-13T12:00:00Z",
};

describe("parseBaseUrl", () => {
  it("returns a valid URL unchanged", () => {
    expect(parseBaseUrl("https://example.com")).toBe("https://example.com");
  });

  it("strips trailing slashes and whitespace", () => {
    expect(parseBaseUrl("  https://example.com//  ")).toBe("https://example.com");
  });

  it("keeps a path prefix", () => {
    expect(parseBaseUrl("https://example.com/v1/")).toBe("https://example.com/v1");
  });

  it.each([
    ["undefined", undefined],
    ["empty", ""],
    ["blank", "   "],
  ])("throws a helpful ApiConfigError when %s", (_label, value) => {
    expect(() => parseBaseUrl(value)).toThrow(ApiConfigError);
    expect(() => parseBaseUrl(value)).toThrow(/VITE_API_URL is not set.*\.env.*restart/s);
  });

  it.each(["undefined", "/api", "localhost:3000", "ftp://example.com"])(
    "rejects %s",
    (value) => {
      expect(() => parseBaseUrl(value)).toThrow(ApiConfigError);
    },
  );

  it("getBaseUrl reads VITE_API_URL at call time", () => {
    expect(getBaseUrl()).toBe(BASE);
    vi.stubEnv("VITE_API_URL", "https://other.example/");
    expect(getBaseUrl()).toBe("https://other.example");
  });
});

describe("fetchScores", () => {
  it("requests the per-game endpoint and returns the parsed scores", async () => {
    let requested = "";
    server.use(
      http.get(`${BASE}/api/scores/game/:gameType`, ({ params }) => {
        requested = String(params.gameType);
        return HttpResponse.json([sampleScore]);
      }),
    );

    await expect(fetchScores("TETRIS")).resolves.toEqual([sampleScore]);
    expect(requested).toBe("TETRIS");
  });

  it("tolerates a trailing slash in VITE_API_URL", async () => {
    vi.stubEnv("VITE_API_URL", `${BASE}/`);
    server.use(
      http.get(`${BASE}/api/scores/game/GAME_2048`, () => HttpResponse.json([])),
    );
    await expect(fetchScores("GAME_2048")).resolves.toEqual([]);
  });

  it("throws ApiError carrying the status for non-2xx responses", async () => {
    server.use(
      http.get(`${BASE}/api/scores/game/TETRIS`, () => new HttpResponse(null, { status: 503 })),
    );
    const error = await fetchScores("TETRIS").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(503);
  });

  // The bug that prompted this module: a missing VITE_API_URL made the request
  // hit the dev server, which answers 200 with index.html.
  it("explains itself when a 200 response is HTML, not JSON", async () => {
    server.use(
      http.get(
        `${BASE}/api/scores/game/TETRIS`,
        () =>
          new HttpResponse("<!doctype html><html></html>", {
            status: 200,
            headers: { "Content-Type": "text/html" },
          }),
      ),
    );
    const error = await fetchScores("TETRIS").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toMatch(/did not return JSON/);
    expect((error as ApiError).message).toMatch(/text\/html/);
    expect((error as ApiError).message).toMatch(/VITE_API_URL/);
  });

  it("fails with ApiConfigError, before any network call, when the URL is unset", async () => {
    vi.stubEnv("VITE_API_URL", "");
    // onUnhandledRequest: "error" would fail the test if a request were made
    await expect(fetchScores("TETRIS")).rejects.toBeInstanceOf(ApiConfigError);
  });
});

describe("postScore", () => {
  it("POSTs the score as JSON", async () => {
    let body: unknown;
    let contentType: string | null = null;
    server.use(
      http.post(`${BASE}/api/scores`, async ({ request }) => {
        body = await request.json();
        contentType = request.headers.get("content-type");
        return new HttpResponse(null, { status: 201 });
      }),
    );

    await postScore("ada", "GAME_2048", 512);

    expect(body).toEqual({ username: "ada", gameType: "GAME_2048", score: 512 });
    expect(contentType).toBe("application/json");
  });

  it("does not require a JSON response body", async () => {
    server.use(http.post(`${BASE}/api/scores`, () => new HttpResponse(null, { status: 200 })));
    await expect(postScore("ada", "PING_PONG", 3)).resolves.toBeUndefined();
  });

  it("rejects with ApiError on a server error", async () => {
    server.use(http.post(`${BASE}/api/scores`, () => new HttpResponse(null, { status: 500 })));
    const error = await postScore("ada", "PING_PONG", 3).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
    expect((error as ApiError).message).toMatch(/POST \/api\/scores failed: 500/);
  });
});

describe("pingHealth", () => {
  it("resolves when the server is healthy (body is ignored)", async () => {
    server.use(http.get(`${BASE}/api/health`, () => new HttpResponse("OK")));
    await expect(pingHealth()).resolves.toBeUndefined();
  });

  it("rejects when the server is unhealthy", async () => {
    server.use(http.get(`${BASE}/api/health`, () => new HttpResponse(null, { status: 502 })));
    await expect(pingHealth()).rejects.toBeInstanceOf(ApiError);
  });

  it("rejects on a network failure", async () => {
    server.use(http.get(`${BASE}/api/health`, () => HttpResponse.error()));
    await expect(pingHealth()).rejects.toThrow();
  });
});
