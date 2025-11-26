import express from "express";
import authRoutes from "./routes/auth.route.js";

export const app = express();

// Middleware
app.use(express.json());

app.use("/api/auth", authRoutes)