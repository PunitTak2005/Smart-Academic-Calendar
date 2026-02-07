// src/routes/userRoutes.js
// ✅ COMPLETE: Simple profile endpoint for Smart Academic Calendar
// GET /api/users/me → Current user profile (fixes frontend 404)
// Mount: app.use("/api/users", userRoutes);

import express from "express";
import auth from "../middleware/auth.js";
import { getMe } from "../controllers/authController.js";

const router = express.Router();

/**
 * GET /api/users/me
 * Protected route – requires valid JWT in Authorization: Bearer <token>
 * Returns current logged-in user data (excludes password).
 * Reuses shared getMe controller from auth for consistency.
 */
router.get("/me", auth, getMe);

export default router;
