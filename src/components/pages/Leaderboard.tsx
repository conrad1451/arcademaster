// src/components/pages/Leaderboard.tsx

// CHQ: Claude AI (Haiku) scaffolded
// CHQ: Claude AI (Sonnet): switched to per-game-type fetch to match actual backend API,
// refetches on tab change, updatedAt instead of createdAt

import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Typography,
  CircularProgress,
} from "@mui/material";

interface Score {
  id: number;
  username: string;
  gameType: "GAME_2048" | "PING_PONG" | "TETRIS";
  score: number;
  updatedAt: string;
}

type GameTab = "GAME_2048" | "PING_PONG" | "TETRIS";

const gameLabels: Record<GameTab, string> = {
  GAME_2048: "2048",
  PING_PONG: "Ping Pong",
  TETRIS: "Tetris",
};

export const Leaderboard: React.FC = () => {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<GameTab>("GAME_2048");

  const baseUrl = import.meta.env.VITE_API_URL;

  // CHQ: Claude AI (Sonnet): backend only exposes GET /api/scores/game/{gameType},
  // there's no bulk "all scores" endpoint - so fetch per active tab instead of once
  useEffect(() => {
    let cancelled = false;

    const fetchScores = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${baseUrl}/api/scores/game/${activeTab}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch scores: ${response.status}`);
        }

        const data: Score[] = await response.json();
        if (!cancelled) setScores(data);
      } catch (error) {
        console.error("❌ Error fetching scores:", error);
        if (!cancelled) setScores([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchScores();

    return () => {
      cancelled = true;
    };
  }, [baseUrl, activeTab]);

  // CHQ: Claude AI (Sonnet): backend already returns highest-score-first per the README,
  // but sort defensively client-side too in case that ever changes
  const sortedScores = [...scores]
    .sort((a, b) => b.score - a.score)
    .slice(0, 100);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: GameTab) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h2" gutterBottom sx={{ mb: 4, textAlign: "center" }}>
        🏆 Leaderboard
      </Typography>

      <Paper sx={{ width: "100%" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="game tabs"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          {Object.entries(gameLabels).map(([gameType, label]) => (
            <Tab key={gameType} label={label} value={gameType as GameTab} />
          ))}
        </Tabs>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : sortedScores.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="textSecondary">
              No scores yet for {gameLabels[activeTab]}. Play a game to get on
              the leaderboard!
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>
                    Rank
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Player</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    Score
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    Last Updated
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedScores.map((score, index) => (
                  <TableRow
                    key={score.id}
                    sx={{
                      backgroundColor:
                        index === 0
                          ? "#ffd700"
                          : index === 1
                            ? "#c0c0c0"
                            : index === 2
                              ? "#cd7f32"
                              : "inherit",
                      "&:hover": { backgroundColor: "#f9f9f9" },
                    }}
                  >
                    <TableCell align="center">
                      {index === 0
                        ? "🥇"
                        : index === 1
                          ? "🥈"
                          : index === 2
                            ? "🥉"
                            : index + 1}
                    </TableCell>
                    <TableCell>{score.username}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      {score.score.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {new Date(score.updatedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default Leaderboard;
