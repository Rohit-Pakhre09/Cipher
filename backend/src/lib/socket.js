import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

export const app = express();
export const server = http.createServer(app);

export const io = new Server(server, {
    cors: {
        origin: [process.env.CORS_ORIGIN]
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
            const messages = await Message.find({ senderId: userToChatId, receiverId: myId, status: { $ne: 'read' } });
            for (const message of messages) {
                message.status = 'read';
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

    // Audio call signaling events
    socket.on("call-user", async (data) => {
        try {
            console.log("call-user received from:", data.from, "to:", data.to, "callId:", data.callId);
            const caller = await User.findById(data.from).select('fullName profilePic');
            const receiverSocketId = userSocketMap[data.to];
            console.log("receiverSocketId:", receiverSocketId, "userSocketMap:", Object.keys(userSocketMap));
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("call-user", {
                    from: caller,
                    callId: data.callId,
                    signal: data.signal,
                });
                console.log("call-user emitted to receiver");
            } else {
                console.log("No receiver socket found for user:", data.to);
            }
        } catch (error) {
            console.log("Error in call-user:", error);
        }
    });

    socket.on("call-accepted", (data) => {
        const callerSocketId = userSocketMap[data.to];
        if (callerSocketId) {
            io.to(callerSocketId).emit("call-accepted", {
                callId: data.callId,
                signal: data.signal,
            });
        }
    });

    socket.on("call-rejected", (data) => {
        const callerSocketId = userSocketMap[data.to];
        if (callerSocketId) {
            io.to(callerSocketId).emit("call-rejected", {
                callId: data.callId,
            });
        }
    });

    socket.on("call-ended", (data) => {
        const receiverSocketId = userSocketMap[data.to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("call-ended", {
                callId: data.callId,
            });
        }
    });

    socket.on("ice-candidate", (data) => {
        const receiverSocketId = userSocketMap[data.to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("ice-candidate", {
                callId: data.callId,
                candidate: data.candidate,
            });
        }
    });

    socket.on("call-signal", (data) => {
        const receiverSocketId = userSocketMap[data.to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("call-signal", {
                callId: data.callId,
                signal: data.signal,
            });
        }
    });
});

console.log("Socket.IO server initialized");
