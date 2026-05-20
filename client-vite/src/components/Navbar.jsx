// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";
import logo1 from "../assets/1.png";

const Navbar = ({ user, onLogout, hasPersonalEvents }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false); // 📱 Tracks mobile menu open state
  const [pendingCount, setPendingCount] = useState(0); // 🔔 Tracks pending faculty registrations

  const getDefaultPathForUser = (u) => {
    if (!u || !u.role) return "/"; 
    return u.role === "student" ? "/my-events" : "/calendar";
  };

  // Fetch pending queue count if the logged-in user is an admin
  useEffect(() => {
    if (user && user.role === "admin") {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) return;

      const fetchQueueCount = async () => {
        try {
          const res = await fetch("http://localhost:5000/api/auth/pending-faculty", {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          const data = await res.json();
          if (data.success) {
            setPendingCount(data.count || 0);
          }
        } catch (err) {
          console.warn("Failed to fetch pending approval count:", err.message);
        }
      };

      fetchQueueCount();
      const interval = setInterval(fetchQueueCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogoutClick = () => {
    setIsOpen(false); 
    localStorage.clear(); 
    navigate("/", { replace: true });

    if (typeof onLogout === "function") {
      setTimeout(() => {
        onLogout();
      }, 0);
    }
  };

  const handleMobileNavigation = (path) => {
    setIsOpen(false); 
    navigate(path);
  };

  // Reusable notification badge component
  const renderAdminBadge = () => {
    if (user?.role !== "admin" || pendingCount === 0) return null;
    return (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ef4444",
        color: "white",
        fontSize: "10px",
        fontWeight: "bold",
        borderRadius: "9999px",
        minWidth: "16px",
        height: "16px",
        padding: "0 4px",
        marginLeft: "6px",
        verticalAlign: "middle"
      }}>
        {pendingCount}
      </span>
    );
  };

  return (
    <header className="navbar">
      {/* 🧩 Left Section: Logo */}
      <div className="navbar-left">
        <button
          className="navbar-logo"
          onClick={() => {
            setIsOpen(false);
            navigate(user ? getDefaultPathForUser(user) : "/");
          }}
          type="button"
        >
          <img
            src={logo1}
            alt="Techno NJR Institute of Technology"
            style={{ height: "48px", marginRight: "0.75rem" }}
          />
        </button>
      </div>

      {/* 🧩 Center Section: Nav Links (Clean layout container) */}
      <nav className={`navbar-center ${isOpen ? "mobile-open" : ""}`}>
        {user && (
          <>
            <NavLink
              to="/calendar"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
            >
              Calendar
            </NavLink>

            <NavLink
              to="/my-events"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
            >
              My Events
              {hasPersonalEvents && (
                <span
                  style={{
                    display: "inline-block",
                    width: "6px",
                    height: "6px",
                    marginLeft: "4px",
                    borderRadius: "9999px",
                    backgroundColor: "#ef4444",
                  }}
                />
              )}
            </NavLink>

            <NavLink
              to="/profile"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
            >
              Profile
            </NavLink>

            {/* ✅ FIXED: Synchronized destination path and restricted access strictly to Admins */}
            {user.role === "admin" && (
              <NavLink
                to="/admin-dashboard"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
              >
                Dashboard
                {renderAdminBadge()}
              </NavLink>
            )}
          </>
        )}

        {/* 📱 Mobile Dropdown Bottom Actions Row */}
        <div className="mobile-user-section">
          {user ? (
            <>
              <span className="nav-user">Hi, {user.name}</span>
              <button className="nav-btn" onClick={handleLogoutClick}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="nav-btn" onClick={() => handleMobileNavigation("/login")}>
                Student Login
              </button>
              <button className="nav-btn" onClick={() => handleMobileNavigation("/faculty-login")}>
                Faculty Login
              </button>
            </>
          )}
        </div>
      </nav>

      {/* 🧩 Right Section: Desktop User Account Controls & Mobile Hamburger Button */}
      <div className="navbar-right">
        {/* 💻 Desktop Actions Container */}
        <div className="navbar-right-desktop" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {user ? (
            <>
              <span className="nav-user">{user.name}</span>
              <button className="nav-btn" onClick={handleLogoutClick}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="nav-btn" onClick={() => navigate("/login")}>
                Student Login
              </button>
              <button className="nav-btn" onClick={() => navigate("/faculty-login")}>
                Faculty Login
              </button>
            </>
          )}
        </div>

        {/* 🍔 Interactive Hamburger Menu Button */}
        <button 
          className="navbar-toggle" 
          onClick={() => setIsOpen(!isOpen)} 
          aria-label="Toggle navigation parameters"
          type="button"
        >
          <span style={{ transform: isOpen ? "rotate(45deg) translate(5px, 6px)" : "none" }}></span>
          <span style={{ opacity: isOpen ? 0 : 1 }}></span>
          <span style={{ transform: isOpen ? "rotate(-45deg) translate(5px, -6px)" : "none" }}></span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;