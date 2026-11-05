import 'dotenv/config';

import express from 'express';
import { createServer } from 'node:http';
import mongoose from 'mongoose';
import cors from 'cors';
import { connectToSocket } from './controllers/connectionSocket.js';
import userRoutes from "./routes/userroutes.js";
  for (const key of ["MONGO_URI", "JWT_SECRET"]) {
    if (!process.env[key]) {
      console.error(`Missing required environment variable: ${key}`);
      process.exit(1);
    }
  }
  const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",").map((o) => o.trim()).filter(Boolean);

const app = express();
const server = createServer(app);
connectToSocket(server, allowedOrigins);
app.set("port", process.env.PORT || 8080);

app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);

const start = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connection successful");

        server.listen(app.get("port"), () => {
            console.log(`Listening on port ${app.get("port")}`);
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error);
    }
};

start();