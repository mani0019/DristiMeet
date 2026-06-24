import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContexts.jsx";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VideocamIcon from "@mui/icons-material/Videocam";
import "../styles/history.css"

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const navigate = useNavigate();

 useEffect(() => {
  const fetchHistory = async () => {
    const history = await getHistoryOfUser();
    console.log("HISTORY API:", history);
    setMeetings(history.meetings || []);
  };
  fetchHistory();
}, []);


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Box className="historyPage">

      {/* HEADER */}
      <Box className="historyHeader">
        <IconButton onClick={() => navigate("/home")}>
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h5" fontWeight={700}>
          Meeting History
        </Typography>
      </Box>

      {/* CONTENT */}
      {meetings.length > 0 ? (
        <Box className="historyGrid">
          {meetings.map((meeting, index) => (
            <Card key={index} className="historyCard">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Meeting Code
                </Typography>

                <Typography variant="h6" fontWeight={600}>
                  {meeting.meetingCode}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {formatDate(meeting.date)}
                </Typography>

                <Button
                  startIcon={<VideocamIcon />}
                  variant="contained"
                  size="small"
                  sx={{ mt: 2 }}
                  onClick={() => navigate(`/${meeting.meetingCode}`)}
                >
                  Rejoin
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Box className="emptyState">
          <Typography variant="h6" gutterBottom>
            No meetings yet
          </Typography>
          <Typography color="text.secondary">
            Your past meetings will appear here.
          </Typography>

          <Button
            variant="contained"
            sx={{ mt: 3 }}
            onClick={() => navigate("/home")}
          >
            Start a Meeting
          </Button>
        </Box>
      )}
    </Box>
  );
}
