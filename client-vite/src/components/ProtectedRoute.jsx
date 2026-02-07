// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { isAuthenticated, authLoading, getDefaultPathForUser, user } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Checking session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If you want all unknown child routes to still go to default path:
  // <Route path="*" element={<Navigate to={getDefaultPathForUser(user)} replace />} />
  return <Outlet />;
};

export default ProtectedRoute;
