import express from "express";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js"
import cookieParser from "cookie-parser";
import cors from "cors";

export const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors(
    {
        origin: "http://localhost:5173",
        credentials: true,
    }
));

app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);