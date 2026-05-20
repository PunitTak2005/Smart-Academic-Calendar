// src/pages/MyEventsPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./MyEventsPage.css";

const API_BASE_URL = "http://localhost:5000/api";

const MyEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  // 🎓 Get the current logged-in user's properties for year and department validation
  const savedUserJson = localStorage.getItem("user");
  const currentUser = savedUserJson ? JSON.parse(savedUserJson) : null;
  
  // Support both object extraction or direct backup strings saved during registration/login
  const userAcademicYear = currentUser?.year || localStorage.getItem("year") || "";
  const userDepartment = currentUser?.dept || localStorage.getItem("dept") || "";
  const userRole = currentUser?.role || localStorage.getItem("role") || "student";
  const isFaculty = userRole === "faculty";

  const loadMyEvents = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const token = localStorage.getItem("token");

      if (!token) {
        setEvents([]);
        setErrorMsg("");
        return;
      }

      // 🌐 Fetching from `/events` to get global context items alongside personal ones
      const res = await axios.get(`${API_BASE_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("All calendar events response:", res.data);
      const list = Array.isArray(res.data.events) ? res.data.events : [];
      setEvents(list);
    } catch (err) {
      console.error("Failed to load events repository", err);

      if (err.response?.status === 401) {
        setErrorMsg("");
      } else {
        setErrorMsg("Could not load your events directory. Please try again.");
      }

      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyEvents();
  }, []);

  // =========================================================================
  // 🛠️ FILTER PIPELINE: Handles Student Scope & Faculty Specific Visibility
  // =========================================================================
  const personalAndRelevantGlobalEvents = useMemo(() => {
    return events.filter((event) => {
      // 1. If it's a personal event created by the user, show it directly
      if (!event.isGlobal) {
        return true;
      }

      // 2. Faculty bypass rule: Show global events created by this faculty member
      if (isFaculty && event.createdBy && currentUser?.id && event.createdBy === currentUser.id) {
        return true;
      }

      // 3. Department Check for Global Events
      if (event.dept && event.dept !== "All Departments" && userDepartment) {
        const normalizedEventDept = event.dept.toLowerCase().trim();
        const normalizedUserDept = userDepartment.toLowerCase().trim();

        // Handles loose matching (e.g., "CSE" matching "COMPUTER SCIENCE (CSE)")
        if (!normalizedEventDept.includes(normalizedUserDept) && !normalizedUserDept.includes(normalizedEventDept)) {
          return false; // Skip this global event if departments don't match
        }
      }

      // 4. Academic Year Scope Check (Only enforced for students)
      if (isFaculty) {
        return true; // Faculty can see all matching department events regardless of year scope
      }

      const targetScope = event.year || event.yearScope || "All Years";

      // Show to student if it applies to everyone universally
      if (targetScope === "All Years") {
        return true;
      }

      // Show to student if it matches their year designation
      if (userAcademicYear) {
        const normalizedTarget = targetScope.toLowerCase();
        const normalizedUserYear = userAcademicYear.toLowerCase();

        if (
          normalizedTarget.includes(normalizedUserYear) || 
          normalizedUserYear.includes(normalizedTarget)
        ) {
          return true;
        }
      }

      return false;
    });
  }, [events, userAcademicYear, userDepartment, isFaculty, currentUser?.id]);

  return (
    <div className="my-events-container">
      <div className="my-events-header">
        <h1>My Events & Scope</h1>
        <button
          className="my-events-refresh-btn"
          onClick={loadMyEvents}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "🔄 Refresh"}
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : errorMsg ? (
        <div className="my-events-error">{errorMsg}</div>
      ) : personalAndRelevantGlobalEvents.length === 0 ? (
        <div>You have no personal or academic-relevant events yet.</div>
      ) : (
        <div className="my-events-list">
          {personalAndRelevantGlobalEvents.map((e) => (
            <div
              key={e._id}
              className={`my-event-card ${
                e.isGlobal && e.type === "holiday"
                  ? "global-holiday"
                  : e.isGlobal
                  ? "global"
                  : "personal"
              }`}
            >
              <div className="my-event-header">
                <span>
                  {e.isGlobal ? "🌐" : "👤"} {e.title}
                </span>
                {e.type && <span className="my-event-type">{e.type}</span>}
              </div>

              <div className="my-event-time">
                {e.start && e.end ? (
                  <>
                    {new Date(e.start).toLocaleString()} –{" "}
                    {new Date(e.end).toLocaleString()}
                  </>
                ) : (
                  "No time set"
                )}
              </div>

              {/* Displaying Department Metadata */}
              {e.dept === "" || e.dept === "All Departments" || !e.dept ? (
                <div className="my-event-dept" style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: "500", marginTop: "4px" }}>
                  📚 Department: All Departments
                </div>
              ) : (
                <div className="my-event-dept" style={{ fontSize: "0.85rem", color: "#2563eb", fontWeight: "500", marginTop: "4px" }}>
                  📚 Department: {e.dept}
                </div>
              )}
              
              {/* Displaying Year/Batch Metadata */}
              {(e.year || e.yearScope) && (
                <div className="my-event-scope" style={{ fontSize: "0.85rem", color: "#4b5563", marginTop: "2px" }}>
                  🎓 Target: {e.year || e.yearScope}
                </div>
              )}
              
              {e.location && <div style={{ marginTop: "2px", fontSize: "0.85rem" }}>📍 {e.location}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEventsPage;