import React, { useContext, useState } from 'react';
import withAuth from '../utils/withAuth.jsx';
import { useNavigate } from 'react-router-dom';
import "../styles/home.css";
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { AuthContext } from '../contexts/AuthContexts.jsx';

// Premium theme styling parameters for seamless dark canvas input integration
const darkInputStyles = {
  "& .MuiOutlinedInput-root": {
    color: "#f1f5f9",
    borderRadius: "8px",
    backgroundColor: "#12111a",
    "& fieldset": { borderColor: "rgba(255, 255, 255, 0.08)" },
    "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.15)" },
    "&.Mui-focused fieldset": { borderColor: "#6366f1" },
    
    // Forces Chrome/Edge autofill styles to respect the dark theme
    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 100px #12111a inset !important",
      WebkitTextFillColor: "#f1f5f9 !important",
      caretColor: "#f1f5f9",
    },
  },
};

function HomeComponent() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const { addToUserHistory } = useContext(AuthContext);

  const handleJoinVideoCall = async () => {
    if (!meetingCode.trim()) return;
    try {
      await addToUserHistory(meetingCode);
    } catch (err) {
      console.warn("History save failed, continuing anyway");
    }
    // Navigate straight to active workspace viewport channel
    navigate(`/${meetingCode.trim()}`);
  };

  return (
    <div className="homeDashboardWrapper">
      
      {/* PERSISTENT HEADER BAR LAYER */}
      <nav className="navBar">
        <div className="navBrandLeft">
          <img
            src="/logo.png"
            alt="DristiMeet Logo"
            onClick={() => navigate("/")}
            style={{ height: "32px", width: "auto", cursor: "pointer" }}
          />
          <h2>DristiMeet</h2>
        </div>

        <div className="navActionsRight">
          <div className="historyActionWrapper" onClick={() => navigate("/history")}>
            <IconButton sx={{ color: "#94a3b8", "&:hover": { color: "#ffffff" } }}>
              <RestoreIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <span>History</span>
          </div>

          <Button 
            startIcon={<LogoutOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/auth");
            }}
            sx={{
              color: "#94a3b8",
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 500,
              padding: "6px 12px",
              "&:hover": { color: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.05)" }
            }}
          >
            Logout
          </Button>
        </div>
      </nav>

      {/* DASHBOARD ENTRY LAYOUT WRAPPER */}
      <main className="meetContainer">
        <div className="leftPanel">
          <h1 className="heroTitle">
            Meet. Connect.<br />
            <span className="highlightTitle">Collaborate.</span>
          </h1>
          <p className="heroSubtitle">
            Secure, low-latency video spaces integrated with robust real-time editor engines for engineering teams.
          </p>

          <div className="joinBox">
            <TextField
              size="small"
              placeholder="Enter room token or code"
              value={meetingCode}
              onChange={e => setMeetingCode(e.target.value)}
              sx={darkInputStyles}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinVideoCall()}
            />

            <Button
              onClick={handleJoinVideoCall}
              variant="contained"
              disabled={!meetingCode.trim()}
              sx={{
                backgroundColor: "#6366f1",
                color: "#ffffff",
                textTransform: "none",
                fontWeight: 500,
                borderRadius: "8px",
                padding: "8px 20px",
                height: "40px",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.4)",
                "&:hover": {
                  backgroundColor: "#4f46e5",
                  boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)"
                },
                "&.Mui-disabled": {
                  backgroundColor: "rgba(99, 102, 241, 0.15)",
                  color: "rgba(255, 255, 255, 0.25)"
                }
              }}
            >
              Join Workspace
            </Button>
          </div>
        </div>

        <div className="rightPanel">
          <div className="previewImageCard">
            <img src="/logo3.png" alt="Collaborative Canvas Interface Graphic" />
          </div>
        </div>
      </main>

    </div>
  );
}

export default withAuth(HomeComponent);