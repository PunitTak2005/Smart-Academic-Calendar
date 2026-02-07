// src/index.js
// ✅ FULL ESM: Production-Ready Smart Academic Calendar API

import "dotenv/config"; // Load env first

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";

// ✅ ESM Route Imports
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/events.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// 🔧 Core Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// 🩺 Health Check
app.get("/", (req, res) =>
  res.json({
    message: "Smart Academic Calendar API ✅",
    mongodb:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    jwtSecret: process.env.JWT_SECRET ? "LOADED ✅" : "MISSING ❌",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: "/api/auth (POST /register, POST /login, GET /me)",
      users: "/api/users",
      events: "/api/events (GET/POST/PUT/DELETE + filters)",
    },
  })
);

// 🚀 Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);

// 😵 404 Handler (no next, finishes response)
app.use("*", (req, res) =>
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    method: req.method,
  })
);

// 🛡️ Global Error Handler (must be last)
app.use((err, req, res, next) => {
  console.error("Global error:", err.stack || err);

  const status =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(status).json({
    success: false,
    message: err.message || "Something went wrong!",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 🗄️ MongoDB + Server
mongoose
  .connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/academic-calendar"
  )
  .then(() => {
    console.log("✅ MongoDB connected");

    // 🔥 Rebuild indexes after connection
    mongoose.connection.once("connected", async () => {
      console.log("🔄 Rebuilding indexes...");
      try {
        await mongoose.connection.syncIndexes({ strict: false });
        console.log("✅ UNIQUE INDEXES ACTIVE");
      } catch (err) {
        console.error("❌ Index rebuild failed:", err.message);
      }
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server: http://localhost:${PORT}/`);
      console.log(`📋 Health: http://localhost:${PORT}/`);
      console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
      console.log(`👤 Users: http://localhost:${PORT}/api/users`);
      console.log(`📅 Events: http://localhost:${PORT}/api/events`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
