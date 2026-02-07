// src/components/Navbar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";
import logo1 from "../assets/1.png";

const Navbar = ({ user, onLogout, hasPersonalEvents }) => {
  const navigate = useNavigate();

  const getDefaultPathForUser = (u) => {
    if (!u || !u.role) return "/login";
    return u.role === "student" ? "/my-events" : "/calendar";
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigate("/login");
    }
  };

  const handleStudentLoginClick = () => navigate("/login");
  const handleFacultyLoginClick = () => navigate("/faculty-login");

  return (
    <header className="navbar">
      {/* left: logo */}
      <div className="navbar-left">
        <button
          className="navbar-logo"
          onClick={() => navigate(user ? getDefaultPathForUser(user) : "/")}
          type="button"
        >
          <img
            src={logo1}
            alt="Techno NJR Institute of Technology"
            style={{ height: "48px", marginRight: "0.75rem" }}
          />
        </button>
      </div>

      {/* center: protected links */}
      <nav className="navbar-center">
        {user && (
          <>
            <NavLink
              to="/calendar"
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              Calendar
            </NavLink>

            <NavLink
              to="/my-events"
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
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
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              Profile
            </NavLink>
          </>
        )}
      </nav>

      {/* right: auth controls */}
      <div className="navbar-right">
        {user ? (
          <>
            <span className="nav-user">{user.name}</span>
            <button className="nav-btn" onClick={handleLogoutClick}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button className="nav-btn" onClick={handleStudentLoginClick}>
              Student Login
            </button>
            <button className="nav-btn" onClick={handleFacultyLoginClick}>
              Faculty Login
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
