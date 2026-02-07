// src/middleware/auth.js
// ✅ OPTIMIZED: Production ESM JWT middleware - Virtuals + secure options
// Fixed for your User schema virtuals, enhanced security [web:36][web:42]

import jwt from "jsonwebtoken";
import * as UserModel from "../models/User.js";
const User = UserModel.default || UserModel;

console.log("🔑 AUTH MIDDLEWARE: LOADED ✅");  // No secret leak

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No Bearer token" });
    }

    const token = authHeader.split(" ")[1];
    console.log("🔑 TOKEN:", token.slice(0, 20) + "...");

    // Verify with options (no null/undefined checks needed)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    console.log("✅ DECODED:", { id: decoded.id, role: decoded.role, email: decoded.email });

    const userId = decoded.id || decoded.userId || decoded._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }

    // Fetch with virtuals populated
    const user = await User.findById(userId).select("-password");
    if (!user || !user.isActive) {
      console.log("❌ Inactive/missing:", userId);
      return res.status(401).json({ success: false, message: "User inactive" });
    }

    // Attach full profile incl. virtuals
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      dept: user.dept,
      phone: user.phone,
      year: user.year,
      rollNumber: user.rollNumber,
      isFaculty: user.isFaculty,  // ✅ Virtual from schema
      isStudent: user.isStudent,  // ✅ Virtual
      isActive: user.isActive
    };

    console.log("👤 Attached:", `${req.user.role} ${req.user.name}`);
    next();
  } catch (err) {
    console.error("❌ AUTH ERR:", err.name, err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired - login again" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    res.status(401).json({ success: false, message: "Auth failed" });
  }
};

export default auth;
