import * as React from "react";
import {
  Box,
  Button,
  CssBaseline,
  TextField,
  Stack,
  Typography,
  Snackbar,
} from "@mui/material";
import MuiCard from "@mui/material/Card";
import { styled } from "@mui/material/styles";
import { AuthContext } from "../contexts/AuthContexts.jsx";

// Refactored for a premium developer tool theme
const Card = styled(MuiCard)(() => ({
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  padding: "32px",
  borderRadius: 12, // Lowered border radius for sharper lines
  backgroundColor: "#12111a", // Deep workspace dark grey
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow: "0 40px 100px rgba(0, 0, 0, 0.7)",
  maxWidth: 400,
  width: "100%",
}));

// Reusable styling parameters for text inputs
const textInputStyles = {
  "& .MuiOutlinedInput-root": {
    color: "#f1f5f9",
    borderRadius: "8px",
    "& fieldset": { borderColor: "rgba(255, 255, 255, 0.08)" },
    "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.15)" },
    "&.Mui-focused fieldset": { borderColor: "#6366f1" },
    
    // 👇 THIS CRUSHES THE AUTOFILL WHITE BACKGROUND OVERRIDE 👇
    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 100px #12111a inset !important", // Match your card color
      WebkitTextFillColor: "#f1f5f9 !important", // Maintain white text
      caretColor: "#f1f5f9",
      borderRadius: "inherit",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#94a3b8",
    "&.Mui-focused": { color: "#6366f1" },
  },
};

export default function Authentication() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [formState, setFormState] = React.useState(0); // 0 = Sign In, 1 = Sign Up

  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  const handleAuth = async () => {
    try {
      if (formState === 1) {
        await handleRegister(username, name, password);
        setMessage("Registration successful. Please sign in.");
        setFormState(0);
      } else {
        await handleLogin(username, password);
        setMessage("Login successful");
      }
      setOpen(true);
    } catch (err) {
      setMessage(err?.message || "Authentication failed");
      setOpen(true);
    }
  };

  return (
    <>
      <CssBaseline />

      <Stack
        height="100vh"
        justifyContent="center"
        alignItems="center"
        sx={{
          backgroundColor: "#080710", // Matching ultra-dark landing backdrop
          position: "relative",
          overflow: "hidden",
          padding: "20px"
        }}
      >
        {/* Focused Gradient Glow */}
        <Box
          sx={{
            position: "absolute",
            width: 600,
            height: 400,
            background: "radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1), transparent 65%)",
            filter: "blur(100px)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />

        <Card>
          {/* BRAND HEADERS */}
          <Box textAlign="center" mb={1}>
            <Box
              component="img"
              src="/logo.png"
              alt="DristiMeet logo"
              sx={{
                height: 40,
                mb: 1.5,
                objectFit: "contain"
              }}
            />

            <Typography
              variant="h5"
              fontWeight={700}
              sx={{ color: "#ffffff", letterSpacing: "-0.03em" }}
            >
              DristiMeet
            </Typography>

            <Typography
              variant="body2"
              sx={{ mt: 0.5, color: "#64748b" }}
            >
              Developer Collaboration Workspace
            </Typography>
          </Box>

          {/* AUTH TOGGLES */}
          <Box display="flex" gap={1} sx={{ backgroundColor: "#0c0b12", p: "4px", borderRadius: "8px" }}>
            <Button
              fullWidth
              variant="text"
              onClick={() => setFormState(0)}
              sx={{
                color: formState === 0 ? "#ffffff" : "#94a3b8",
                backgroundColor: formState === 0 ? "#12111a" : "transparent",
                border: formState === 0 ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid transparent",
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 500,
                "&:hover": { backgroundColor: formState === 0 ? "#12111a" : "rgba(255,255,255,0.02)" }
              }}
            >
              Sign In
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => setFormState(1)}
              sx={{
                color: formState === 1 ? "#ffffff" : "#94a3b8",
                backgroundColor: formState === 1 ? "#12111a" : "transparent",
                border: formState === 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid transparent",
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 500,
                "&:hover": { backgroundColor: formState === 1 ? "#12111a" : "rgba(255,255,255,0.02)" }
              }}
            >
              Sign Up
            </Button>
          </Box>

          {/* CONTENT INPUT FORM FIELDS */}
          {formState === 1 && (
            <TextField
              label="Full Name"
              fullWidth
              variant="outlined"
              onChange={(e) => setName(e.target.value)}
              sx={textInputStyles}
            />
          )}

          <TextField
            label="Username"
            fullWidth
            variant="outlined"
            onChange={(e) => setUsername(e.target.value)}
            sx={textInputStyles}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            onChange={(e) => setPassword(e.target.value)}
            sx={textInputStyles}
          />

          {/* EXECUTION SUBMIT BUTTON */}
          <Button
            fullWidth
            size="large"
            variant="contained"
            onClick={handleAuth}
            disabled={!username || !password || (formState === 1 && !name)}
            sx={{
              backgroundColor: "#6366f1",
              color: "#ffffff",
              textTransform: "none",
              fontWeight: 500,
              borderRadius: "8px",
              padding: "12px",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.4)",
              "&:hover": {
                backgroundColor: "#4f46e5",
                boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)"
              },
              "&.Mui-disabled": {
                backgroundColor: "rgba(99, 102, 241, 0.2)",
                color: "rgba(255, 255, 255, 0.35)"
              }
            }}
          >
            {formState === 0 ? "Sign In" : "Create Account"}
          </Button>
        </Card>

        <Snackbar
          open={open}
          autoHideDuration={4000}
          onClose={() => setOpen(false)}
          message={message}
          ContentProps={{
            sx: {
              backgroundColor: "#12111a",
              color: "#f1f5f9",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px"
            }
          }}
        />
      </Stack>
    </>
  );
}