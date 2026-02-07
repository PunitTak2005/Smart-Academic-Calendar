import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function FacultyRegister({ onRegister, switchToLogin, goHome }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dept: "",
    phone: "",
    password: "",
    designation: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});  // Per-field errors
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const depts = ["CSE", "ECE", "Civil", "Mechanical", "AI", "EE", "Basic Sciences"];

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const clearFieldError = (field) => {
    setFieldErrors(prev => ({ ...prev, [field]: "" }));
    setSubmitError("");
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Faculty email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.dept) newErrors.dept = "Department is required";
    if (!formData.phone || !/^\d{10}$/.test(formData.phone)) newErrors.phone = "Phone must be exactly 10 digits";
    if (!formData.designation.trim()) newErrors.designation = "Designation is required";
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";

    setFieldErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      setSubmitError("Please fix errors in the form");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          dept: formData.dept.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          designation: formData.designation.trim() || "Faculty Member",
          role: "faculty",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle backend validation errors (duplicates, etc.)
        if (data.errors && typeof data.errors === 'object') {
          const backendErrors = {};
          Object.entries(data.errors).forEach(([field, msgs]) => {
            backendErrors[field] = Array.isArray(msgs) ? msgs[0].message || msgs[0] : msgs;
          });
          setFieldErrors(backendErrors);
          setSubmitError(`Field error: ${Object.values(backendErrors)[0]}`);
        } else {
          setSubmitError(data.message || "Registration failed");
        }
        return;
      }

      // Success
      const user = data.user || { 
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        dept: formData.dept.trim(),
        phone: formData.phone.trim(),
        designation: formData.designation.trim() || "Faculty Member",
        role: "faculty" 
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("name", user.name);
      localStorage.setItem("email", user.email);
      localStorage.setItem("dept", user.dept);
      localStorage.setItem("phone", user.phone);
      localStorage.setItem("designation", user.designation);
      localStorage.setItem("role", user.role);

      onRegister({
        role: user.role,
        name: user.name,
        email: user.email,
        dept: user.dept,
        phone: user.phone,
        designation: user.designation,
        token: data.token,
      });
      
    } catch (err) {
      setSubmitError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setFormData(prev => ({ ...prev, phone: value }));
      clearFieldError("phone");
    }
  };

  const getInputClass = (field) => {
    return `register-input ${fieldErrors[field] ? "input-error" : ""}`;
  };

  const getSelectClass = (field) => {
    return `register-input year-select ${fieldErrors[field] ? "input-error" : ""}`;
  };

  return (
    <div className="register-page">
      <div className="register-bg" />
      <div className="register-bg-overlay" />
      <div className="register-card">
        <div className="register-card-header" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <span className="register-back-arrow">←</span>
          <span>Home</span>
        </div>

        <div className="register-logo-wrapper">
          <img src="/1.png" alt="Techno NJR Logo" className="register-logo" />
        </div>

        <h1 className="register-title">Faculty Register</h1>

        {submitError && (
          <div
            className="error-message submit-error"
            style={{ 
              color: "#ef4444", 
              textAlign: "center", 
              marginBottom: "1rem",
              fontSize: "0.9rem",
              padding: "0.75rem",
              background: "#fee2e2",
              borderRadius: "0.5rem",
              borderLeft: "4px solid #ef4444",
            }}
          >
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div>
            <label className="register-label">Full Name <span style={{color: '#ef4444'}}>*</span></label>
            <div className="register-input-wrapper">
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={getInputClass("name")}
                placeholder="Prof. John Doe"
                required
                disabled={loading}
              />
            </div>
            {fieldErrors.name && (
              <span className="field-error">{fieldErrors.name}</span>
            )}
          </div>

          <div>
            <label className="register-label">Faculty Email <span style={{color: '#ef4444'}}>*</span></label>
            <div className="register-input-wrapper">
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={getInputClass("email")}
                placeholder="faculty@technonjr.ac.in"
                required
                disabled={loading}
              />
            </div>
            {fieldErrors.email && (
              <span className="field-error">{fieldErrors.email}</span>
            )}
          </div>

          <div>
            <label className="register-label">Department <span style={{color: '#ef4444'}}>*</span></label>
            <div className="register-input-wrapper year-select-wrapper">
              <select
                name="dept"
                value={formData.dept}
                onChange={handleChange}
                className={getSelectClass("dept")}
                required
                disabled={loading}
              >
                <option value="">Select Department</option>
                {depts.map(d => (
                  <option key={d} value={d}>
                    {d === "Basic Sciences" ? d : `${d} Engineering`}
                  </option>
                ))}
              </select>
            </div>
            {fieldErrors.dept && (
              <span className="field-error">{fieldErrors.dept}</span>
            )}
          </div>

          <div>
            <label className="register-label">Phone Number <span style={{color: '#ef4444'}}>*</span></label>
            <div className="register-input-wrapper">
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handlePhoneChange}
                className={getInputClass("phone")}
                placeholder="9876543210"
                maxLength={10}
                required
                disabled={loading}
              />
            </div>
            {fieldErrors.phone && (
              <span className="field-error">{fieldErrors.phone}</span>
            )}
          </div>

          <div>
            <label className="register-label">Designation <span style={{color: '#ef4444'}}>*</span></label>
            <div className="register-input-wrapper">
              <input
                name="designation"
                type="text"
                value={formData.designation}
                onChange={handleChange}
                className={getInputClass("designation")}
                placeholder="e.g., Associate Professor, Lecturer"
                required
                disabled={loading}
              />
            </div>
            {fieldErrors.designation && (
              <span className="field-error">{fieldErrors.designation}</span>
            )}
          </div>

          <div>
            <label className="register-label">Password <span style={{color: '#ef4444'}}>*</span></label>
            <div className="register-input-wrapper relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                className={getInputClass("password")}
                placeholder="•••••••• (min 6 chars)"
                minLength={6}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-0 bg-transparent border-none"
                onClick={togglePasswordVisibility}
                disabled={loading}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="field-error">{fieldErrors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading ? "Creating Faculty Account..." : "Create Faculty Account"}
          </button>
        </form>

        <p className="register-footer-text">
          Already have a faculty account?{" "}
          <button
            type="button"
            onClick={() => navigate("/faculty-login")}
            className="register-footer-link"
            disabled={loading}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default FacultyRegister;
