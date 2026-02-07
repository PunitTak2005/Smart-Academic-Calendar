// src/controllers/authController.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

console.log(
  "🔑 AUTH CONTROLLER SECRET:",
  process.env.JWT_SECRET ? "LOADED" : "MISSING"
);

// Helper to sign JWT
function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      dept: user.dept,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    console.log("📥 Register body:", req.body);

    const {
      name,
      email,
      year,
      rollNumber,
      password,
      role = "student",
      dept,
      phone,
      designation,
    } = req.body;

    // 1. Validation
    if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password (min 6 chars) required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim().replace(/\s+/g, "");
    const normalizedRollNumber = rollNumber?.trim()?.toUpperCase();
    const normalizedDept = dept?.trim()?.toUpperCase();
    const normalizedPhone = phone?.trim();

    // 2. Duplicate Checks
    const existingUser = await User.findOne({ 
      $or: [
        { email: normalizedEmail },
        { phone: normalizedPhone },
        ...(normalizedRollNumber ? [{ rollNumber: normalizedRollNumber }] : [])
      ] 
    });

    if (existingUser) {
      let field = "User";
      if (existingUser.email === normalizedEmail) field = "Email";
      else if (existingUser.phone === normalizedPhone) field = "Phone";
      else if (existingUser.rollNumber === normalizedRollNumber) field = "Roll number";
      
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    // 3. Create User 
    // ✅ IMPORTANT: Pass PLAIN password. The User model's pre-save hook will hash it once.
    const userData = {
      name: name.trim(),
      email: normalizedEmail,
      password: password, // Do NOT hash here
      role,
      dept: normalizedDept,
      phone: normalizedPhone,
      year: role === "student" ? year?.trim() : undefined,
      rollNumber: role === "student" ? normalizedRollNumber : undefined,
      designation: role === "faculty" ? designation?.trim() : undefined,
    };

    console.log("👤 Creating user in DB...");
    const user = await User.create(userData);
    console.log("✅ SAVED successfully:", user._id);

    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: user.toAuthJSON(), // Using the method defined in your model
    });
  } catch (error) {
    console.error("🔐 Register ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Use the static method defined in your User model for cleaner logic
    const user = await User.findByCredentials(normalizedEmail, password);

    if (!user) {
      console.log("❌ Login failed: Invalid email or password");
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = signToken(user);
    console.log("✅ Login success:", user.email);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: user.toAuthJSON(),
    });
  } catch (error) {
    console.error("🔐 Login ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      user: user.toAuthJSON(),
    });
  } catch (error) {
    console.error("🔐 getMe ERROR:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export default { register, login, getMe };