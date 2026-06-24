# 🎥 DristiMeet

<div align="center">

### Seamless Video Conferencing & Real-Time Collaboration Platform

Built with MERN Stack, WebRTC & Socket.IO


</div>

---

## 🌟 Overview

DristiMeet is a modern video conferencing platform designed to provide seamless virtual communication and collaboration. It enables users to create and join secure meeting rooms, communicate through high-quality audio and video calls, exchange real-time messages, and share screens effortlessly.

Whether it's online classes, team discussions, interviews, or remote collaboration, DristiMeet delivers a smooth and interactive meeting experience.

---

## ✨ Features

### 🎥 Video Conferencing
- High-quality video calls
- Real-time audio communication
- Multiple participants support
- Low-latency peer-to-peer streaming

### 💬 Real-Time Chat
- Instant messaging during meetings
- Fast communication using Socket.IO
- Live message synchronization

### 🖥️ Screen Sharing
- Share entire screen or application window
- Perfect for presentations and collaboration
- Real-time screen broadcasting

### 🔒 Secure Meeting Rooms
- Create private meeting rooms
- Join meetings using room IDs
- Secure communication channels

### 🎛️ Meeting Controls
- Mute / Unmute microphone
- Turn camera On / Off
- Join and leave meetings seamlessly

### 📱 Responsive Design
- Mobile-friendly interface
- Optimized for desktops and tablets
- Clean and intuitive user experience

---

## 🏗️ System Architecture

```text
                ┌───────────────────┐
                │     React.js      │
                │     Frontend      │
                └─────────┬─────────┘
                          │
                    Socket.IO
                          │
                ┌─────────▼─────────┐
                │   Node.js Server  │
                │    Express.js     │
                └─────────┬─────────┘
                          │
          ┌───────────────┼───────────────┐
          │                               │
      WebRTC                         MongoDB
   Media Streams                   User/Room Data
```

---

## 🚀 Tech Stack

### Frontend
- React.js
- Tailwind CSS
- JavaScript
- HTML5
- CSS3

### Backend
- Node.js
- Express.js

### Database
- MongoDB
- Mongoose

### Real-Time Communication
- WebRTC
- Socket.IO

### Development Tools
- Git
- GitHub
- VS Code

---

## 📂 Project Structure

```bash
DristiMeet/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── socket/
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/DristiMeet.git
```

### Navigate to Project

```bash
cd DristiMeet
```

### Install Backend Dependencies

```bash
cd backend
npm install
```

### Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Start Backend

```bash
cd backend
npm run dev
```

### Start Frontend

```bash
cd frontend
npm start
```

---

## 🎯 Use Cases

- Online Meetings
- Remote Team Collaboration
- Virtual Classrooms
- Technical Interviews
- Project Discussions
- Workshops & Webinars

---

## 🔮 Future Enhancements

- Meeting Recording
- AI Meeting Summaries
- Virtual Backgrounds
- File Sharing
- Waiting Rooms
- Authentication & Authorization
- Calendar Integration
- Meeting Analytics

---

## 📸 Screenshots

> Add your application screenshots here

### Home Page
![Home](screenshots/home.png)

### Meeting Room
![Meeting](screenshots/meeting.png)

### Chat Interface
![Chat](screenshots/chat.png)

---

## 👨‍💻 Author

**Manish Kurhe**

B.Tech Artificial Intelligence & Data Science  
MERN Stack Developer | AI Enthusiast | Problem Solver

### Connect With Me

- GitHub: https://github.com/yourusername
- LinkedIn: https://linkedin.com/in/yourprofile

---

## ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub!

---

<div align="center">

### Built with ❤️ using MERN, WebRTC & Socket.IO

</div>
