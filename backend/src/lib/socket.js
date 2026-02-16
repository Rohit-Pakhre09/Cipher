import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";

export const app = express();
export const server = http.createServer(app);

const socketCorsOrigins = [
    "https://cipher-web-chat.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
];

if (process.env.CORS_ORIGIN) {
    socketCorsOrigins.push(process.env.CORS_ORIGIN);
}

export const io = new Server(server, {
    cors: {
        origin: socketCorsOrigins,
        credentials: true,
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

    socket.on("messageDelivered", async ({ messageId, receiverId }) => {
        try {
            const message = await Message.findById(messageId);
            if (message && message.status !== "read") {
                message.status = "delivered";
                await message.save();

                const senderSocketId = userSocketMap[message.senderId];
                if (senderSocketId) {
                    io.to(senderSocketId).emit("messageStatusUpdated", message);
                }
                const receiverSocketId = userSocketMap[receiverId];
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("messageStatusUpdated", message);
                }
            }
        } catch (error) {
            console.log("Error in messageDelivered: ", error);
        }
    });

    socket.on("markAsRead", async ({ myId, userToChatId }) => {
        try {
            const messages = await Message.find({ senderId: userToChatId, receiverId: myId, status: { $ne: "read" } });
            for (const message of messages) {
                message.status = "read";
                await message.save();

                const senderSocketId = userSocketMap[message.senderId];
                if (senderSocketId) {
                    io.to(senderSocketId).emit("messageStatusUpdated", message);
                }

                const receiverSocketId = userSocketMap[myId];
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("messageStatusUpdated", message);
                }
            }
        } catch (error) {
            console.log("Error in markAsRead: ", error);
        }
    });

    socket.on("typing", (data) => {
        const receiverSocketId = userSocketMap[data.receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("typing", data);
        }
    });

    socket.on("stopTyping", (data) => {
        const receiverSocketId = userSocketMap[data.receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("stopTyping", data);
        }
    });

    socket.on("disconnect", () => {
        if (socket.userId) {
            delete userSocketMap[socket.userId];
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        }
    });

});

console.log("Socket.IO server initialized");
