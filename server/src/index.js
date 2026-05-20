// ✅ FULL ESM: Production-Ready Smart Academic Calendar API

import "dotenv/config"; // Load env first

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";

// ✅ Explicitly import models to register schemas into Mongoose registry before booting
import "./models/User.js"; 

// ✅ ESM Route Imports
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/events.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// 🔧 Core Middleware
// Configured dynamic fallback array to seamlessly connect local instances and live production URLs
const allowedOrigins = [
  "http://localhost:3000", 
  "http://localhost:5173"
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, "")); // Strip trailing slash if present
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// 🩺 Health Check
app.get("/", (req, res) =>
  res.json({
    message: "Smart Academic Calendar API ✅",
    mongodb: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
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

  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(status).json({
    success: false,
    message: err.message || "Something went wrong!",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 🗄️ MongoDB + Server Entry Setup
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/academic-calendar")
  .then(async () => {
    console.log("✅ MongoDB connected successfully");

    // 🔥 Index synchronization now runs safely because the schema is guaranteed to be registered
    console.log("🔄 Rebuilding indexes...");
    try {
      if (mongoose.modelNames().includes("User")) {
        await mongoose.model("User").syncIndexes({ strict: false });
        console.log("bold", "✅ UNIQUE INDEXES ACTIVE");
      } else {
        console.warn("⚠️ User model was not found in registry during index pass.");
      }
    } catch (err) {
      console.error("⚠️ Index rebuild warning:", err.message);
    }

    // Start Express Application Listener
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });