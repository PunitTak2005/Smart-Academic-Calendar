import User from "../models/User.js"; 
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Sign tokens using clean stringified IDs to match auth middleware rules
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id.toString(), 
      role: user.role,
      email: user.email 
    },
    process.env.JWT_SECRET || "your_fallback_secret",
    { expiresIn: "1d", algorithm: "HS256" }
  );
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, dept, year, semester, rollNumber, designation } = req.body;

    // 1. Explicit Input Validation (Common fields only)
    if (!name || !email || !password || !phone || !dept) {
      return res.status(400).json({ message: "Required registration fields are missing." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 🛡️ DOMAIN ENFORCEMENT GUARD
    const emailDomain = normalizedEmail.split('@')[1];
    if (emailDomain !== 'technonjr.org') {
      return res.status(400).json({ 
        message: "Access Denied. You must register using your official college email address.",
        errors: { email: "Only @technonjr.org emails are permitted." }
      });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ 
        message: "User already exists with this email",
        errors: { email: "Email already registered" }
      });
    }

    // 3. Create user (Pre-save hook handles bcrypt hashing, Schema handles isApproved defaults)
    const user = await User.create({
      name,
      email: normalizedEmail,
      password, 
      phone,
      role: role || "student", 
      dept,
      semester: semester || undefined,
      year: year || undefined,
      rollNumber: rollNumber || undefined,
      designation: designation || undefined 
    });

    // 4. Handle context response signaling for pending faculty members
    if (user.role === "faculty" && !user.isApproved) {
      return res.status(201).json({
        success: true,
        isPendingApproval: true,
        message: "Registration successful! Your account has been submitted to the administrative approval queue.",
        user: user.toAuthJSON()
      });
    }

    const token = generateToken(user);

    // 5. Send clean payload footprint via toAuthJSON() for instantly active roles (students/admins)
    return res.status(201).json({
      token,
      user: user.toAuthJSON()
    });
  } catch (err) {
    console.error("🔴 REGISTRATION CONTROLLER CRASH:", err);

    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const standardFieldName = field === "rollNumber" ? "rollNumber" : field;
      return res.status(400).json({
        message: `${field} is already in use.`,
        errors: { [standardFieldName]: `${field === 'rollNumber' ? 'Roll number' : field} is already taken.` }
      });
    }

    if (err.name === "ValidationError") {
      const detailedErrors = {};
      Object.keys(err.errors).forEach((key) => {
        detailedErrors[key] = err.errors[key].message;
      });
      return res.status(400).json({
        message: err.message,
        errors: detailedErrors
      });
    }

    return res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required fields." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Explicitly fetch user and force-include password field
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 2. Verify Password
    let isMatch = false;
    if (typeof user.comparePassword === "function") {
      isMatch = await user.comparePassword(password);
    } else {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // =========================================================================
    // 🛡️ ROLE SECURITY GUARD: Check Administrative Approval Queue
    // =========================================================================
    if (user.role === "faculty" && !user.isApproved) {
      return res.status(403).json({
        success: false,
        isPendingApproval: true,
        message: "Your registration request is pending administrative approval. Please try again later or contact your system administrator."
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      token,
      user: user.toAuthJSON()
    });

  } catch (err) {
    console.error("🔴 LOGIN CONTROLLER CRASH:", err);
    return res.status(500).json({ message: "Internal server error during login." });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. Missing authentication context." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found in database." });
    }
    
    // Extra security layer for stale web sessions
    if (user.role === "faculty" && !user.isApproved) {
      return res.status(403).json({ message: "Access denied. Account is pending approval." });
    }

    return res.json(user.toAuthJSON());
  } catch (err) {
    console.error("🔴 GET_ME CONTROLLER CRASH:", err);
    return res.status(500).json({ message: "Internal server error fetching session context." });
  }
};

// PUT /api/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new passwords are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long." });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized." });
    }
    
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let isMatch = false;
    if (typeof user.comparePassword === "function") {
      isMatch = await user.comparePassword(oldPassword);
    } else {
      isMatch = await bcrypt.compare(oldPassword, user.password);
    }

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    user.password = newPassword;
    await user.save();
    
    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("🔴 CHANGE_PASSWORD CONTROLLER CRASH:", err);
    return res.status(500).json({ message: "Internal server error updating password." });
  }
};