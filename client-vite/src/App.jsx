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
import AdminQueue from "./components/AdminQueue"; 

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

  // Forces all authenticated users to go straight to the calendar page
  const getDefaultPathForUser = (u) => {
    if (!u) return "/";
    return "/calendar";
  };

  const hideLayoutOnAuth =
    !isAuthenticated &&
    (location.pathname === "/" ||
      location.pathname.startsWith("/login") ||
      location.pathname.startsWith("/register") ||
      location.pathname.startsWith("/faculty-login") ||
      location.pathname.startsWith("/faculty-register"));

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
          throw new Error(`Session expired with status: ${res.status}`);
        }

        const data = await res.json();
        const userFromApi = data.user || data;

        // 🛡️ Security Check: Catch unapproved state updates mid-session
        if (userFromApi.role === "faculty" && !userFromApi.isApproved) {
          throw new Error("Account pending administrative approval validation.");
        }

        setUser(userFromApi);
        setToken(storedToken);
        localStorage.setItem("user", JSON.stringify(userFromApi));
        
      } catch (error) {
        console.warn("User auth verification handled:", error.message);
        
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

    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setToken(newToken);

    const defaultPath = getDefaultPathForUser(userData);
    navigate(defaultPath, { replace: true });
  };

  const handleRegister = (userData, newToken) => {
    if (!userData || !newToken) return;

    if (userData.role === "faculty" && !userData.isApproved) {
      navigate("/faculty-login", { replace: true });
      return;
    }

    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setToken(newToken);

    const defaultPath = getDefaultPathForUser(userData);
    navigate(defaultPath, { replace: true });
  };

  // =========================================================================
  // 🔄 LOGOUT HANDLER (Clean Navigation straight to Public Homepage Route)
  // =========================================================================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    setEventSummary({ global: [], personal: [] });
    
    navigate("/", { replace: true });
  };

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
        <main className="pb-12 px-4 md:px-6">
          <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to={getDefaultPathForUser(user)} replace /> : <HomePage user={user} onLogin={handleLogin} onLogout={handleLogout} />} />
            <Route path="/login" element={isAuthenticated ? <Navigate to={getDefaultPathForUser(user)} replace /> : <Login onLogin={handleLogin} />} />
            <Route path="/faculty-login" element={isAuthenticated ? <Navigate to={getDefaultPathForUser(user)} replace /> : <FacultyLogin onLogin={handleLogin} />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to={getDefaultPathForUser(user)} replace /> : <Register onRegister={handleRegister} goHome={() => navigate("/")} />} />
            <Route path="/faculty-register" element={isAuthenticated ? <Navigate to={getDefaultPathForUser(user)} replace /> : <FacultyRegister onRegister={handleRegister} />} />
            <Route path="/not-found" element={<div className="p-8 text-center text-xl">Page Not Found</div>} />
            
            <Route path="*" element={<Navigate to={isAuthenticated ? getDefaultPathForUser(user) : "/"} replace />} />
          </Routes>
        </main>
      ) : (
        <Routes>
          <Route
            element = {
              <Layout
                user={user}
                onLogout={handleLogout}
                hasPersonalEvents={hasPersonalEvents}
                onEventsChange={setEventSummary}
              />
            }
          >
            <Route path="/calendar" element={isAuthenticated ? <CalendarPage onEventsChange={setEventSummary} token={token} user={user} /> : <Navigate to="/" replace />} />
            <Route path="/my-events" element={isAuthenticated ? <MyEventsPage token={token} user={user} /> : <Navigate to="/" replace />} />
            <Route path="/profile" element={isAuthenticated ? <ProfilePage user={user} token={token} /> : <Navigate to="/" replace />} />
            
            {/* =========================================================================
                🛡️ STRICT ADMIN DASHBOARD ROUTE (Centered text alignments included)
               ========================================================================= */}
            <Route 
              path="/admin-dashboard" 
              element={
                isAuthenticated && user.role === "admin" ? (
                  <div className="p-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-500 mt-2">Welcome back, {user.name}!</p>
                    
                    <AdminQueue token={token} />
                  </div>
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />

            <Route path="*" element={<Navigate to={getDefaultPathForUser(user)} replace />} />
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