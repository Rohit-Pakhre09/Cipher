import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";

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

    socket.on("messageDelivered", async ({ messageId, receiverId }) => {
        try {
            const message = await Message.findById(messageId);
            if (message && message.status !== 'read') {
                message.status = 'delivered';
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
            await Message.updateMany(
                { senderId: userToChatId, receiverId: myId, status: { $ne: 'read' } },
                { $set: { status: 'read' } }
            );

            const senderSocketId = userSocketMap[userToChatId];
            if (senderSocketId) {
                io.to(senderSocketId).emit("messagesRead", { readerId: myId });
            }
            const receiverSocketId = userSocketMap[myId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("messagesRead", { readerId: myId });
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
