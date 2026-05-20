import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "./Auth.css";

function FacultyRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dept: "",
    phone: "",
    password: "",
    designation: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const depts = ["CSE", "ECE", "Civil", "Mechanical", "AI", "EE", "Basic Sciences"];

  const goHome = () => navigate("/");
  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Phone validation: Only allow digits and max length of 10
    if (name === "phone") {
      const onlyNums = value.replace(/[^0-9]/g, "");
      if (onlyNums.length <= 10) {
        setFormData((prev) => ({ ...prev, [name]: onlyNums }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setSubmitError("");
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Faculty email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.dept) newErrors.dept = "Department is required";
    
    // Strict 10 digit check
    if (formData.phone.length !== 10) {
      newErrors.phone = "Phone must be exactly 10 digits";
    }
    
    if (!formData.designation.trim()) newErrors.designation = "Designation is required";
    if (formData.password.length < 6) newErrors.password = "Min 6 characters required";

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        body: JSON.stringify({ ...formData, role: "faculty" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.message || "Registration failed");
        return;
      }

      setIsSuccess(true);
      // ✅ Redirect to public landing page instead of login layout since account is unapproved
      setTimeout(() => navigate("/"), 5000);
    } catch (err) {
      setSubmitError("Network error. Please try again.");
    } finally {
      loading(false);
      setLoading(false);
    }
  };

  // =========================================================================
  // ⏳ UPDATED SUCCESS STATE (Waiting for Administrative Approval)
  // =========================================================================
  if (isSuccess) {
    return (
      <div className="register-page">
        <div className="register-bg" />
        <div className="register-bg-overlay" />
        <div className="register-card">
          <div className="register-card-header" onClick={goHome} style={{ cursor: "pointer" }}>
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
            }}
          >
            <div style={{ color: "#3b82f6", fontSize: "1.4rem", fontWeight: 700, marginBottom: "1rem" }}>
              📝 Request Submitted
            </div>
            <p style={{ color: "#334155", fontSize: "1.05rem", fontWeight: 500, lineHeight: "1.5" }}>
              Your account has been successfully created and added to the 
              <strong style={{ color: "#111827" }}> Administrative Approval Queue</strong>.
            </p>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "1.5rem", fontWeight: 400 }}>
              You will be able to log in once a system administrator validates your profile credentials. 
              Returning to homepage...
            </p>
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
        <div className="register-card-header" onClick={goHome} style={{ cursor: "pointer" }}>
          <span className="register-back-arrow">←</span> <span>Home</span>
        </div>

        <div className="register-logo-wrapper">
          <img src="/1.png" alt="Logo" className="register-logo" />
        </div>

        <h1 className="register-title">Faculty Register</h1>

        {submitError && (
          <div className="login-error" style={{ background: "#fee2e2", color: "#ef4444", padding: "10px", borderRadius: "5px", marginBottom: "15px", textAlign: "center", fontSize: "14px" }}>
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <label className="register-label">Full Name</label>
          <input name="name" value={formData.name} onChange={handleChange} className="register-input" placeholder="Prof. John Doe" required />
          {fieldErrors.name && <span style={{color: 'red', fontSize: '11px'}}>{fieldErrors.name}</span>}

          <label className="register-label">Faculty Email</label>
          <input name="email" type="email" value={formData.email} onChange={handleChange} className="register-input" placeholder="faculty@technonjr.ac.in" required />
          {fieldErrors.email && <span style={{color: 'red', fontSize: '11px'}}>{fieldErrors.email}</span>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="register-label">Department</label>
              <select name="dept" value={formData.dept} onChange={handleChange} className="register-input" required>
                <option value="">Select</option>
                {depts.map(d => <option key={d} value={d.toUpperCase()}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="register-label">Phone</label>
              <input 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                className="register-input" 
                placeholder="10 Digits" 
                maxLength="10"
                required 
              />
            </div>
          </div>
          {fieldErrors.phone && <div style={{color: 'red', fontSize: '11px', marginTop: '-10px', marginBottom: '10px'}}>{fieldErrors.phone}</div>}

          <label className="register-label">Designation</label>
          <input name="designation" value={formData.designation} onChange={handleChange} className="register-input" placeholder="Associate Professor" required />

          <label className="register-label">Password</label>
          <div style={{ position: "relative" }}>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              className="register-input"
              style={{ paddingRight: "40px" }}
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {fieldErrors.password && <span style={{color: 'red', fontSize: '11px'}}>{fieldErrors.password}</span>}

          <button type="submit" className="register-button" disabled={loading}>
            {loading ? "Submitting Request..." : "Register Faculty"}
          </button>
        </form>

        <p className="register-footer-text" style={{ textAlign: 'center', marginTop: '20px' }}>
          Already have an account?{" "}
          <span onClick={() => navigate("/faculty-login")} style={{ color: "#2563eb", cursor: "pointer", fontWeight: "bold" }}>Login</span>
        </p>
      </div>
    </div>
  );
}

export default FacultyRegister;