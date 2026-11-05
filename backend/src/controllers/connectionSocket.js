import { Server } from "socket.io";
import { YSocketIO } from "y-socket.io/dist/server";
import { verifyToken } from "../middleware/auth.js";

const connections = {};   // room -> [socketIds]
const messages = {};      // room -> [chat messages]
const screenSharers = {}; // room -> socketId sharing
const socketRoom = {};    // socketId -> room

const MAX_MESSAGES_PER_ROOM = 200;
const MAX_MESSAGE_LENGTH = 2000;

export const connectToSocket = (server, allowedOrigins) => {
  const io = new Server(server, {
    cors: { origin: allowedOrigins, methods: ["GET", "POST"], credentials: true },
  });

  io.use((socket, next) => {
    const payload = verifyToken(socket.handshake.auth?.token);
    if (!payload) return next(new Error("unauthorized"));
    socket.data.user = payload;
    next();
  });

  const ysocketIO = new YSocketIO(io, {
    authenticate: (handshake) => !!verifyToken(handshake.auth?.token),
  });
  ysocketIO.initialize();

  const leaveRoom = (socket) => {
    const room = socketRoom[socket.id];
    if (!room) return;

    if (screenSharers[room] === socket.id) {
      delete screenSharers[room];
      (connections[room] || []).forEach((id) => {
        if (id !== socket.id) io.to(id).emit("screen-share-stopped");
      });
    }

    const remaining = (connections[room] || []).filter((id) => id !== socket.id);
    remaining.forEach((id) => io.to(id).emit("user-left", socket.id));

    if (remaining.length === 0) {
      delete connections[room];
      delete messages[room];
      delete screenSharers[room];
    } else {
      connections[room] = remaining;
    }
    delete socketRoom[socket.id];
  };

  io.on("connection", (socket) => {
    socket.on("join-call", (path) => {
      if (typeof path !== "string" || !path || path.length > 200) return;
      if (socketRoom[socket.id]) return;

      if (!connections[path]) connections[path] = [];
      connections[path].push(socket.id);
      socketRoom[socket.id] = path;
      console.log("JOIN:", path, "users now:", connections[path]);

      connections[path].forEach((id) => {
        io.to(id).emit("user-joined", socket.id, connections[path]);
      });

      (messages[path] || []).forEach((msg) => {
        io.to(socket.id).emit("chat-message", msg.data, msg.sender, msg["socket-id-sender"]);
      });

      if (screenSharers[path]) {
        io.to(socket.id).emit("screen-share-started", screenSharers[path]);
      }
    });

    socket.on("signal", (toID, message) => {
      const room = socketRoom[socket.id];
      if (!room || socketRoom[toID] !== room) return;
      io.to(toID).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      const room = socketRoom[socket.id];
      if (!room || typeof data !== "string" || !data.trim()) return;

      const text = data.slice(0, MAX_MESSAGE_LENGTH);
      const name = String(sender || socket.data.user?.username || "Guest").slice(0, 50);

      if (!messages[room]) messages[room] = [];
      messages[room].push({ data: text, sender: name, "socket-id-sender": socket.id });
      if (messages[room].length > MAX_MESSAGES_PER_ROOM) messages[room].shift();

      connections[room].forEach((id) => io.to(id).emit("chat-message", text, name, socket.id));
    });

    socket.on("screen-share-started", () => {
      const room = socketRoom[socket.id];
      if (!room) return;
      screenSharers[room] = socket.id;
      connections[room].forEach((id) => io.to(id).emit("screen-share-started", socket.id));
    });

    socket.on("screen-share-stopped", () => {
      const room = socketRoom[socket.id];
      if (!room || screenSharers[room] !== socket.id) return;
      delete screenSharers[room];
      connections[room].forEach((id) => {
        if (id !== socket.id) io.to(id).emit("screen-share-stopped");
      });
    });

    socket.on("disconnect", () => leaveRoom(socket));
  });

  return io;
};