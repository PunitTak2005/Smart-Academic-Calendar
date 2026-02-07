// src/pages/MyEventsPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MyEventsPage.css";

const API_BASE_URL = "http://localhost:5000/api";

const MyEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadMyEvents = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const token = localStorage.getItem("token");

      // If no token, just show empty list (no error text)
      if (!token) {
        setEvents([]);
        setErrorMsg("");
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/events/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("My events response:", res.data);
      const list = Array.isArray(res.data.events) ? res.data.events : [];
      setEvents(list);
    } catch (err) {
      console.error("Failed to load my events", err);

      if (err.response?.status === 401) {
        // Session expired / invalid token → treat as no events
        setErrorMsg("");
      } else {
        setErrorMsg("Could not load your events. Please try again.");
      }

      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyEvents();
  }, []);

  return (
    <div className="my-events-container">
      <div className="my-events-header">
        <h1>My Events</h1>
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
      ) : events.length === 0 ? (
        <div>You have no events yet.</div>
      ) : (
        <div className="my-events-list">
          {events.map((e) => (
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

              {e.dept && <div>📚 {e.dept}</div>}
              {e.location && <div>📍 {e.location}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEventsPage;
