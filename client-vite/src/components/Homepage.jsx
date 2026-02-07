// src/components/Homepage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import Login from "./Login";
import Register from "./Register";
import FacultyLogin from "./FacultyLogin";
import FacultyRegister from "./FacultyRegister";
import CalendarView from "./CalendarView";

// Receive user + handlers from AppContent
function Homepage({ user, onLogin, onLogout }) {
  const navigate = useNavigate();
  const [authView, setAuthView] = useState("login");    // "login" | "register"
  const [authRole, setAuthRole] = useState("student");  // "student" | "faculty"
  const [showAuthModal, setShowAuthModal] = useState(false);

  // If already logged in (App says user != null), render dashboard
  useEffect(() => {
    if (user) {
      console.log("Homepage: logged in user →", user); // debug
    }
  }, [user]);

  const openAuth = (view = "login", role = "student") => {
    if (role === "student") {
      navigate(view === "login" ? "/login" : "/register");
    } else {
      navigate(view === "login" ? "/faculty-login" : "/faculty-register");
    }
  };

  const closeModal = () => setShowAuthModal(false);

  const switchToRegister = () => setAuthView("register");
  const switchToLogin = () => setAuthView("login");

  // Handle login/register success from child components
  // userData: { role, name?, email?, token }
  const handleAuthSuccess = (userData, tokenFromChild) => {
    const token = userData.token || tokenFromChild;
    if (!token) {
      console.error("Auth success called without token");
      return;
    }

    // Call global handler from App so it sets localStorage.user + token
    onLogin(
      {
        role: userData.role,
        name: userData.name,
        email: userData.email,
      },
      token
    );
  };

  // Lock/unlock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // ---------- LOGGED-IN DASHBOARD (App-level user) ----------
  if (user) {
    return (
      <div className="home-root">
        <header className="home-header">
          <div className="home-logo">
            <img src="/1.png" alt="Techno NJR" />
          </div>
          <button onClick={onLogout} className="btn-header">
            Logout
          </button>
        </header>
        <main className="home-main-loggedin">
          <section className="dashboard-card">
            {/* Pass user down so CalendarView can fetch user-specific events */}
            <CalendarView user={user} />
          </section>
        </main>
      </div>
    );
  }

  // ---------- PUBLIC LANDING (NOT LOGGED IN) ----------
  return (
    <div className="home-root">
      <header className="home-header">
        <div className="home-logo">
          <img src="/1.png" alt="Techno NJR" />
        </div>
        <div className="home-header-buttons">
          <button
            className="btn-header"
            onClick={() => openAuth("login", "student")}
          >
            Student Login
          </button>
          <button
            className="btn-header"
            onClick={() => openAuth("login", "faculty")}
          >
            Faculty Login
          </button>
        </div>
      </header>

      <main className="home-main">
        <section className="home-hero-text">
          <h1 className="home-title">
            Techno NJR Smart Academic Calendar
          </h1>
          <p className="home-subtitle">
            Plan classes, exams, assignments, and events in one place.
            Stay ahead of deadlines with a centralized academic calendar
            for students and faculty.
          </p>

          <div className="home-hero-buttons">
            <button
              className="btn-hero-primary"
              onClick={() => openAuth("login", "student")}
            >
              <span>Student Login</span>
              <span className="arrow">➜</span>
            </button>
            <button
              className="btn-hero-secondary"
              onClick={() => openAuth("login", "faculty")}
            >
              Faculty Login
            </button>
          </div>
        </section>

        <section className="home-hero-image-wrap">
          <div className="home-hero-image-mask">
            <img src="/2.webp" alt="Techno NJR Campus" />
          </div>
        </section>
      </main>

      <footer className="home-footer">
        © 2026 Techno NJR Smart Academic Calendar. All rights reserved.
      </footer>
    </div>
  );
}

export default Homepage;
