// src/utils/submitScore.ts

export async function submitScore(
  username: string,
  gameType: "GAME_2048" | "PING_PONG" | "TETRIS",
  score: number,
) {
  const baseUrl = import.meta.env.VITE_API_URL;

  try {
    const response = await fetch(baseUrl + "/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        gameType: gameType,
        score,
      }),
    });

    if (response.ok) {
      console.log("✅ Score saved successfully!");
    } else {
      console.error(
        "❌ Failed to save score:",
        response.status,
        response.statusText,
      );
    }
  } catch (error) {
    console.error("❌ Network error:", error);
  }
}
