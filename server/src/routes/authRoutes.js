// src/routes/authRoutes.js
// ✅ MERGED: controller pattern + debug + check-unique + /me (current user)

import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import auth from "../middleware/auth.js";
import { register, login, getMe } from "../controllers/authController.js";

const router = express.Router();

/**
 * POST /api/auth/register
 * Body: { name, email, password, role, phone, rollNumber, ... }
 * Delegates to controller (handles hashing, unique checks, JWT).
 */
router.post("/register", register);

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Delegates to controller for clean separation.
 */
router.post("/login", login);

/**
 * GET /api/auth/me
 * Protected – requires Authorization: Bearer <token>
 * Returns the current logged-in user (sans password), via controller.
 */
router.get("/me", auth, getMe);

/**
 * GET /api/auth/debug-indexes
 * TEMP: Debug MongoDB indexes + sample users. Remove in production.
 */
router.get("/debug-indexes", async (req, res) => {
  try {
    const UserModule = await import("../models/User.js");
    const User = UserModule.default;

    const collection = mongoose.connection.db.collection("users");
    const indexes = await collection.indexes();

    const sampleUsers = await User.find()
      .limit(3)
      .select("name email phone rollNumber role");

    const totalUsers = await User.countDocuments();

    res.json({
      success: true,
      indexes,
      uniqueFields: indexes
        .filter((i) => i.unique)
        .map((i) => Object.keys(i.key)),
      totalUsers,
      sampleUsers,
      message: "Unique constraints status above",
    });
  } catch (err) {
    console.error("/debug-indexes error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/auth/check-unique?field=email&value=test@gmail.com
 * Real-time unique check (case-insensitive) for frontend UX.
 * Fields: name, email, phone, rollNumber.
 */
router.get("/check-unique", async (req, res) => {
  try {
    const { field, value } = req.query;

    if (!field || !value) {
      return res
        .status(400)
        .json({ exists: false, message: "Field and value required" });
    }

    if (!["name", "email", "phone", "rollNumber"].includes(field)) {
      return res
        .status(400)
        .json({ exists: false, message: "Invalid field" });
    }

    const UserModule = await import("../models/User.js");
    const User = UserModule.default;

    // Case-insensitive exact match
    const exists = await User.exists({
      [field]: { $regex: new RegExp(`^${value.trim()}$`, "i") },
    });

    return res.json({
      exists: !!exists,
      message: exists ? `${field} already taken` : "Available",
    });
  } catch (err) {
    console.error("/check-unique error:", err);
    res.status(500).json({ exists: false, message: "Server error" });
  }
});

export default router;
