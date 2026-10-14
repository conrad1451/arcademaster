// src/api/client.ts
//
// The single place that talks to the backend. Components and utilities call
// these functions instead of using fetch / import.meta.env directly, so:
//   - a missing or malformed VITE_API_URL fails loudly with an actionable message
//   - an HTML response (e.g. a dev server's index.html fallback) is reported as
//     such, instead of surfacing as "JSON.parse: unexpected character"
//   - tests only need to mock this module, or intercept HTTP at one boundary

export type GameType = "GAME_2048" | "PING_PONG" | "TETRIS";

export interface Score {
  id: number;
  username: string;
  gameType: GameType;
  score: number;
  updatedAt: string;
}

/** VITE_API_URL is missing or isn't an absolute http(s) URL. */
export class ApiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiConfigError";
  }
}

/** The server was reached but the response wasn't usable. */
export class ApiError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const CONFIG_HELP =
  "Create a .env file in the project root with " +
  "VITE_API_URL=https://<your-backend> and restart the dev server " +
  "(Vite only reads .env at startup).";

/**
 * Validate a raw VITE_API_URL value and return it without a trailing slash.
 * Throws ApiConfigError when it's unset or not an absolute http(s) URL.
 */
export function parseBaseUrl(raw: string | undefined): string {
  const value = raw?.trim();

  if (!value) {
    throw new ApiConfigError(`VITE_API_URL is not set. ${CONFIG_HELP}`);
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ApiConfigError(
      `VITE_API_URL ("${value}") is not a valid absolute URL. ${CONFIG_HELP}`,
    );
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ApiConfigError(
      `VITE_API_URL must start with http:// or https:// (got "${value}"). ${CONFIG_HELP}`,
    );
  }

  return value.replace(/\/+$/, "");
}

/** The validated API base URL from the environment. Read at call time. */
export const getBaseUrl = (): string =>
  parseBaseUrl(import.meta.env.VITE_API_URL);

/** fetch + base URL + status check. Resolves only for 2xx responses. */
async function request(path: string, init?: RequestInit): Promise<Response> {
  const url = `${getBaseUrl()}${path}`;
  const response = init ? await fetch(url, init) : await fetch(url);

  if (!response.ok) {
    throw new ApiError(
      `${init?.method ?? "GET"} ${path} failed: ${response.status} ${response.statusText}`.trim(),
      response.status,
    );
  }
  return response;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await request(path, init);
  try {
    return (await response.json()) as T;
  } catch {
    const type = response.headers?.get("content-type") ?? "unknown";
    throw new ApiError(
      `${path} did not return JSON (content-type: ${type}). ` +
        "VITE_API_URL probably points at the wrong server, such as the dev server itself.",
      response.status,
    );
  }
}

/** Scores for one game, as returned by the backend. */
export function fetchScores(gameType: GameType): Promise<Score[]> {
  return requestJson<Score[]>(`/api/scores/game/${gameType}`);
}

/** Save a score. Rejects with ApiError / ApiConfigError / a network error. */
export async function postScore(
  username: string,
  gameType: GameType,
  score: number,
): Promise<void> {
  await request("/api/scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, gameType, score }),
  });
}

/** Wake / check the backend. Rejects if it can't be reached or isn't healthy. */
export async function pingHealth(): Promise<void> {
  await request("/api/health");
}
