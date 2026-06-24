import express from 'express';
import {createServer } from 'node:http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import { connectToSocket } from './controllers/connectionSocket.js';
import userRoutes from "./routes/userroutes.js"



const app =express();
const server = createServer(app);
const io=connectToSocket(server);


app.set("port",(process.env.PORT || 8080))
app.use(cors());
app.use(express.json({limit:"40kb"}));
app.use(express.urlencoded({limit:"40kb",extended:true}));


app.use("/api/v1/users",userRoutes);


const start =async()=>{
    const connectionDB = await mongoose.connect(
  "mongodb+srv://mani234tt4_db_user:Lx1nqSUV97LRRD1E@cluster0.ozfrmms.mongodb.net/test"

);
   console.log("mongoDB connection is succesful")

    server.listen(app.get("port"),()=>{
        console.log("listening on this port 8080")
        
    });
}

start();
