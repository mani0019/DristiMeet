import React from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landingPage">

      {/* NAVBAR */}
     <nav className="landingNav">
  <div className="brand">
    <img src="/logo.png" alt="DrishtiMeet logo" />
    <h2>DrishtiMeet</h2>
  </div>

  <div className="navActions">
    <button className="navLink" onClick={() => navigate("/auth")}>
      Login
    </button>
    <button className="navLink" onClick={() => navigate("/auth")}>
      Register
    </button>
    <button className="primaryBtn" onClick={() => navigate("/:qurl")}>
      Join as Guest
    </button>
  </div>
</nav>


      {/* HERO */}
      <section className="heroSection">
        <div className="heroText">
          <h1>
             Seamless Video Meetings with{" "}
            <span className="highlight">DrishtiMeet</span>
          </h1>
          <p>
            Secure, fast and reliable video conferencing for students,
            teams and professionals.
          </p>
          <button
            className="primaryBtn largeBtn"
            onClick={() => navigate("/home")}
          >
            Get Started for Free
          </button>
        </div>

        <div className="heroImage">
          <img src="/landing.png" alt="Video meeting" />
        </div>
      </section>

      {/* FEATURES */}
      <section className="featuresSection">
        <h2>Everything you need for online meetings</h2>

        <div className="featuresGrid">
          <div className="featureCard">
            <h3>HD Video Calls</h3>
            <p>Crystal clear video and audio powered by WebRTC.</p>
          </div>

          <div className="featureCard">
            <h3>Screen Sharing</h3>
            <p>Share your screen instantly with one click.</p>
          </div>

          <div className="featureCard">
            <h3>Live Chat</h3>
            <p>Chat in real-time during meetings.</p>
          </div>

          <div className="featureCard">
            <h3>Secure Meetings</h3>
            <p>Protected routes and token-based authentication.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="stepsSection">
        <h2>How DrishtiMeet Works</h2>

        <div className="stepsGrid">
          <div className="step">
            <span>1</span>
            <p>Create or join a meeting</p>
          </div>
          <div className="step">
            <span>2</span>
            <p>Allow camera & microphone</p>
          </div>
          <div className="step">
            <span>3</span>
            <p>Connect and collaborate</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="ctaSection">
        <h2>Start your first meeting in seconds</h2>
        <p>No downloads. No setup. Just connect.</p>
        <button
          className="primaryBtn largeBtn"
          onClick={() => navigate("/home")}
        >
          Start a Meeting
        </button>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} DrishtiMeet. All rights reserved.</p>
      </footer>

    </div>
  );
}
