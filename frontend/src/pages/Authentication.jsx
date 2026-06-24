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

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  padding: theme.spacing(4),
  borderRadius: 16,
  boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
  maxWidth: 420,
  width: "100%",
}));

export default function Authentication() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [formState, setFormState] = React.useState(0); // 0 = Sign In, 1 = Sign Up

  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const { handleRegister, handleLogin } =
    React.useContext(AuthContext);

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
    background: "linear-gradient(135deg, #eef2ff, #f8fafc)",
    position: "relative",
    overflow: "hidden",
  }}
>       <Box
  sx={{
    position: "absolute",
    width: 400,
    height: 400,
    background: "radial-gradient(circle, #93c5fd 0%, transparent 70%)",
    filter: "blur(120px)",
    top: "20%",
    left: "50%",
    transform: "translateX(-50%)",
  }}
/>


        <Card>

          {/* BRAND */}
          <Box textAlign="center" mb={2}>
  <Box
    component="img"
    src="/logo.png"
    alt="DrishtiMeet logo"
    sx={{
      height: 48,          // 👈 perfect auth-page size
      mb: 1,
    }}
  />

  <Typography
    variant="h5"
    fontWeight={700}
    sx={{ color: "#2563eb", letterSpacing: "0.3px" }}
  >
    DrishtiMeet
  </Typography>

  <Typography
    variant="body2"
    color="text.secondary"
    sx={{ mt: 0.5 }}
  >
    Secure video meetings
  </Typography>
</Box>


          {/* TOGGLE */}
          <Box display="flex" gap={1}>
            <Button
              fullWidth
              variant={formState === 0 ? "contained" : "outlined"}
              onClick={() => setFormState(0)}
            >
              Sign In
            </Button>
            <Button
              fullWidth
              variant={formState === 1 ? "contained" : "outlined"}
              onClick={() => setFormState(1)}
            >
              Sign Up
            </Button>
          </Box>

          {/* FORM */}
          {formState === 1 && (
            <TextField
              label="Full Name"
              fullWidth
              onChange={(e) => setName(e.target.value)}
            />
          )}

          <TextField
            label="Username"
            fullWidth
            onChange={(e) => setUsername(e.target.value)}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            fullWidth
            size="large"
            variant="contained"
            onClick={handleAuth}
            disabled={!username || !password || (formState === 1 && !name)}
          >
            {formState === 0 ? "Sign In" : "Create Account"}
          </Button>
        </Card>

        <Snackbar
          open={open}
          autoHideDuration={4000}
          onClose={() => setOpen(false)}
          message={message}
        />
      </Stack>
    </>
  );
}
