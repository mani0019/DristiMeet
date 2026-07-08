import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import server from '../enviroment.js'
import CodeIcon from '@mui/icons-material/Code';
import CollabEditor from "./CollabEditor.jsx";
import "../App.css";


const server_url = server;

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();
     
    let localVideoref = useRef();
    let [showEditor, setShowEditor] = useState(false);

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState([]);

    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState(false);

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(3);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([])
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [sharedScreenUser, setSharedScreenUser] = useState(null);
    let [videos, setVideos] = useState([])

    // TODO
    // if(isChrome() === false) {


    // }

    useEffect(() => {
        getPermissions();

    },[])

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    }

    const getPermissions = async () => {
    try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setVideoAvailable(true);
        console.log('Video permission granted');
    } catch (error) {
        setVideoAvailable(false);
        console.log('Video permission denied', error);
    }

    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioAvailable(true);
        console.log('Audio permission granted');
    } catch (error) {
        setAudioAvailable(false);
        console.log('Audio permission denied', error);
    }

    // This now always runs regardless of camera/mic permission outcome
    if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
    } else {
        setScreenAvailable(false);
    }

    try {
        if (videoAvailable || audioAvailable) {
            const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
            window.localStream = userMediaStream;
            if (localVideoref.current) {
                localVideoref.current.srcObject = userMediaStream;
            }
        }
    } catch (error) {
        console.log(error);
    }
};

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
            console.log("SET STATE HAS ", video, audio);

        }


    }, [video, audio])
    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();

    }




    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                console.log(description)
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setSharedScreenUser(null);

socketRef.current.emit("screen-share-stopped");
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            for (let id in connections) {
                connections[id].addStream(window.localStream)

                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    }





    let getDislayMediaSuccess = (stream) => {
        console.log("EMITTING SCREEN SHARE");
        setSharedScreenUser(socketIdRef.current);

socketRef.current.emit(
    "screen-share-started",
    socketIdRef.current
);
        console.log("HERE")
        setIsScreenSharing(true);
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)
            setIsScreenSharing(false);
            setSharedScreenUser(null);                      // ✅ add this
    socketRef.current.emit("screen-share-stopped"); 

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            getUserMedia()

        })
    }

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }




    let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false })

    socketRef.current.on('signal', gotMessageFromServer);

    socketRef.current.on("screen-share-started", (id) => {
        console.log("RECEIVED SCREEN SHARE EVENT:", id);
        setSharedScreenUser(id);
    });

    socketRef.current.on("screen-share-stopped", () => {
        console.log("SCREEN SHARE STOPPED");
        setSharedScreenUser(null);
    });

    socketRef.current.on('chat-message', addMessage);

    socketRef.current.on('connect', () => {
        socketRef.current.emit('join-call', window.location.href)
        socketIdRef.current = socketRef.current.id

        socketRef.current.on('user-left', (id) => {
            setVideos((videos) => videos.filter((video) => video.socketId !== id))
        })

        socketRef.current.on('user-joined', (id, clients) => {
            clients.forEach((socketListId) => {
                console.log("MY ID:", socketIdRef.current);
                console.log("CLIENT ID:", socketListId);

                if (socketListId === socketIdRef.current) {
                    console.log("SKIPPING MYSELF");
                    return;
                }

                connections[socketListId] = new RTCPeerConnection(peerConfigConnections)

                connections[socketListId].onicecandidate = function (event) {
                    if (event.candidate != null) {
                        socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                    }
                }

                connections[socketListId].onaddstream = (event) => {
                    console.log("TRACK LABEL:", event.stream.getVideoTracks()[0]?.label);
                    console.log("BEFORE:", videoRef.current);
                    console.log("FINDING ID: ", socketListId);

                    let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                    if (videoExists) {
                        console.log("FOUND EXISTING");

                        setVideos(videos => {
                            const updatedVideos = videos.map(video =>
                                video.socketId === socketListId ? { ...video, stream: event.stream } : video
                            );
                            videoRef.current = updatedVideos;
                            return updatedVideos;
                        });
                    } else {
                        console.log("CREATING NEW");
                        let newVideo = {
                            socketId: socketListId,
                            stream: event.stream,
                            autoplay: true,
                            playsinline: true
                        };

                        setVideos(videos => {
                            const updatedVideos = [...videos, newVideo];
                            videoRef.current = updatedVideos;
                            return updatedVideos;
                        });
                    }
                };

                if (window.localStream !== undefined && window.localStream !== null) {
                    connections[socketListId].addStream(window.localStream)
                } else {
                    let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                    window.localStream = blackSilence()
                    connections[socketListId].addStream(window.localStream)
                }
            })

            if (id === socketIdRef.current) {
                for (let id2 in connections) {
                    if (id2 === socketIdRef.current) continue

                    try {
                        connections[id2].addStream(window.localStream)
                    } catch (e) { }

                    connections[id2].createOffer().then((description) => {
                        connections[id2].setLocalDescription(description)
                            .then(() => {
                                socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                            })
                            .catch(e => console.log(e))
                    })
                }
            }
        })
    })
}

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let handleVideo = () => {
        setVideo(!video);
        // getUserMedia();
    }
    let handleAudio = () => {
        setAudio(!audio)
        // getUserMedia();
    }

    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen])
    let handleScreen = () => {
        setScreen(!screen);
    }

    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }
        window.location.href = "/home"
    }

    let openChat = () => {
        setModal(true);
        setNewMessages(0);
    }
    let closeChat = () => {
        setModal(false);
    }
    let handleMessage = (e) => {
        setMessage(e.target.value);
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };



    let sendMessage = () => {
        console.log(socketRef.current);
        socketRef.current.emit('chat-message', message, username)
        setMessage("");

        // this.setState({ message: "", sender: username })
    }

    
    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }
    const sharedVideo = videos.find(
  video => video.socketId === sharedScreenUser
);
console.log(
  "VIDEOS ARRAY",
  videos.map(v => v.socketId)
);
console.log("sharedScreenUser =", sharedScreenUser);
console.log("sharedVideo =", sharedVideo);
const overlayStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "#0b0d14",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    padding: 16,
    gap: 12,
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: "#e5e7eb", fontSize: 16, fontWeight: 600 },
  closeBtn: {
    background: "#1f2330",
    color: "#e5e7eb",
    border: "1px solid #2f3446",
    borderRadius: 8,
    padding: "6px 14px",
    fontSize: 13,
    cursor: "pointer",
  },
  editorArea: { flex: 1, minHeight: 0 },
  videoStrip: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    padding: "4px 0",
  },
  stripVideo: {
    height: 90,
    width: 140,
    borderRadius: 8,
    background: "#000",
    objectFit: "cover",
    flexShrink: 0,
    border: "1px solid #2f3446",
  },
};
const darkInputStyles = {
  "& .MuiOutlinedInput-root": {
    color: "#f1f5f9",
    borderRadius: "8px",
    backgroundColor: "#12111a",
    "& fieldset": { borderColor: "rgba(255, 255, 255, 0.08)" },
    "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.15)" },
    "&.Mui-focused fieldset": { borderColor: "#6366f1" },
    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 100px #12111a inset !important",
      WebkitTextFillColor: "#f1f5f9 !important",
      caretColor: "#f1f5f9",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#94a3b8",
    "&.Mui-focused": { color: "#6366f1" },
  },
};

return (
  <div>
    {askForUsername ? (
    <div className="homeDashboardWrapper lobbyCenteringWrapper">
      
      {/* Visual Ambient Background Glow Element */}
      <div className="lobbyAmbientGlow" />

      {/* Structured Card Grid Component Canvas */}
      <div className="meetContainer lobbyCardOverride">
        
        {/* LEFT TEXT PANEL CONTENT ENTRY FORM */}
        <div className="leftPanel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h1 className="heroTitle" style={{ fontSize: "40px", marginBottom: "0px" }}>
            Ready to <span className="highlightTitle">join?</span>
          </h1>

          <p className="heroSubtitle" style={{ marginBottom: "12px" }}>
            Enter your display moniker and verify your stream settings before entering the collaborative workspace.
          </p>

          <TextField
            label="Your name"
            variant="outlined"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={darkInputStyles}
            onKeyDown={(e) => e.key === 'Enter' && username.trim() && connect()}
          />

          <Button
            variant="contained"
            size="large"
            onClick={connect}
            disabled={!username.trim()}
            sx={{
              backgroundColor: "#6366f1",
              color: "#ffffff",
              textTransform: "none",
              fontWeight: 500,
              borderRadius: "8px",
              padding: "12px 24px",
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
            Join Workspace →
          </Button>
        </div>

        {/* RIGHT MEDIA OVERLAY FEED PANEL */}
        {/* RIGHT MEDIA OVERLAY FEED PANEL */}
<div className="rightPanel">
  <div className="previewImageCard videoPreviewViewport" style={{ position: "relative" }}>
    
    {/* Live Webcam Stream Element */}
    <video
      ref={localVideoref}
      autoPlay
      muted
      playsInline
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        zIndex: 2, /* Sits on top once media stream starts */
        borderRadius: "inherit"
      }}
    />

    {/* The New Generated Placeholder Image (Sits underneath as fallback) */}
    <img 
      src="./4165376.jpg" 
      alt="Camera Stream Standby" 
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        zIndex: 1, /* Displays underneath the video tag */
        borderRadius: "inherit"
      }}
    />

  </div>
</div>

      </div>
    </div>
  ) : (
      <div className={styles.meetVideoContainer}>

        {/* CHAT */}
        {showModal && (
          <div className={styles.chatRoom}>
            <div className={styles.chatContainer}>
              <h2>Chat</h2>

              <div className={styles.chattingDisplay}>
                {messages.map((item, index) => (
                  <div key={index}>
                    <strong>{item.sender}</strong>
                    <p>{item.data}</p>
                  </div>
                ))}
              </div>

              <div className={styles.chattingArea}>
                <TextField
                  fullWidth
                  size="small"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />

                <Button
                  variant="contained"
                  onClick={sendMessage}
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* CONTROLS */}
        <div className={styles.controls}>
          <IconButton
            onClick={handleVideo}
            className={styles.controlBtn}
          >
            {video ? (
              <VideocamIcon />
            ) : (
              <VideocamOffIcon />
            )}
          </IconButton>

          <IconButton
            onClick={handleAudio}
            className={styles.controlBtn}
          >
            {audio ? (
              <MicIcon />
            ) : (
              <MicOffIcon />
            )}
          </IconButton>

          <IconButton
            onClick={handleScreen}
            disabled={!screenAvailable}
            className={styles.controlBtn}
          >
            {screen ? (
              <StopScreenShareIcon />
            ) : (
              <ScreenShareIcon />
            )}
          </IconButton>

          <Badge
            badgeContent={newMessages}
            color="error"
            invisible={newMessages === 0}
          >
            <IconButton
              onClick={() => setModal(!showModal)}
              className={styles.controlBtn}
            >
              <ChatIcon />
            </IconButton>
          </Badge>

          <IconButton
            onClick={handleEndCall}
            className={styles.endCallBtn}
          >
            <CallEndIcon />
          </IconButton>
          <IconButton onClick={() => setShowEditor(!showEditor)} className={styles.controlBtn}>
  <CodeIcon />
</IconButton>
        </div>

        {/* LOCAL SELF VIEW */}
        <video
          className={styles.localVideo}
          ref={localVideoref}
          autoPlay
          muted
          playsInline
        />

        {/* MAIN CONTENT */}
        <div className={styles.videoLayout}>

          {/* BIG SCREEN SHARE */}
         {sharedScreenUser && (
  <div className={styles.mainStage}>
    <video
      autoPlay
      muted={sharedScreenUser === socketIdRef.current}
      playsInline
      ref={(ref) => {
        if (!ref) return;

        if (sharedScreenUser === socketIdRef.current) {
          // I'm the one sharing — show my own outgoing screen stream
          if (localVideoref.current?.srcObject) {
            ref.srcObject = localVideoref.current.srcObject;
          }
        } else {
          // Someone else is sharing — show their incoming stream
          if (sharedVideo?.stream) {
            ref.srcObject = sharedVideo.stream;
          }
        }
      }}
    />
  </div>
)}

          {/* PARTICIPANTS */}
          {!sharedScreenUser && (
          <div className={styles.conferenceView}>
            {videos.map((video) => (
              <div
                key={video.socketId}
                className={styles.videoCard}
              >
                <video
                  autoPlay
                  playsInline
                  ref={(ref) => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                />
              </div>
            ))}
          </div>
          )}
          {showEditor && (
  <div style={overlayStyles.overlay}>
    <div style={overlayStyles.topBar}>
      <span style={overlayStyles.title}>Code Editor</span>
      <button onClick={() => setShowEditor(false)} style={overlayStyles.closeBtn}>
        ✕ Close
      </button>
    </div>

    <div style={overlayStyles.editorArea}>
      <CollabEditor
        roomId={window.location.pathname.split('/').filter(Boolean).pop() || 'default-room'}
        username={username}
        serverUrl={server_url}
      />
    </div>

    <div style={overlayStyles.videoStrip}>
      <video ref={localVideoref} autoPlay muted playsInline style={overlayStyles.stripVideo} />
      {videos.map((video) => (
        <video
          key={video.socketId}
          autoPlay
          playsInline
          style={overlayStyles.stripVideo}
          ref={(ref) => { if (ref && video.stream) ref.srcObject = video.stream; }}
        />
      ))}
    </div>
  </div>
)}
        </div>
      </div>
    )}
  </div>
);
}