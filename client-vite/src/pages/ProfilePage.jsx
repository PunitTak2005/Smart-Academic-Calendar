import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Profile.css";

const API_BASE_URL = "http://localhost:5000/api";

const ProfilePage = ({ token }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // State for profile form editing
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    rollNumber: "",
    dept: "",
    year: ""
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  // Separate State for changing password
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Individual toggle states for password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        let res;
        try {
          res = await axios.get(`${API_BASE_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (fallbackErr) {
          console.warn("Primary /users/profile failed, trying /users/me fallback...");
          res = await axios.get(`${API_BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        const profileData = res.data.user || res.data.data || res.data;
        
        if (!profileData || (!profileData.id && !profileData._id)) {
          throw new Error("Invalid profile payload structure received from backend.");
        }

        setUser(profileData);
        
        setFormData({
          name: profileData.name || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
          rollNumber: profileData.rollNumber || profileData.enrollmentId || "",
          dept: profileData.dept || profileData.department || "",
          year: profileData.year || profileData.semester || ""
        });
        setError("");
      } catch (err) {
        console.error("Profile load failed:", err);
        setError(err.response?.data?.message || err.message || "Error loading profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      // Clean string: strip out any non-digits entirely
      const digitsOnly = value.replace(/\D/g, "");
      
      // Enforce physical maximum limit of 10 characters
      if (digitsOnly.length <= 10) {
        setFormData((prev) => ({
          ...prev,
          [name]: digitsOnly
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = async (e) => {
    if (e) e.preventDefault();
    setUpdateLoading(true);
    setError("");
    setSuccessMessage("");

    // Create a shadow copy payload to preserve state structure locally
    const payload = { ...formData };

    // Sanitization: If logged-in profile is NOT a student, strip incompatible schema constraints
    if (user && user.role !== "student") {
      delete payload.year;
      delete payload.rollNumber;
    }

    try {
      const res = await axios.put(
        `${API_BASE_URL}/users/update`, 
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedUser = res.data.user || res.data.data || res.data;
      setUser(updatedUser);
      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Profile update failed:", err);
      setError(err.response?.data?.message || "Failed to update profile details.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      await axios.put(
        `${API_BASE_URL}/users/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPasswordSuccess("Password updated successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setIsChangingPassword(false);
      
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      
      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch (err) {
      console.error("Password change failed:", err);
      setPasswordError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setError("");
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        rollNumber: user.rollNumber || user.enrollmentId || "",
        dept: user.dept || user.department || "",
        year: user.year || user.semester || ""
      });
    }
  };

  const clearPasswordForm = () => {
    setIsChangingPassword(false);
    setPasswordError("");
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  if (!token) {
    return <p className="text-sm text-gray-500 p-4">Please log in to view your profile.</p>;
  }

  if (loading) {
    return <p className="text-sm text-gray-500 p-4">Loading profile...</p>;
  }

  if (!user) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-500 font-medium">No profile data found.</p>
        {error && <p className="text-xs text-gray-400 mt-1">Backend details: {error}</p>}
      </div>
    );
  }

  const initial = user.name?.[0]?.toUpperCase() || "?";
  const department = user.dept || user.department || "Not set";
  const semesterOrYear = user.year || user.semester || "Not set";

  return (
    <div className="profile-page">
      {/* Header gradient card */}
      <div className="profile-header-card">
        <div className="profile-header-text">
          <h1>My Profile</h1>
          <p>Welcome back, {user.name}</p>
        </div>
        <div className="profile-header-meta">
          <div>{user.role?.toUpperCase()} · {department}</div>
          <div>{user.email}</div>
        </div>
      </div>

      {/* Persistent Notification Area to Prevent Layout Shift */}
      <div className="notification-zone min-h-[40px] my-2">
        {error && <div className="error-banner text-red-500 text-sm p-2 bg-red-50 rounded">⚠️ {error}</div>}
        {successMessage && <div className="success-banner text-green-500 text-sm p-2 bg-green-50 rounded">✅ {successMessage}</div>}
      </div>

      {/* Main Form Context Wrapping Entire Split View Layout */}
      <form onSubmit={handleSaveChanges} className="profile-grid">
        
        {/* Left column: Overview & Primary details wrapper */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-avatar">
              <span>{initial}</span>
            </div>
            <div className="profile-main-info">
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  className="edit-input font-bold text-lg border rounded p-1 w-full"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              ) : (
                <h2>{user.name}</h2>
              )}
              <p>{user.role} · {department}</p>
            </div>
          </div>

          <div className="profile-card-body">
            <div className="profile-row">
              <span className="label">Email</span>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  className="edit-input border rounded p-1 w-full"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              ) : (
                <span className="value">{user.email}</span>
              )}
            </div>
            
            <div className="profile-row">
              <span className="label">Phone</span>
              {isEditing ? (
                <input
                  type="text"
                  name="phone"
                  className="edit-input border rounded p-1 w-full"
                  value={formData.phone}
                  onChange={handleInputChange}
                  maxLength="10"
                  required
                />
              ) : (
                <span className="value">{user.phone || "Not added"}</span>
              )}
            </div>

            {user.role === "student" && (
              <div className="profile-row">
                <span className="label">Year</span>
                {isEditing ? (
                  <select
                    name="year"
                    className="edit-input border rounded p-1 w-full"
                    value={formData.year}
                    onChange={handleInputChange}
                  >
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                  </select>
                ) : (
                  <span className="value">{semesterOrYear}</span>
                )}
              </div>
            )}
          </div>

          {/* Core Info Actions */}
          {isEditing ? (
            <div className="flex gap-2 w-full mt-4">
              <button 
                type="submit" 
                className="btn-primary flex-1 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition font-medium" 
                disabled={updateLoading}
              >
                {updateLoading ? "Saving..." : "Save Changes"}
              </button>
              <button 
                type="button" 
                className="btn-secondary flex-1 bg-gray-200 text-gray-700 p-2 rounded-full hover:bg-gray-300 transition font-medium"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button 
              type="button" 
              className="btn-primary w-full mt-4 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition font-medium"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>
      </form>

      {/* Secondary Features Section Container (Separated Sub-Forms) */}
      <div className="profile-details mt-4 space-y-4">
        
        {/* Section: Academic Info View - Fully Syncing inside Global Context */}
        <section className="profile-card bg-white p-4 rounded border">
          <h3 className="profile-section-title font-semibold text-base mb-2">Academic Information</h3>
          <div className="profile-details-grid">
            {user.role === "student" && (
              <div className="profile-detail mb-3">
                <p className="label text-gray-500">Roll Number</p>
                {isEditing ? (
                  <input
                    type="text"
                    name="rollNumber"
                    className="edit-input w-full border rounded p-1 mt-1"
                    value={formData.rollNumber}
                    onChange={handleInputChange}
                    required
                  />
                ) : (
                  <p className="value font-medium">
                    {user.rollNumber || user.enrollmentId || "Not set"}
                  </p>
                )}
              </div>
            )}
            
            <div className="profile-detail">
              <p className="label text-gray-500">Department</p>
              {isEditing ? (
                <select
                  name="dept"
                  className="edit-input w-full border rounded p-1 mt-1"
                  value={formData.dept}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                </select>
              ) : (
                <p className="value font-medium">{department}</p>
              )}
            </div>
          </div>
          {isEditing && (
            <p className="text-xs text-gray-400 mt-2">
              * Changes to academic details apply when saving your profile edits above.
            </p>
          )}
        </section>

        {/* Section: Independent Password Form */}
        <form onSubmit={handlePasswordSubmit} className="profile-card border border-gray-100 rounded p-4 bg-white shadow-sm">
          <h3 className="profile-section-title font-semibold text-base mb-2">Account Security</h3>
          
          {passwordError && <div className="text-red-500 text-xs mb-2 bg-red-50 p-2 rounded">⚠️ {passwordError}</div>}
          {passwordSuccess && <div className="text-green-500 text-xs mb-2 bg-green-50 p-2 rounded">✅ {passwordSuccess}</div>}

          {!isChangingPassword ? (
            <button
              type="button"
              className="w-full text-left text-sm text-purple-600 hover:underline font-medium"
              onClick={() => setIsChangingPassword(true)}
            >
              Change account password?
            </button>
          ) : (
            <div className="mt-2 space-y-3">
              <div className="space-y-3">
                
                {/* Current Password Field */}
                <div>
                  <label className="block text-xs text-gray-500">Current Password</label>
                  <div className="relative mt-1">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      autoComplete="current-password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInputChange}
                      className="w-full border rounded p-1.5 pr-10 text-sm"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs focus:outline-none"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* New Password Field */}
                <div>
                  <label className="block text-xs text-gray-500">New Password</label>
                  <div className="relative mt-1">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      autoComplete="new-password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      className="w-full border rounded p-1.5 pr-10 text-sm"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs focus:outline-none"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password Field */}
                <div>
                  <label className="block text-xs text-gray-500">Confirm New Password</label>
                  <div className="relative mt-1">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      autoComplete="new-password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      className="w-full border rounded p-1.5 pr-10 text-sm"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs focus:outline-none"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

              </div>
              
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="btn-primary flex-1 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition font-medium"
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
                <button
                  type="button"
                  className="btn-secondary flex-1 bg-gray-200 text-gray-700 p-2 rounded-full hover:bg-gray-300 transition font-medium text-sm"
                  onClick={clearPasswordForm}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;