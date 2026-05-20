import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react"; 
import "./Auth.css";

function FacultyLogin({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      const userData = data.user || data;

      // ✅ FIX 1: Allow both faculty and admin roles to authenticate
      if (userData.role !== "faculty" && userData.role !== "admin") {
        setError("This login portal is restricted to faculty and admin accounts");
        setLoading(false);
        return;
      }

      // 1. Sync data to LocalStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(userData));

      // 2. Update parent state defensively
      try {
        await onLogin(userData, data.token);
      } catch (stateErr) {
        console.warn("Parent state synchronization timing mismatch caught cleanly:", stateErr);
      }

      // ✅ FIX 2: Correct redirection target path to match your App route configuration
      navigate("/calendar", { replace: true });

    } catch (err) {
      console.error("Login Error:", err);
      setError("Server connection failed");
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card-header" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <span className="login-back-arrow">←</span> <span>Home</span>
        </div>

        <div className="login-logo-wrapper">
          <img src="/1.png" alt="Logo" className="login-logo" />
        </div>

        {/* ✅ Updated text matching authorized identities */}
        <h1 className="login-title">Faculty & Admin Login</h1>

        {error && (
          <div className="login-error" style={{ 
            color: "#ef4444", 
            background: "#fee2e2", 
            padding: "10px", 
            borderRadius: "5px", 
            marginBottom: "15px",
            fontSize: "14px",
            textAlign: "center"
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">Email Address</label>
          <input
            type="email"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@technonjr.ac.in"
            required
          />

          <label className="login-label">Password</label>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type={showPassword ? "text" : "password"}
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ paddingRight: "45px" }} 
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                padding: "4px"
              }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>

        <div className="login-footer" style={{ marginTop: "20px", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: "#64748b" }}>
            Don't have an account?{" "}
            <button 
              type="button"
              onClick={() => navigate("/faculty-register")}
              style={{
                background: "none",
                border: "none",
                color: "#2563eb",
                fontWeight: "600",
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline"
              }}
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default FacultyLogin;