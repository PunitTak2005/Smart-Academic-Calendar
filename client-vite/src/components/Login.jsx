// src/components/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function Login({ onLogin, goHome }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

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

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      console.log("LOGIN response", data);

      if (!res.ok) {
        if (data?.message === "User not found") {
          setError("User not found");
        } else if (data?.message === "Invalid credentials") {
          setError("Invalid email or password");
        } else {
          setError(data.message || "Login failed");
        }
        return;
      }

      const token = data.token || data.accessToken;
      const user = data.user || data.data;

      if (!token || !user) {
        setError("Invalid login response from server");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      if (user.name) localStorage.setItem("name", user.name);
      if (user.email) localStorage.setItem("email", user.email);
      if (user.role) localStorage.setItem("role", user.role);

      if (onLogin) {
        onLogin(user, token);
      } else {
        navigate("/my-events", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleHomeClick = () => {
    if (goHome) {
      goHome();
    } else {
      navigate("/");
    }
  };

  const handleRegisterClick = () => {
    navigate("/register");
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-bg-overlay" />

      <div className="login-card">
        <div
          className="login-card-header"
          onClick={handleHomeClick}
          style={{ cursor: "pointer" }}
        >
          <span className="login-back-arrow">←</span>
          <span>Home</span>
        </div>

        <div className="login-logo-wrapper">
          <img
            src="/1.png"
            alt="Techno NJR Logo"
            className="login-logo"
          />
        </div>

        <h1 className="login-title">Student Login</h1>

        {error && (
          <div
            className="login-error"
            style={{
              color: "#ef4444",
              textAlign: "center",
              marginBottom: "1rem",
              fontSize: "0.9rem",
              padding: "0.5rem",
              background: "#fee2e2",
              borderRadius: "0.375rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div>
            <label className="login-label">Email</label>
            <div className="login-input-wrapper">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                placeholder="Your Email ID"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="login-label">Password</label>
            <div className="login-input-wrapper login-password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input login-password-input"
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={togglePasswordVisibility}
                disabled={loading}
              >
                {showPassword ? (
                  <svg
                    className="login-password-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="login-password-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="login-footer-text">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={handleRegisterClick}
            className="login-footer-link"
            disabled={loading}
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
