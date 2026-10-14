// src/utils/submitScore.ts
//
// Fire-and-forget wrapper used by the games: it never throws, because a failed
// score upload must not interrupt the game-over screen. All HTTP and URL
// handling lives in src/api/client.ts.

import { postScore, type GameType } from "../api/client";

export async function submitScore(
  username: string,
  gameType: GameType,
  score: number,
): Promise<void> {
  try {
    await postScore(username, gameType, score);
    console.log("✅ Score saved successfully!");
  } catch (error) {
    console.error("❌ Failed to save score:", error);
  }
}
