import express from "express";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js"
import cookieParser from "cookie-parser";
import cors from "cors";
import { app } from "./lib/socket.js";

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    }
));

app.use("/auth", authRoutes);
app.use("/messages", messageRoutes);
