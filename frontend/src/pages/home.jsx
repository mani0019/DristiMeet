import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth.jsx'
import { useNavigate } from 'react-router-dom'
import "../styles/home.css";
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from '../contexts/AuthContexts.jsx';

function HomeComponent() {


    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");


    const {addToUserHistory} = useContext(AuthContext);
    let handleJoinVideoCall = async () => {
        try {
    await addToUserHistory(meetingCode);
  } catch (err) {
    console.warn("History save failed, continuing anyway");
  }

  // ✅ ALWAYS JOIN
  navigate(`/${meetingCode}`);
    }

    return (
        <>

            <div className="navBar">

                <div style={{ display: "flex", alignItems: "center" }}>
                    <img
  src="/logo.png"
  alt="Logo"
  style={{
    height: "36px",
    width: "auto",
    cursor: "pointer",
  }}
/>

                    <h2>DrishtiMeet</h2>
                </div>

                <div style={{ display: "flex", alignItems: "center" }}>
                    <IconButton onClick={
                        () => {
                            navigate("/history")
                        }
                    }>
                        <RestoreIcon />
                    </IconButton>
                    <p>History</p>

                    <Button onClick={() => {
                        localStorage.removeItem("token")
                        navigate("/auth")
                    }}>
                        Logout
                    </Button>
                </div>


            </div>

<div className="meetContainer">
  <div className="leftPanel">
    <h1 className="heroTitle">Meet. Connect. Collaborate.</h1>
    <p className="heroSubtitle">
      Secure, fast and simple video meetings for everyone
    </p>

    <div className="joinBox">
      <TextField
        size="small"
        placeholder="Enter meeting code"
        onChange={e => setMeetingCode(e.target.value)}
      />

      <Button
        onClick={handleJoinVideoCall}
        variant="contained"
        className="joinBtn"
        disabled={!meetingCode.trim()}
      >
        Join Meeting
      </Button>
    </div>
  </div>

  <div className="rightPanel">
    <img src="/logo3.png" alt="Video Meeting" />
  </div>
</div>

        </>
    )
}


export default withAuth(HomeComponent)