import express from "express";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js"
import cookieParser from "cookie-parser";
import cors from "cors";
import { app } from "./lib/socket.js";

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

const allowedOrigins = [
    'https://cipher-web-chat.vercel.app',
    'https://cipher-web-chat.vercel.app/',
    'http://localhost:3000',
];

app.use(cors(
    {
        origin: (origin, callback) => {
            if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    }
));

app.use("/auth", authRoutes);
app.use("/messages", messageRoutes);
