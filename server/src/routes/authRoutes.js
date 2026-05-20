// src/routes/authRoutes.js
import express from "express";
import { register, login, getMe, changePassword } from "../controllers/authController.js";
import User from "../models/User.js";

// Import your protected auth middleware wrapper
import auth from "../middleware/auth.js";

const router = express.Router();

// =========================================================================
// 🔓 PUBLIC ROUTING PORTS
// =========================================================================
router.post("/register", register);
router.post("/login", login);


// =========================================================================
// 🔐 PROTECTED ROUTING PORTS (Requires valid Bearer Token Session Context)
// =========================================================================
router.get("/me", auth, getMe); 
router.put("/change-password", auth, changePassword);


// =========================================================================
// 🛡️ ADMINISTRATIVE APPROVAL QUEUE PORTS (Requires Admin Role Elevation)
// =========================================================================

/**
 * @route   GET /api/auth/pending-faculty
 * @desc    Fetches all unapproved faculty registration documents
 * @access  Private (Admin Only)
 */
router.get("/pending-faculty", auth, async (req, res) => {
  try {
    // Role Authorization Guard Check
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access Denied. Administrative privileges required." });
    }

    // Leverages the '.pendingRequests()' schema query helper from your model
    const pendingFaculty = await User.find().pendingRequests();

    return res.status(200).json({
      success: true,
      count: pendingFaculty.length,
      data: pendingFaculty
    });
  } catch (err) {
    console.error("🔴 GET PENDING FACULTY ROUTE ERROR:", err);
    return res.status(500).json({ success: false, message: "Internal server error fetching pending applications." });
  }
});

/**
 * @route   PUT /api/auth/approve-faculty/:id
 * @desc    Process approval queue items via explicit trigger decisions ("approve" | "reject")
 * @access  Private (Admin Only)
 */
router.put("/approve-faculty/:id", auth, async (req, res) => {
  try {
    // Role Authorization Guard Check
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access Denied. Administrative privileges required." });
    }

    const { id } = req.params;
    const { action } = req.body; // Frontend passes: { action: "approve" } or { action: "reject" }

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid payload parameters. action must be 'approve' or 'reject'." });
    }

    const facultyUser = await User.findById(id);
    if (!facultyUser) {
      return res.status(404).json({ success: false, message: "Faculty application record not found." });
    }

    if (facultyUser.role !== "faculty") {
      return res.status(400).json({ success: false, message: "Target document user does not match faculty role criteria." });
    }

    // Decision Core Logic Block 
    if (action === "approve") {
      facultyUser.isApproved = true;
      await facultyUser.save();

      return res.status(200).json({
        success: true,
        message: `Account registration request for ${facultyUser.name} has been approved.`
      });
    }

    if (action === "reject") {
      // Remove the record entirely from the compilation map
      await User.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: `Registration application for ${facultyUser.name} was rejected and dropped from database registers.`
      });
    }

  } catch (err) {
    console.error("🔴 PROCESS FACULTY ROUTE ERROR:", err);
    return res.status(500).json({ success: false, message: "Internal server error applying queue resolution decision." });
  }
});

export default router;