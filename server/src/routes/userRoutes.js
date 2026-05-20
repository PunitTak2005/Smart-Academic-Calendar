// src/routes/userRoutes.js
// ✅ OPTIMIZED & HARDENED: Profile, Update, and Password modification endpoints
// Mount: app.use("/api/users", userRoutes);

import express from "express";
import auth from "../middleware/auth.js";
import { getMe } from "../controllers/authController.js";
import bcrypt from "bcryptjs"; 
import * as UserModel from "../models/User.js";

const User = UserModel.default || UserModel;
const router = express.Router();

/**
 * @route   GET /api/users/me
 * @desc    Protected route – requires valid JWT
 * @access  Private
 */
router.get("/me", auth, getMe);

/**
 * @route   PUT /api/users/update
 * @desc    Updates user profile details safely without schema leakage or null overrides
 * @access  Private
 */
router.put("/update", auth, async (req, res) => {
  const userId = req.user.id;
  
  // 1. Filter out undefined fields from the request body to avoid database null overwrites
  const updateFields = {};
  const fields = ["name", "email", "phone", "rollNumber", "dept", "year"];
  
  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateFields[field] = req.body[field];
    }
  });

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ message: "No update modifications provided." });
  }

  try {
    // 2. Dynamically build strict unique conflict conditions (ignoring empty or unchanged fields)
    const conflictConditions = [];
    if (updateFields.email) conflictConditions.push({ email: updateFields.email });
    if (updateFields.phone) conflictConditions.push({ phone: updateFields.phone });
    if (updateFields.rollNumber) conflictConditions.push({ rollNumber: updateFields.rollNumber });

    if (conflictConditions.length > 0) {
      const conflictUser = await User.findOne({
        _id: { $ne: userId },
        $or: conflictConditions
      });

      if (conflictUser) {
        if (updateFields.email && conflictUser.email === updateFields.email) {
          return res.status(400).json({ message: "Email is already taken by another user." });
        }
        if (updateFields.phone && conflictUser.phone === updateFields.phone) {
          return res.status(400).json({ message: "Phone number is already taken by another user." });
        }
        if (updateFields.rollNumber && conflictUser.rollNumber === updateFields.rollNumber) {
          return res.status(400).json({ message: "Roll number is already taken by another user." });
        }
      }
    }

    // 3. Update using explicitly parsed data fields
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User profile record not found." });
    }

    res.status(200).json({ message: "Success", user: updatedUser });
  } catch (error) {
    console.error("/update profile error:", error);
    res.status(500).json({ message: error.message || "Server error during profile update" });
  }
});

/**
 * @route   PUT /api/users/change-password
 * @desc    Verifies current password and securely hashes new password updates
 * @access  Private
 */
router.put("/change-password", auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; 

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Please provide both current and new passwords." });
  }

  // Basic length safety guard before hitting cryptographic engines
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters long." });
  }

  try {
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password." });
    }

    // Enforce that new password can't match old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: "New password cannot be identical to your current password." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    await User.updateOne(
      { _id: userId },
      { $set: { password: hashedNewPassword } }
    );

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    console.error("/change-password error:", error);
    res.status(500).json({ message: error.message || "Server error during password update" });
  }
});

export default router;