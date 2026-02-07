// src/App.jsx
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import Layout from "./components/Layout";
import CalendarPage from "./pages/CalendarPage";
import MyEventsPage from "./pages/MyEventsPage";
import ProfilePage from "./pages/ProfilePage";
import Login from "./components/Login";
import Register from "./components/Register";
import HomePage from "./components/Homepage";
import FacultyLogin from "./components/FacultyLogin";
import FacultyRegister from "./components/FacultyRegister";

const AppContent = () => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [authLoading, setAuthLoading] = useState(true);

  const [eventSummary, setEventSummary] = useState({
    global: [],
    personal: [],
  });

  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = !!user && !!token;
  const hasPersonalEvents = eventSummary.personal.length > 0;

  // Hide layout on auth pages when NOT authenticated
  const hideLayoutOnAuth =
    !isAuthenticated &&
    (location.pathname === "/" ||
      location.pathname.startsWith("/login") ||
      location.pathname.startsWith("/register") ||
      location.pathname.startsWith("/faculty-login") ||
      location.pathname.startsWith("/faculty-register"));

  const getDefaultPathForUser = (u) => {
    if (!u || !u.role) return "/login";
    return u.role === "student" ? "/my-events" : "/calendar";
  };

  console.log("AppContent render", {
    path: location.pathname,
    user,
    token,
    authLoading,
    isAuthenticated,
    hideLayoutOnAuth,
  });

  // Session validation (runs once on mount)
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!storedToken || !storedUser) {
      setUser(null);
      setToken(null);
      setAuthLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (!res.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          setToken(null);
        } else {
          const data = await res.json();
          const userFromApi = data.user || data;
          setUser(userFromApi);
          setToken(storedToken);
          localStorage.setItem("user", JSON.stringify(userFromApi));
        }
      } catch (error) {
        console.error("Session check failed:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setToken(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLogin = (userData, newToken) => {
    if (!userData || !newToken) return;

    console.log("handleLogin called", { userData, newToken });

    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setToken(newToken);

    const defaultPath = getDefaultPathForUser(userData);
    navigate(defaultPath, { replace: true });
  };

  const handleRegister = (userData, newToken) => {
    if (!userData || !newToken) return;

    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setToken(newToken);

    const defaultPath = getDefaultPathForUser(userData);
    navigate(defaultPath, { replace: true });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    setEventSummary({ global: [], personal: [] });
    navigate("/login", { replace: true });
  };

  // Only show loader while session check in progress
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Checking session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {hideLayoutOnAuth ? (
        // Public pages: NO Layout/Navbar
        <main className="pb-12 px-4 md:px-6">
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to={getDefaultPathForUser(user)} replace />
                ) : (
                  <HomePage
                    user={user}
                    onLogin={handleLogin}
                    onLogout={handleLogout}
                  />
                )
              }
            />
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to={getDefaultPathForUser(user)} replace />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/faculty-login"
              element={
                isAuthenticated ? (
                  <Navigate to={getDefaultPathForUser(user)} replace />
                ) : (
                  <FacultyLogin onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/register"
              element={
                isAuthenticated ? (
                  <Navigate to={getDefaultPathForUser(user)} replace />
                ) : (
                  <Register
                    onRegister={handleRegister}
                    goHome={() => navigate("/")}
                  />
                )
              }
            />
            <Route
              path="/faculty-register"
              element={
                isAuthenticated ? (
                  <Navigate to={getDefaultPathForUser(user)} replace />
                ) : (
                  <FacultyRegister onRegister={handleRegister} />
                )
              }
            />
            {/* Fallback for unknown public routes */}
            <Route
              path="*"
              element={
                isAuthenticated ? (
                  <Navigate to={getDefaultPathForUser(user)} replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </main>
      ) : (
        // Protected: Layout + Navbar via nested routes
        <Routes>
          <Route
            element={
              <Layout
                user={user}
                onLogout={handleLogout}
                hasPersonalEvents={hasPersonalEvents}
                onEventsChange={setEventSummary}
              />
            }
          >
            <Route
              path="/calendar"
              element={
                isAuthenticated ? (
                  <CalendarPage
                    onEventsChange={(next) => setEventSummary(next)}
                    token={token}
                    user={user}
                  />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/my-events"
              element={
                isAuthenticated ? (
                  <MyEventsPage token={token} user={user} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/profile"
              element={
                isAuthenticated ? (
                  <ProfilePage user={user} token={token} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            {/* Fallback for unknown protected routes */}
            <Route
              path="*"
              element={<Navigate to={getDefaultPathForUser(user)} replace />}
            />
          </Route>
        </Routes>
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
