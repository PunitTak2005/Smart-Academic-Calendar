import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function Register({ onRegister, switchToLogin, goHome }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [year, setYear] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [dept, setDept] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        year: year.trim(),
        rollNumber: rollNumber.trim(),
        dept: dept.trim(),
        phone: phone.trim(),
        password,
        role: "student",
      };

      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Prefer backend user object; fallback to payload if missing
      const user = data.user || {
        name: payload.name,
        email: payload.email,
        year: payload.year,
        rollNumber: payload.rollNumber,
        dept: payload.dept,
        phone: payload.phone,
        role: payload.role,
      };

      // ✅ Save token + full user for useUserRole / header
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(user));

      // Optional: keep individual keys if other code uses them
      localStorage.setItem("name", user.name);
      localStorage.setItem("email", user.email);
      localStorage.setItem("year", user.year);
      localStorage.setItem("rollNumber", user.rollNumber);
      localStorage.setItem("dept", user.dept);
      localStorage.setItem("phone", user.phone);
      localStorage.setItem("role", user.role);

      setSuccess(true);

      setTimeout(() => {
        onRegister({
          role: user.role,
          name: user.name,
          email: user.email,
          year: user.year,
          rollNumber: user.rollNumber,
          dept: user.dept,
          phone: user.phone,
          token: data.token,
        });

        setName("");
        setEmail("");
        setYear("");
        setRollNumber("");
        setDept("");
        setPhone("");
        setPassword("");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="register-page">
        <div className="register-bg" />
        <div className="register-bg-overlay" />
        <div className="register-card">
          <div
            className="register-card-header"
            onClick={goHome}
            style={{ cursor: "pointer" }}
          >
            <span className="register-back-arrow">←</span>
            <span>Home</span>
          </div>
          <div className="register-logo-wrapper">
            <img src="/1.png" alt="Techno NJR Logo" className="register-logo" />
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "2rem 1rem",
              color: "#10b981",
              fontSize: "1.1rem",
              fontWeight: 500,
            }}
          >
            ✅ Account created successfully!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-bg" />
      <div className="register-bg-overlay" />
      <div className="register-card">
        <div
          className="register-card-header"
          onClick={goHome}
          style={{ cursor: "pointer" }}
          title="Back to Home"
        >
          <span className="register-back-arrow">←</span>
          <span>Home</span>
        </div>

        <div className="register-logo-wrapper">
          <img src="/1.png" alt="Techno NJR Logo" className="register-logo" />
        </div>

        <h1 className="register-title">Student Register</h1>

        {error && (
          <div
            className="error-message"
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

        <form onSubmit={handleSubmit} className="register-form">
          <div>
            <label className="register-label">Full Name</label>
            <div className="register-input-wrapper">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="register-input"
                placeholder="John Doe"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="register-label">Email</label>
            <div className="register-input-wrapper">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="register-input"
                placeholder="student@technonjr.ac.in"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="register-label">Year</label>
            <div className="register-input-wrapper year-select-wrapper">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="register-input year-select"
                required
                disabled={isSubmitting}
              >
                <option value="">Select Year</option>
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year</option>
              </select>
            </div>
          </div>

          <div>
            <label className="register-label">Roll Number</label>
            <div className="register-input-wrapper">
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="register-input"
                placeholder="23ETCCS126"
                maxLength={10}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="register-label">Department</label>
            <div className="register-input-wrapper year-select-wrapper">
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="register-input year-select"
                required
                disabled={isSubmitting}
              >
                <option value="">Select Department</option>
                <option value="CSE">Computer Science (CSE)</option>
                <option value="ECE">Electronics (ECE)</option>
                <option value="Civil">Civil Engineering</option>
                <option value="Mechanical">Mechanical Engineering</option>
                <option value="AI">Artificial Intelligence (AI)</option>
                <option value="EE">Electrical Engineering (EE)</option>
                <option value="Basic Sciences">Basic Sciences</option>
              </select>
            </div>
          </div>

          <div>
            <label className="register-label">Phone Number</label>
            <div className="register-input-wrapper">
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 10) setPhone(value);
                }}
                className="register-input"
                placeholder="9876543210"
                pattern="[0-9]{10}"
                maxLength={10}
                title="10-digit phone number"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="register-label">Password</label>
            <div className="register-input-wrapper relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="register-input pr-10"
                placeholder="•••••••• (min 6 chars)"
                required
                minLength={6}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={togglePasswordVisibility}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
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
                    className="w-5 h-5"
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
            className="register-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="register-footer-text">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="register-footer-link"
            disabled={isSubmitting}
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
