import { Server } from "socket.io";
import http from "http";
import express from "express";

export const app = express(); 
export const server = http.createServer(app);

export const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"]
    }
});

export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
};

const userSocketMap = {
    
};

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
        socket.userId = userId; 
        userSocketMap[userId] = socket.id;
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        if (socket.userId) { 
            delete userSocketMap[socket.userId];
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        }
    });
});

console.log("Socket.IO server initialized");
