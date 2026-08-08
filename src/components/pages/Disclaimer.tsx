// src/components/pages/Disclaimer.tsx

import React from "react";
import { Box, Typography, Button } from "@mui/material";

export const Disclaimer: React.FC = () => {
  return (
    <Box sx={{ p: 4, maxWidth: 900, mx: "auto" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h3">Disclaimer</Typography>
        <Button
          variant="outlined"
          href="/disclaimer.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in new tab
        </Button>
      </Box>

      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <iframe
          src="/disclaimer.pdf"
          title="Disclaimer"
          style={{ width: "100%", height: "80vh", border: "none" }}
        />
      </Box>
    </Box>
  );
};

export default Disclaimer;
