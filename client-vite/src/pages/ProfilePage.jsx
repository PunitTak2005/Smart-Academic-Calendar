// src/components/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Profile.css";

const API_BASE_URL = "http://localhost:5000/api";

const ProfilePage = ({ token }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Full Profile Data from Server:", res.data); // <--- DEBUG LOG
        setUser(res.data.user || res.data);
        setError("");
      } catch (err) {
        console.error("Profile load failed:", err);
        setError(
          err.response?.data?.message || "Error loading profile"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [token]);

  if (!token) {
    return <p className="text-sm text-gray-500">Please log in to view your profile.</p>;
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading profile...</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-red-500">
        Error loading profile: {error}
      </p>
    );
  }

  if (!user) {
    return <p className="text-sm text-gray-500">No profile data found.</p>;
  }

  const initial = user.name?.[0]?.toUpperCase() || "?";
  const department = user.dept || user.department || "Not set";
  const semesterOrYear = user.semester || user.year || "Not set";

  return (
    <div className="profile-page">
      {/* Header gradient card - merged from snippet */}
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

      <div className="profile-grid">
        {/* Left: overview card */}
        <section className="profile-card">
          <div className="profile-card-header">
            <div className="profile-avatar">
              <span>{initial}</span>
            </div>
            <div className="profile-main-info">
              <h2>{user.name}</h2>
              <p>
                {user.role} · {department}
              </p>
            </div>
          </div>

          <div className="profile-card-body">
            <div className="profile-row">
              <span className="label">Email</span>
              <span className="value">{user.email}</span>
            </div>
            <div className="profile-row">
              <span className="label">Phone</span>
              <span className="value">{user.phone || "Not added"}</span>
            </div>
            {user.role === "student" && (
              <div className="profile-row">
                <span className="label">Year</span>
                <span className="value">{semesterOrYear}</span>
              </div>
            )}
          </div>

          <button className="btn-primary w-full">Edit profile</button>
        </section>

        {/* Right: academic details */}
        <section className="profile-details">
          <div className="profile-card">
            <h3 className="profile-section-title">Academic information</h3>
            <div className="profile-details-grid">
              {user.role === "student" && (
                <div className="profile-detail">
                  <p className="label">Roll Number</p>
                  <p className="value">
                    {user.enrollmentId || user.rollNumber || "Not set"}
                  </p>
                </div>
              )}
              <div className="profile-detail">
                <p className="label">Department</p>
                <p className="value">{department}</p>
              </div>
              
              
            </div>
          </div>

          {/* Placeholder for future widgets */}
          {/* <div className="profile-card">...</div> */}
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
