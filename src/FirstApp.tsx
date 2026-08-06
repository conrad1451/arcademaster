// src/FirstApp.tsx

import React, { useState, useCallback } from "react";

import {
  Button,
  Box,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import { useDispatch, useSelector } from "react-redux";
import { setUsername } from "./store/userSlice";
import type { RootState } from "./store";

import PingPongGame from "./components/games/PingPongGame";
import { The2048Game } from "./components/games/2048Game";
import Tetris from "./components/games/Tetris";

import Leaderboard from "./components/pages/Leaderboard";

export interface NavigationButtonsProps {
  navigate: (path: string) => void;
}

// --- END: Placeholder Components ---

// --- START: Helper components

const UsernameDiaglog = (props: {
  showUsernameDialog: boolean;
  usernameInput: string;
  handleUsernameChange: (
    e: React.ChangeEvent<HTMLInputElement, Element>,
  ) => void;
  handleUsernameSubmit: () => void;
}) => {
  const {
    showUsernameDialog,
    usernameInput,
    handleUsernameChange,
    handleUsernameSubmit,
  } = props;
  return (
    <Dialog
      open={showUsernameDialog}
      onClose={(_, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") {
          return;
        }
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Enter Your Username</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <TextField
          autoFocus
          fullWidth
          label="Username"
          value={usernameInput}
          onChange={handleUsernameChange}
          // CHQ: ChatGPT replaced deprecated onKeyPress with onKeyDown
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleUsernameSubmit();
            }
          }}
          placeholder="Enter your username"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleUsernameSubmit} variant="contained">
          Start
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// CHQ: ChatGPT added navigate as a prop
const MainApp = (props: {
  currentPath: string;
  content: React.JSX.Element;
  navigate: (path: string) => void;
}) => {
  const { currentPath, content, navigate } = props;
  return (
    <Box
      sx={{
        fontFamily: "Inter",
        bgcolor: "#f4f7f9",
        flex: 1, // fill #root's remaining space, instead of redeclaring full height
        width: "100%", // was minWidth: "100vw" / width: "100%" attempt — no viewport units
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
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
};

// --- END: Helper components

// --- START: Navigation & Main App ---

const NavigationButtons: React.FC<NavigationButtonsProps> = ({ navigate }) => {
  return (
    <Box sx={{ display: "flex", gap: 2, justifyContent: "center", p: 4 }}>
      <Button variant="contained" onClick={() => navigate("/pingpong")}>
        Go to Ping Pong game
      </Button>
      <Button variant="contained" onClick={() => navigate("/the-2048-game")}>
        Go to the 2048 game
      </Button>
      <Button variant="contained" onClick={() => navigate("/tetris")}>
        Go to Tetris game
      </Button>
      <Button
        variant="contained"
        color="success"
        onClick={() => navigate("/leaderboard")}
      >
        View Leaderboard
      </Button>
    </Box>
  );
};

function FirstApp() {
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [showUsernameDialog, setShowUsernameDialog] = useState<boolean>(true);

  // CHQ: Claude AI (Haiku) added wiring to pass in username as state into each game
  const dispatch = useDispatch();
  const username = useSelector((state: RootState) => state.user.username);

  // Function to simulate navigation (replaces useNavigate)
  const navigate = useCallback((path: string) => {
    setCurrentPath(path);
  }, []);

  const handleUsernameSubmit = () => {
    if (usernameInput.trim()) {
      dispatch(setUsername(usernameInput.trim()));
      setShowUsernameDialog(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsernameInput(e.target.value);
  };

  let content;

  switch (currentPath) {
    case "/tetris":
      // content = <Tetris />;
      content = <Tetris username={username} />; // Pass username prop
      break;

    case "/pingpong":
      // content = <PingPongGame />;
      content = <PingPongGame username={username} />; // Pass username prop
      break;

    case "/the-2048-game":
      // content = <The2048Game />;
      content = <The2048Game username={username} />; // Pass username prop
      break;
    case "/leaderboard":
      content = <Leaderboard />;
      break;

    case "/":
    default:
      content = (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h3" gutterBottom>
            Welcome, {username}
          </Typography>
          <NavigationButtons navigate={navigate} />
        </Box>
      );
      break;
  }

  return (
    <>
      <UsernameDiaglog
        showUsernameDialog={showUsernameDialog}
        usernameInput={usernameInput}
        handleUsernameChange={handleUsernameChange}
        handleUsernameSubmit={handleUsernameSubmit}
      />
      <MainApp
        currentPath={currentPath}
        content={content}
        navigate={navigate}
      />
    </>
  );
}

export default FirstApp;
