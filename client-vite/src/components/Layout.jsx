// src/components/Layout.jsx
import React from "react";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

const Layout = ({ user, onLogout, hasPersonalEvents, onEventsChange }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        user={user}
        onLogout={onLogout}
        hasPersonalEvents={hasPersonalEvents}
        onEventsChange={onEventsChange}
      />
      {/* Full-width content area, no max-width */}
      <main className="flex-1 w-full px-4 md:px-6 py-6 pt-4">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
