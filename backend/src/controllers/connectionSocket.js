import { Server } from "socket.io";
import { YSocketIO } from "y-socket.io/dist/server";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });
    const ysocketIO = new YSocketIO(io);
    ysocketIO.initialize();
    io.of("/collab").on("connection", (socket) => {
    console.log("COLLAB namespace connected:", socket.id);
});

    io.on("connection", (socket) => {
        console.log("New socket connected:", socket.id);

        socket.on('join-call', (path) => {
            if (!connections[path]) {
                connections[path] = [];
            }

            connections[path].push(socket.id);
            timeOnline[socket.id] = Date.now();

            // Notify all users in the room
            connections[path].forEach((id) => {
                io.to(id).emit("user-joined", socket.id, connections[path]);
            });

            // Send previous messages to new user
            if (messages[path]) {
                messages[path].forEach((msg) => {
                    io.to(socket.id).emit(
                        "chat-message",
                        msg.data,
                        msg.sender,
                        msg["socket-id-sender"]
                    );
                });
            }
        });

        socket.on("signal", (toID, message) => {
            io.to(toID).emit("signal", socket.id, message);
        });

        socket.on('chat-message', (data, sender) => {
            const [matchingRoom, found] = Object.entries(connections).reduce(
                ([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }
                    return [room, isFound];
                },
                ["", false]
            );

            if (found && matchingRoom) {
                if (!messages[matchingRoom]) {
                    messages[matchingRoom] = [];
                }

                messages[matchingRoom].push({
                    data,
                    sender,
                    "socket-id-sender": socket.id
                });

                connections[matchingRoom].forEach((ele) => {
                    io.to(ele).emit("chat-message", data, sender, socket.id);
                });
            }
        });
       socket.on("screen-share-started", (id) => {
    console.log("SERVER GOT SCREEN SHARE:", id);

    io.emit("screen-share-started", id);
});

    socket.on("screen-share-stopped", () => {
    socket.broadcast.emit("screen-share-stopped");
});

    socket.on("disconnect", () => {
    const diffTime = Math.abs(timeOnline[socket.id] - Date.now());
    let key;

    for (const [k, v] of Object.entries(connections)) {
        if (v.includes(socket.id)) {
            key = k;

            // notify others
            v.forEach(id => {
                io.to(id).emit("user-left", socket.id);
            });

            // remove socket
            connections[k] = v.filter(id => id !== socket.id);

            // cleanup empty room
            if (connections[k].length === 0) {
                delete connections[k];
            }

            break;
        }
    }

    delete timeOnline[socket.id];
});
   

    });

    return io;
};

    