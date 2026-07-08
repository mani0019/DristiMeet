import React from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function LandingPage() {
  const navigate = useNavigate();

  const generateRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 8);
    navigate(`/${roomId}`);
  };

  return (
    <div className="landingPage">

      {/* NAVBAR */}
      <nav className="landingNav">
        <div className="brand">
          <img src="/logo.png" alt="DristiMeet Logo" />
          <h2>DristiMeet</h2>
        </div>

        <div className="navActions">
          <button
            className="navLink"
            onClick={() => navigate("/auth")}
          >
            Login
          </button>

          <button
            className="navLink"
            onClick={() => navigate("/auth")}
          >
            Register
          </button>

          <button
            className="primaryBtn"
            onClick={generateRoom}
          >
            Launch Workspace →
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="heroSection">

        <div className="heroText">
          <div className="heroBadge">
            REDEFINING DEVELOPER COLLABORATION
          </div>

          <h1>
            One Workspace.
            <br />
            <span className="highlight">
              Infinite Collaboration.
            </span>
          </h1>

          <p>
            Meet, code, share, and build together in real time.
            DristiMeet combines video conferencing, collaborative coding,
            screen sharing, and team communication into a single, cohesive canvas.
          </p>

          <div className="heroButtons">
            <button
              className="primaryBtn largeBtn"
              onClick={() => navigate("/home")}
            >
              Start Collaborating
            </button>

            <button
              className="secondaryBtn"
              onClick={generateRoom}
            >
              Join as Guest
            </button>
          </div>

          <div className="techStack">
            Powered by WebRTC • Monaco Editor • Yjs • Socket.IO
          </div>
        </div>

        {/* WORKSPACE INTERFACE PREVIEW */}
        <div className="workspaceMockup">
          <div className="mockupTopBar">
            <div className="dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="mockupTitle">
              collaborative-session.js
            </div>
          </div>

          <div className="mockupBody">
            <div className="editorArea">
              <pre>
{`function collaborate() {
  const team = ["Manish", "Alex"];

  return team.map(user => ({
    online: true,
    coding: true
  }));
}`}
              </pre>
            </div>

            <div className="chatArea">
              <h4>Team Chat</h4>

              <div className="message">
                <span>Alex</span>
                <p>Let's optimize this runtime state.</p>
              </div>

              <div className="message">
                <span>Manish</span>
                <p>Working on it 🚀</p>
              </div>

              <div className="message">
                <span>Sarah</span>
                <p>CRDT sync engine looks solid.</p>
              </div>
            </div>
          </div>

          <div className="videoStrip">
            <div className="videoCard">
              <div className="avatar">M</div>
              <text>Manish</text>
            </div>

            <div className="videoCard">
              <div className="avatar">A</div>
              <text>Alex</text>
            </div>

            <div className="videoCard">
              <div className="avatar">S</div>
              <text>Sarah</text>
            </div>

            <div className="videoCard">
              <div className="avatar">J</div>
              <text>John</text>
            </div>
          </div>
        </div>

      </section>

      {/* FEATURES SECTION */}
      <section className="featuresSection">
        <h2>Why Teams Choose DristiMeet</h2>
        <p className="sectionSubtext">
          Everything your technical team needs to build together, context-free.
        </p>

        <div className="featuresGrid">
          <div className="featureCard">
            <h3>HD Video Meetings</h3>
            <p>
              Crystal-clear communication and multi-participant spaces powered directly by customized WebRTC routing.
            </p>
          </div>

          <div className="featureCard">
            <h3>Live Collaborative Coding</h3>
            <p>
              Conflict-free writing and synchronization using Yjs and an embedded Monaco Editor canvas.
            </p>
          </div>

          <div className="featureCard">
            <h3>Integrated Team Chat</h3>
            <p>
              Keep technical architectural notes directly alongside your video communication channels.
            </p>
          </div>

          <div className="featureCard">
            <h3>Low-Latency Screen Sharing</h3>
            <p>
              Present complete desktop window viewports instantly during review sessions and pairs debugging steps.
            </p>
          </div>

          <div className="featureCard">
            <h3>Presence Tracking</h3>
            <p>
              Monitor workspace activity states instantly via Socket.IO-driven collaborator synchronization fields.
            </p>
          </div>

          <div className="featureCard">
            <h3>Isolated Workspaces</h3>
            <p>
              Ensure complete room partition security through session access gates and persistent database paths.
            </p>
          </div>
        </div>
      </section>

      {/* TARGET AUDIENCE SECTION */}
      <section className="stepsSection">
        <h2>Built For Builders</h2>

        <div className="stepsGrid">
          <div className="step">
            <span>🧑‍💻</span>
            <h4>Developers</h4>
          </div>

          <div className="step">
            <span>🎓</span>
            <h4>Students</h4>
          </div>

          <div className="step">
            <span>🚀</span>
            <h4>Startup Teams</h4>
          </div>

          <div className="step">
            <span>👨‍🏫</span>
            <h4>Mentors</h4>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="ctaSection">
        <h2>Your Next Project Starts Here.</h2>
        <p>
          Bring context, development execution tools, and crystal clear communication lines into a single workspace wrapper.
        </p>
        <button
          className="primaryBtn largeBtn"
          onClick={() => navigate("/home")}
        >
          Launch Workspace →
        </button>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>
          &copy; {new Date().getFullYear()} DristiMeet. Built for collaboration.
        </p>
      </footer>

    </div>
  );
}