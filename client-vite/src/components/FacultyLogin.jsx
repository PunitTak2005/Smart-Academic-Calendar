import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

      // Support both { user: {...} } and flat { role: "faculty" } responses
      const userData = data.user || data;

      if (userData.role !== "faculty") {
        setError("This login is only for faculty accounts");
        setLoading(false);
        return;
      }

      // 1. Persist to LocalStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", userData.role);
      localStorage.setItem("name", userData.name);

      // 2. Update Global State
      // We await this if it's an async function to prevent race conditions
      await onLogin({
        role: userData.role,
        name: userData.name,
        email: userData.email,
        token: data.token,
      });

      // 3. Redirect
      navigate("/faculty-dashboard", { replace: true });

    } catch (err) {
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
        <h1 className="login-title">Faculty Login</h1>
        {error && <div className="login-error" style={{ color: "#ef4444", background: "#fee2e2", padding: "10px", borderRadius: "5px", marginBottom: "10px" }}>{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">Faculty Email</label>
          <input
            type="email"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="faculty@technonjr.ac.in"
            required
          />
          <label className="login-label">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default FacultyLogin;