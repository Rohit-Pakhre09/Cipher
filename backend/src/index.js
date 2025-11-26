import express from "express";
import authRoutes from "./routes/auth.route.js";

export const app = express();

app.use("/api/auth", authRoutes)