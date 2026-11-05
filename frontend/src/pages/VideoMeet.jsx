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
import withAuth from "../utils/withAuth.jsx";
import "../App.css";

const server_url = server;

// Peer connections — outside component so they survive re-renders
var connections = {};

const peerConfigConnections = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// A silent black video track — sent to peers when camera is OFF
function makeBlackVideoTrack({ width = 640, height = 480 } = {}) {
    const canvas = Object.assign(document.createElement("canvas"), { width, height });
    canvas.getContext('2d').fillRect(0, 0, width, height);
    const track = canvas.captureStream().getVideoTracks()[0];
    track.enabled = false;
    return track;
}

// Replace ONLY the video sender on every existing peer connection
function replaceVideoTrackOnAllPeers(newTrack) {
    for (const id in connections) {
        const sender = connections[id].getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
            sender.replaceTrack(newTrack).catch(e => console.warn('[replaceTrack video]', id, e));
        }
    }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
 function VideoMeetComponent() {

    // --- DOM refs ---
    const localVideoref       = useRef(null);   // the <video> showing local feed
    const screenShareVideoRef = useRef(null);   // the big screen-share <video>

    // --- WebRTC / socket refs ---
    const socketRef    = useRef(null);
    const socketIdRef  = useRef(null);

    // --- Stream refs (never stored in state — avoids stale closures) ---
    // cameraStreamRef: the camera+mic MediaStream, kept alive even when cam is "off"
    //                  (we just swap the video track for a black one)
    const cameraStreamRef = useRef(null);
    // screenStreamRef: the getDisplayMedia() stream, null when not sharing
    const screenStreamRef = useRef(null);

    // Mirror of the videos[] state array — readable inside socket callbacks
    const videoRef = useRef([]);

    // --- UI state ---
    const [askForUsername,   setAskForUsername]   = useState(true);
    const [username,         setUsername]         = useState("");
    const [videoAvailable,   setVideoAvailable]   = useState(false);
    const [audioAvailable,   setAudioAvailable]   = useState(false);
    const [screenAvailable,  setScreenAvailable]  = useState(false);
    const [video,            setVideo]            = useState(false);  // camera ON/OFF indicator
    const [audio,            setAudio]            = useState(false);  // mic ON/OFF indicator
    const [isScreenSharing,  setIsScreenSharing]  = useState(false);
    const [sharedScreenUser, setSharedScreenUser] = useState(null);   // socket id of whoever is sharing
    const [videos,           setVideos]           = useState([]);     // remote peer streams
    const [showModal,        setModal]            = useState(true);
    const [messages,         setMessages]         = useState([]);
    const [message,          setMessage]          = useState("");
    const [newMessages,      setNewMessages]      = useState(0);
    const [showEditor,       setShowEditor]       = useState(false);

    // =========================================================================
    // 1. On mount — check permissions & start lobby preview
    // =========================================================================
    useEffect(() => {
        initPermissions();
    }, []);

    const initPermissions = async () => {
        let vOk = false;
        let aOk = false;

        try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            vOk = true;
        } catch { /* camera not available */ }

        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            aOk = true;
        } catch { /* mic not available */ }

        setVideoAvailable(vOk);
        setAudioAvailable(aOk);
        setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

        // Start lobby camera preview (independent of the call stream)
        if (vOk || aOk) {
            try {
                const preview = await navigator.mediaDevices.getUserMedia({ video: vOk, audio: aOk });
                // Store it so startCameraForCall() can reuse / stop it
                cameraStreamRef.current = preview;
                if (localVideoref.current) localVideoref.current.srcObject = preview;
            } catch (e) {
                console.warn('[lobby preview]', e);
            }
        }
    };

    // =========================================================================
    // 2. Join call
    //    IMPORTANT: await camera start BEFORE connecting socket, so the first
    //    addStream() already has real tracks (not black/empty).
    // =========================================================================
    const connect = async () => {
        setAskForUsername(false);
        await startCameraForCall();   // ← awaited: camera ready before signalling
        connectToSocketServer();
    };

    const startCameraForCall = async () => {
        // Stop the lobby preview first to release the device
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach(t => t.stop());
            cameraStreamRef.current = null;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: videoAvailable,
                audio: audioAvailable,
            });
            cameraStreamRef.current = stream;
            setVideo(videoAvailable);
            setAudio(audioAvailable);
            if (localVideoref.current) localVideoref.current.srcObject = stream;
        } catch (e) {
            console.warn('[startCameraForCall]', e);
            // Fallback: silent black stream so addStream() still has something to give peers
            const blackTrack = makeBlackVideoTrack();
            const fallback   = new MediaStream([blackTrack]);
            cameraStreamRef.current = fallback;
            if (localVideoref.current) localVideoref.current.srcObject = fallback;
        }
    };

    // =========================================================================
    // 3. Camera toggle — replaceTrack() ONLY for video, never touches audio
    // =========================================================================
    const handleVideo = async () => {
        if (isScreenSharing) return; // (fix 7) disabled during screen share

        const turningOn = !video;

        if (turningOn) {
            // --- Camera ON ---
            try {
                // Get a fresh camera track
                const camStream  = await navigator.mediaDevices.getUserMedia({ video: true });
                const camTrack   = camStream.getVideoTracks()[0];

                // Splice the new video track into the existing cameraStreamRef
                // (so audio tracks already in it are preserved)
                if (cameraStreamRef.current) {
                    // Remove any existing video tracks from the stored stream
                    cameraStreamRef.current.getVideoTracks().forEach(t => {
                        t.stop();
                        cameraStreamRef.current.removeTrack(t);
                    });
                    cameraStreamRef.current.addTrack(camTrack);
                } else {
                    cameraStreamRef.current = camStream;
                }

                // Update local preview
                if (localVideoref.current) localVideoref.current.srcObject = cameraStreamRef.current;

                // Tell all peers about the new video track — audio untouched
                replaceVideoTrackOnAllPeers(camTrack);

                setVideo(true);
            } catch (e) {
                console.warn('[handleVideo ON]', e);
            }
        } else {
            // --- Camera OFF ---
            // Stop the real camera video track
            if (cameraStreamRef.current) {
                cameraStreamRef.current.getVideoTracks().forEach(t => t.stop());
                // Remove stopped video tracks from the stream
                cameraStreamRef.current.getVideoTracks().forEach(t =>
                    cameraStreamRef.current.removeTrack(t)
                );
            }

            // Replace with a black track so peers see a black box (not frozen frame)
            const blackTrack = makeBlackVideoTrack();
            cameraStreamRef.current?.addTrack(blackTrack);
            replaceVideoTrackOnAllPeers(blackTrack);

            // Show black locally too
            if (localVideoref.current) {
                const blackStream = new MediaStream([blackTrack]);
                localVideoref.current.srcObject = blackStream;
            }

            setVideo(false);
        }
    };

    // =========================================================================
    // 4. Mic toggle — just enable/disable the existing audio track, no replaceTrack
    // =========================================================================
    const handleAudio = () => {
        const turningOn = !audio;
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getAudioTracks().forEach(t => { t.enabled = turningOn; });
        }
        setAudio(turningOn);
    };

    // =========================================================================
    // 5 & 6. Screen share — replaceTrack() for video only, mic unchanged
    // =========================================================================
    const handleScreen = () => {
        if (isScreenSharing) {
            stopScreenShare();
        } else {
            startScreenShare();
        }
    };

    const startScreenShare = async () => {
        if (!navigator.mediaDevices.getDisplayMedia) return;
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false,   // mic is handled separately; don't mix display audio in
            });
            screenStreamRef.current = screenStream;

            const screenVideoTrack = screenStream.getVideoTracks()[0];

            // Show screen in local preview
            if (localVideoref.current) localVideoref.current.srcObject = screenStream;

            // Show in the dedicated big screen-share box right away
            if (screenShareVideoRef.current) {
                screenShareVideoRef.current.srcObject = screenStream;
            }

            // Replace only the video track on all peers — audio (mic) stays
            replaceVideoTrackOnAllPeers(screenVideoTrack);

            setIsScreenSharing(true);
            setSharedScreenUser(socketIdRef.current);
            socketRef.current?.emit("screen-share-started", socketIdRef.current);

            // Fix 6: onended only on the screen track (not camera tracks)
            screenVideoTrack.onended = () => {
                stopScreenShare();
            };
        } catch (e) {
            console.warn('[startScreenShare]', e);
        }
    };

    const stopScreenShare = () => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
        }

        setIsScreenSharing(false);
        setSharedScreenUser(null);
        socketRef.current?.emit("screen-share-stopped");

        // Restore: if camera is ON and we still have a live video track, use it
        const liveCamTrack = cameraStreamRef.current?.getVideoTracks()
            .find(t => t.readyState === 'live');

        if (video && liveCamTrack) {
            if (localVideoref.current) localVideoref.current.srcObject = cameraStreamRef.current;
            replaceVideoTrackOnAllPeers(liveCamTrack);
        } else {
            // Camera was off — send a black track
            const blackTrack = makeBlackVideoTrack();
            const blackStream = new MediaStream([blackTrack]);
            if (localVideoref.current) localVideoref.current.srcObject = blackStream;
            replaceVideoTrackOnAllPeers(blackTrack);
        }
    };

    // =========================================================================
    // 7. Reactively wire the correct stream into the big screen-share box
    //    (handles the remote-viewer side — fix 8)
    // =========================================================================
    useEffect(() => {
        if (!screenShareVideoRef.current) return;

        if (!sharedScreenUser) {
            // Screen sharing stopped — clear the box
            screenShareVideoRef.current.srcObject = null;
            return;
        }

        if (sharedScreenUser === socketIdRef.current) {
            // I'm the sharer — wire my own screen stream (already done in startScreenShare,
            // but re-apply here in case the DOM element was just mounted)
            if (screenStreamRef.current) {
                screenShareVideoRef.current.srcObject = screenStreamRef.current;
            }
        } else {
            // Someone else is sharing — find their remote stream
            const remoteSharer = videoRef.current.find(v => v.socketId === sharedScreenUser);
            if (remoteSharer?.stream) {
                screenShareVideoRef.current.srcObject = remoteSharer.stream;
            }
        }
    }, [sharedScreenUser, videos]);

    // =========================================================================
    // 8. Socket.IO + WebRTC signalling
    //    addStream() called ONCE per peer at creation time.
    //    All changes after that → replaceTrack().
    // =========================================================================
    const connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, {
    auth: { token: localStorage.getItem("token") },
});

socketRef.current.on("connect_error", (err) => {
    if (err.message === "unauthorized") {
        localStorage.removeItem("token");
        window.location.href = "/auth";
    }
});

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('screen-share-started', (id) => {
            console.log('[socket] screen-share-started from', id);
            setSharedScreenUser(id);
        });

        socketRef.current.on('screen-share-stopped', () => {
            console.log('[socket] screen-share-stopped');
            setSharedScreenUser(null);
        });

        socketRef.current.on('chat-message', addMessage);

        socketRef.current.on('connect', () => {
             Object.values(connections).forEach((pc) => { try { pc.close(); } catch {} });
    connections = {};
    videoRef.current = [];
    setVideos([]);

    // Make sure the handlers below are only registered once
    socketRef.current.off('user-left');
    socketRef.current.off('user-joined');
            socketRef.current.emit('join-call', window.location.pathname);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('user-left', (id) => {
                setVideos(prev => prev.filter(v => v.socketId !== id));
                videoRef.current = videoRef.current.filter(v => v.socketId !== id);
                delete connections[id];
            });

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((peerId) => {
                    if (peerId === socketIdRef.current) return;
                    if (connections[peerId]) return; // already wired up

                    const pc = new RTCPeerConnection(peerConfigConnections);
                    connections[peerId] = pc;

                    pc.onicecandidate = (evt) => {
                        if (evt.candidate) {
                            socketRef.current.emit('signal', peerId,
                                JSON.stringify({ ice: evt.candidate }));
                        }
                    };

                    // Store incoming remote stream
                   pc.ontrack = (evt) => {
    const remoteStream = evt.streams[0];
    console.log('[ontrack] from', peerId, evt.track.kind);
    const exists = videoRef.current.find(v => v.socketId === peerId);
    if (exists) {
        setVideos(prev => {
            const updated = prev.map(v =>
                v.socketId === peerId ? { ...v, stream: remoteStream } : v
            );
            videoRef.current = updated;
            return updated;
        });
    } else {
        const entry = { socketId: peerId, stream: remoteStream };
        setVideos(prev => {
            const updated = [...prev, entry];
            videoRef.current = updated;
            return updated;
        });
    }
};
                    // addStream — ONLY here, ONLY once per peer
                    // cameraStreamRef is guaranteed ready because connect() awaited startCameraForCall()
                    const streamToSend = cameraStreamRef.current
    || new MediaStream([makeBlackVideoTrack()]);
streamToSend.getTracks().forEach(track => {
    pc.addTrack(track, streamToSend);
});
                });

                // If I just joined, offer to everyone already in the room
                if (id === socketIdRef.current) {
                    for (const peerId in connections) {
                        if (peerId === socketIdRef.current) continue;
                        connections[peerId].createOffer()
                            .then(desc => connections[peerId].setLocalDescription(desc))
                            .then(() => {
                                socketRef.current.emit('signal', peerId,
                                    JSON.stringify({ sdp: connections[peerId].localDescription }));
                            })
                            .catch(e => console.warn('[offer]', e));
                    }
                }
            });
        });
    };

    const gotMessageFromServer = (fromId, rawMsg) => {
        const signal = JSON.parse(rawMsg);
        if (fromId === socketIdRef.current) return;
        if (!connections[fromId]) return;

        if (signal.sdp) {
            connections[fromId]
                .setRemoteDescription(new RTCSessionDescription(signal.sdp))
                .then(() => {
                    if (signal.sdp.type === 'offer') {
                        return connections[fromId].createAnswer()
                            .then(desc => connections[fromId].setLocalDescription(desc))
                            .then(() => {
                                socketRef.current.emit('signal', fromId,
                                    JSON.stringify({ sdp: connections[fromId].localDescription }));
                            });
                    }
                })
                .catch(e => console.warn('[sdp]', e));
        }

        if (signal.ice) {
            connections[fromId]
                .addIceCandidate(new RTCIceCandidate(signal.ice))
                .catch(e => console.warn('[ice]', e));
        }
    };

    // =========================================================================
    // Misc
    // =========================================================================
    const handleEndCall = () => {
        cameraStreamRef.current?.getTracks().forEach(t => t.stop());
        screenStreamRef.current?.getTracks().forEach(t => t.stop());
        for (const id in connections) { try { connections[id].close(); } catch {} }
        connections = {};
        window.location.href = "/home";
    };

    const addMessage = (data, sender, socketIdSender) => {
        setMessages(prev => [...prev, { sender, data }]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages(prev => prev + 1);
        }
    };

    const sendMessage = () => {
        socketRef.current?.emit('chat-message', message, username);
        setMessage("");
    };

    // =========================================================================
    // Styles
    // =========================================================================
    const overlayStyles = {
        overlay: {
            position: "fixed", inset: 0, background: "#0b0d14", zIndex: 1000,
            display: "flex", flexDirection: "column", padding: 16, gap: 12,
        },
        topBar:    { display: "flex", alignItems: "center", justifyContent: "space-between" },
        title:     { color: "#e5e7eb", fontSize: 16, fontWeight: 600 },
        closeBtn:  {
            background: "#1f2330", color: "#e5e7eb", border: "1px solid #2f3446",
            borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer",
        },
        editorArea: { flex: 1, minHeight: 0 },
        videoStrip: { display: "flex", gap: 10, overflowX: "auto", padding: "4px 0" },
        stripVideo: {
            height: 90, width: 140, borderRadius: 8, background: "#000",
            objectFit: "cover", flexShrink: 0, border: "1px solid #2f3446",
        },
    };

    const darkInputStyles = {
        "& .MuiOutlinedInput-root": {
            color: "#f1f5f9", borderRadius: "8px", backgroundColor: "#12111a",
            "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.15)" },
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

    // =========================================================================
    // Render
    // =========================================================================
    return (
        <div>
            {askForUsername ? (

                /* ── LOBBY ──────────────────────────────────────────────── */
                <div className="homeDashboardWrapper lobbyCenteringWrapper">
                    <div className="lobbyAmbientGlow" />
                    <div className="meetContainer lobbyCardOverride">

                        {/* LEFT — name input */}
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
                                onChange={e => setUsername(e.target.value)}
                                sx={darkInputStyles}
                                onKeyDown={e => e.key === 'Enter' && username.trim() && connect()}
                            />

                            <Button
                                variant="contained"
                                size="large"
                                onClick={connect}
                                disabled={!username.trim()}
                                sx={{
                                    backgroundColor: "#6366f1", color: "#ffffff",
                                    textTransform: "none", fontWeight: 500,
                                    borderRadius: "8px", padding: "12px 24px",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
                                    "&:hover": { backgroundColor: "#4f46e5", boxShadow: "0 0 20px rgba(99,102,241,0.4)" },
                                    "&.Mui-disabled": { backgroundColor: "rgba(99,102,241,0.15)", color: "rgba(255,255,255,0.25)" },
                                }}
                            >
                                Join Workspace →
                            </Button>
                        </div>

                        {/* RIGHT — lobby camera preview */}
                        <div className="rightPanel">
                            <div className="previewImageCard videoPreviewViewport" style={{ position: "relative" }}>
                                <video
                                    ref={localVideoref}
                                    autoPlay muted playsInline
                                    style={{
                                        position: "absolute", top: 0, left: 0,
                                        width: "100%", height: "100%",
                                        objectFit: "cover", zIndex: 2, borderRadius: "inherit",
                                    }}
                                />
                                <img
                                    src="./4165376.jpg"
                                    alt="Camera Stream Standby"
                                    style={{
                                        position: "absolute", top: 0, left: 0,
                                        width: "100%", height: "100%",
                                        objectFit: "cover", zIndex: 1, borderRadius: "inherit",
                                    }}
                                />
                            </div>
                        </div>

                    </div>
                </div>

            ) : (

                /* ── MEETING ROOM ───────────────────────────────────────── */
                <div className={styles.meetVideoContainer}>

                    {/* CHAT */}
                    {showModal && (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <h2>Chat</h2>
                                <div className={styles.chattingDisplay}>
                                    {messages.map((item, i) => (
                                        <div key={i}>
                                            <strong>{item.sender}</strong>
                                            <p>{item.data}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className={styles.chattingArea}>
                                    <TextField
                                        fullWidth size="small"
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                    />
                                    <Button variant="contained" onClick={sendMessage}>Send</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CONTROLS */}
                    <div className={styles.controls}>

                        {/* Camera — disabled while screen sharing (fix 7) */}
                        <IconButton
                            onClick={handleVideo}
                            disabled={isScreenSharing}
                            className={styles.controlBtn}
                        >
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>

                        {/* Mic — fully independent */}
                        <IconButton onClick={handleAudio} className={styles.controlBtn}>
                            {audio ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {/* Screen share */}
                        <IconButton
                            onClick={handleScreen}
                            disabled={!screenAvailable}
                            className={styles.controlBtn}
                        >
                            {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                        </IconButton>

                        {/* Chat badge */}
                        <Badge badgeContent={newMessages} color="error" invisible={newMessages === 0}>
                            <IconButton
                                onClick={() => { setModal(!showModal); setNewMessages(0); }}
                                className={styles.controlBtn}
                            >
                                <ChatIcon />
                            </IconButton>
                        </Badge>

                        {/* End call */}
                        <IconButton onClick={handleEndCall} className={styles.endCallBtn}>
                            <CallEndIcon />
                        </IconButton>

                        {/* Collab editor */}
                        <IconButton onClick={() => setShowEditor(!showEditor)} className={styles.controlBtn}>
                            <CodeIcon />
                        </IconButton>
                    </div>

                    {/* LOCAL SELF VIEW — always shows local feed */}
                    <video
                        className={styles.localVideo}
                        ref={localVideoref}
                        autoPlay muted playsInline
                    />

                    {/* MAIN CONTENT AREA */}
                    <div className={styles.videoLayout}>

                        {/* BIG SCREEN-SHARE STAGE (visible while someone is sharing) */}
                        {sharedScreenUser && (
                            <div className={styles.mainStage}>
                                <video
                                    autoPlay playsInline
                                    muted={sharedScreenUser === socketIdRef.current}
                                    ref={screenShareVideoRef}
                                />
                            </div>
                        )}

                        {/* PARTICIPANT GRID (hidden while screen sharing) */}
                        {!sharedScreenUser && (
                            <div className={styles.conferenceView}>
                                {videos.map(v => (
                                    <div key={v.socketId} className={styles.videoCard}>
                                        <video
                                            autoPlay playsInline
                                            ref={ref => { if (ref && v.stream) ref.srcObject = v.stream; }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* COLLAB EDITOR OVERLAY */}
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

                                {/* Video strip — reads directly from stream refs, never steals localVideoref */}
                                
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
}
export default withAuth(VideoMeetComponent);