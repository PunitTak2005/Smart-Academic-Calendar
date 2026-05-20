// src/middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

console.log("🔑 AUTH MIDDLEWARE: LOADED ✅");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No Bearer token" });
    }

    const token = authHeader.split(" ")[1];
    console.log("🔑 TOKEN:", token.slice(0, 20) + "...");

    // Verify token using designated algorithm
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    console.log("✅ DECODED:", { id: decoded.id, role: decoded.role, email: decoded.email });

    const userId = decoded.id || decoded.userId || decoded._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }

    // Fetch user profile from database
    const user = await User.findById(userId);
    
    // Safety check matching your User schema defaults
    if (!user || !user.isActive) {
      console.log("❌ Inactive or missing user:", userId);
      return res.status(401).json({ success: false, message: "User inactive or not found" });
    }

    // =========================================================================
    // 🛡️ SECURITY INTERCEPT: Block Unapproved Faculty Web Requests
    // =========================================================================
    if (user.role === "faculty" && !user.isApproved) {
      console.log(`❌ Intercepted Unapproved Faculty Access Attempt: ${user.name} (${userId})`);
      return res.status(403).json({ 
        success: false, 
        isPendingApproval: true,
        message: "Access denied. Your faculty account is awaiting administrative verification." 
      });
    }

    const isAdmin = user.role === "admin";

    // ✅ CLEANER MAPPING: Spread your schema's built-in instance method, then handle admin privileges
    req.user = {
      ...user.toAuthJSON(),
      isFaculty: isAdmin ? true : user.isFaculty,  // Uses schema virtual with admin override
      isStudent: isAdmin ? false : user.isStudent  // Uses schema virtual with admin override
    };

    console.log(`👤 Attached: ${req.user.role} ${req.user.name} (Faculty Privileges: ${req.user.isFaculty})`);
    next();
  } catch (err) {
    console.error("❌ AUTH ERR:", err.name, err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired - login again" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    return res.status(401).json({ success: false, message: "Auth failed" });
  }
};

export default auth;