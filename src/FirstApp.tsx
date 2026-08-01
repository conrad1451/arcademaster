import React, { useState, useCallback } from "react";
import { Button, Box, Typography } from "@mui/material";

import PingPongGame from "./components/games/PingPongGame";

export interface NavigationButtonsProps {
  navigate: (path: string) => void;
}

const SamplePage: React.FC = () => (
  <Box sx={{ p: 4, textAlign: "center" }}>
    <Typography variant="h4" color="primary">
      Original Sample Page
    </Typography>

    {/* CHQ: Gemini AI wrapped mt in sx */}
    <Typography variant="body1" sx={{ mt: 2 }}>
      This is a placeholder for your original content.
    </Typography>
  </Box>
);

// --- END: Placeholder Components ---

// --- START: Navigation & Main App ---

const NavigationButtons: React.FC<NavigationButtonsProps> = ({ navigate }) => {
  return (
    <Box sx={{ display: "flex", gap: 2, justifyContent: "center", p: 4 }}>
      <Button variant="contained" onClick={() => navigate("/orig")}>
        Go to original page
      </Button>
      <Button variant="contained" onClick={() => navigate("/pingpong")}>
        Go to Ping Pong game
      </Button>
    </Box>
  );
};

function App() {
  const [currentPath, setCurrentPath] = useState<string>("/");

  // Function to simulate navigation (replaces useNavigate)
  const navigate = useCallback((path: string) => {
    setCurrentPath(path);
  }, []);

  let content;

  switch (currentPath) {
    case "/orig":
      content = <SamplePage />;
      break;

    case "/pingpong":
      content = <PingPongGame />;
      break;
    case "/":
    default:
      content = (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h3" gutterBottom>
            Welcome
          </Typography>
          <NavigationButtons navigate={navigate} />
        </Box>
      );
      break;
  }

  return (
    <Box
      sx={{
        fontFamily: "Inter",
        bgcolor: "#f4f7f9",
        minHeight: "100vh",
        minWidth: "100vw",
        display: "flex", // Enable flex container
        justifyContent: "center", // Center content horizontally
        // alignItems: 'flex-start', // (Optional) Keep content aligned to the top
      }}
    >
      <Box
        sx={{
          // maxWidth: 800,
          // minWidth: 1400,
          // minWidth: 1000,
          width: "100%", // Ensure it uses max width available up to 800px
          pt: 4,
        }}
      >
        {currentPath !== "/" && (
          <Button
            onClick={() => navigate("/")}
            sx={{ mb: 2, ml: 2 }}
            variant="text"
          >
            ← Back to Home
          </Button>
        )}
        {content}
      </Box>
    </Box>
  );
}

export default App;
