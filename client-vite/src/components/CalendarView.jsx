// src/components/CalendarView.jsx
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./CalendarView.css";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const getDayDefaultTimes = (baseDate) => {
  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(baseDate);
  end.setDate(end.getDate() + 1);
  end.setHours(0, 0, 0, 0);
  return { start, end };
};

const formatForInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatTimeRange = (start, end) => {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);

  const same =
    s.getHours() === e.getHours() &&
    s.getMinutes() === e.getMinutes() &&
    s.getSeconds() === e.getSeconds();

  if (same) {
    return "All day";
  }

  const opts = { hour: "2-digit", minute: "2-digit" };
  return `${s.toLocaleTimeString([], opts)} – ${e.toLocaleTimeString([], opts)}`;
};

const CalendarView = ({ user, token, onEventsChange, onPersonalEventAdded }) => {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState({ global: [], personal: [] });
  const [filters, setFilters] = useState({ dept: "", type: "", year: "2026" });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [formError, setFormError] = useState("");

  const isFaculty = user?.role === "faculty";

  const loadEvents = async () => {
    try {
      setLoading(true);
      if (!token) {
        setEvents({ global: [], personal: [] });
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const all = res.data.events || [];
      const global = all.filter((e) => e.isGlobal);
      const personal = all.filter((e) => !e.isGlobal);

      const nextEvents = { global, personal };
      setEvents(nextEvents);

      const now = new Date();
      const upcoming = all.filter((e) => {
        const start = new Date(e.start);
        const diff = start - now;
        return diff > 0 && diff < 5 * 60 * 1000;
      });
      setReminders(upcoming);

      if (onEventsChange) onEventsChange(nextEvents);
    } catch (err) {
      console.error("Events load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const allEvents = [...events.global, ...events.personal];

  const filteredEvents = allEvents.filter((e) => {
    if (filters.dept && e.dept !== filters.dept) return false;
    if (filters.type && e.type !== filters.type) return false;
    if (filters.year && e.year && String(e.year) !== String(filters.year)) return false;
    return true;
  });

  const selectedEvents = filteredEvents.filter(
    (e) => new Date(e.start).toDateString() === date.toDateString()
  );

  const applyFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // ✅ 1. Updated tileContent: render multiple dots for each event type
  const tileContent = ({ date: tileDate, view }) => {
    if (view !== "month") return null;

    const dayEvents = filteredEvents.filter(
      (e) => new Date(e.start).toDateString() === tileDate.toDateString()
    );

    if (dayEvents.length === 0) return null;

    return (
      <div className="dot-container">
        {dayEvents.map((event, index) => {
          // Red for global holidays, purple for other global, blue for personal
          let bgColor = '#2563eb'; // default blue for personal
          
          if (event.isGlobal && event.type === 'holiday') {
            bgColor = '#ef4444'; // red for global holidays
          } else if (event.isGlobal) {
            bgColor = '#9333ea'; // purple for other global events
          }
          
          return (
            <span 
              key={index} 
              className={`dot ${event.isGlobal ? (event.type === 'holiday' ? 'official' : 'global') : 'personal'}`}
              style={{ backgroundColor: bgColor }}
            />
          );
        })}
      </div>
    );
  };

  // ✅ 2. Updated tileClassName: holiday-day only for global holidays
  const tileClassName = ({ date: tileDate, view }) => {
    if (view !== "month") return "";
    const classes = [];

    if (tileDate.getDay() === 0) {
      classes.push("sunday-day");
    }

    const dayEvents = filteredEvents.filter(
      (e) => new Date(e.start).toDateString() === tileDate.toDateString()
    );

    if (dayEvents.length === 0) return classes.join(" ");

    if (dayEvents.some((e) => e.type === "holiday" && e.isGlobal)) {
      classes.push("holiday-day"); // only global holidays
    }
    if (dayEvents.some((e) => e.isGlobal)) {
      classes.push("global-day");
    }
    if (dayEvents.some((e) => !e.isGlobal)) {
      classes.push("personal-day");
    }

    return classes.join(" ");
  };

  const openGlobalForm = () => {
    const { start, end } = getDayDefaultTimes(date);
    setFormError("");
    setEditingEvent({
      _id: null,
      isGlobal: true,
      title: "",
      start,
      end,
      type: "exam",
      dept: "",
      yearScope: filters.year || "All Years",
      location: "Campus",
      isReminder: false,
    });
    setShowForm(true);
  };

  const openPersonalForm = () => {
    const { start, end } = getDayDefaultTimes(date);
    setFormError("");
    setEditingEvent({
      _id: null,
      isGlobal: false,
      title: "",
      start,
      end,
      type: "assignment",
      dept: "",
      yearScope: filters.year || "All Years",
      location: "",
      isReminder: false,
    });
    setShowForm(true);
  };

  const handleSaveEvent = async (e) => {
    if (e) e.preventDefault();

    if (!editingEvent || !token) {
      return;
    }

    const normalizedDept = editingEvent.dept || "";

    if (
      !editingEvent.title?.trim() ||
      !editingEvent.start ||
      !editingEvent.end ||
      !editingEvent.type ||
      !editingEvent.yearScope ||
      !editingEvent.location?.trim()
    ) {
      setFormError("Please fill in all fields before saving.");
      return;
    }

    setFormError("");

    if (editingEvent.isGlobal && !isFaculty) {
      alert("Only faculty can create global events.");
      return;
    }

    try {
      const payload = {
        title: editingEvent.title,
        start: editingEvent.start,
        end: editingEvent.end,
        type: editingEvent.type,
        dept: normalizedDept,
        location: editingEvent.location,
        year: editingEvent.yearScope || filters.year,
        isGlobal: editingEvent.isGlobal,
        isReminder: editingEvent.isReminder,
      };

      const headers = { Authorization: `Bearer ${token}` };

      if (editingEvent._id) {
        await axios.put(
          `${API_BASE_URL}/events/${editingEvent._id}`,
          payload,
          { headers }
        );
      } else {
        await axios.post(`${API_BASE_URL}/events`, payload, { headers });
        if (!editingEvent.isGlobal && onPersonalEventAdded) {
          onPersonalEventAdded(payload);
        }
      }

      setShowForm(false);
      setEditingEvent(null);
      await loadEvents();
    } catch (err) {
      console.error("Save event failed", err);
      if (err.response?.status === 403) {
        alert(err.response.data?.message || "Access denied.");
      }
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!token) return;
    if (!window.confirm("Delete this event?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      loadEvents();
    } catch (err) {
      console.error("Delete event failed", err);
    }
  };

  const handleMakePersonal = async (id) => {
    if (!token) return;
    try {
      await axios.post(`${API_BASE_URL}/events/${id}/make-personal`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      loadEvents();
    } catch (err) {
      console.error("Make personal failed", err);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Personalized header using user prop */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>
            Academic Calendar
            {user?.name ? ` - ${user.name}` : ""}{" "}
            {user?.role ? `(${user.role})` : ""}
          </h1>
        </div>

        <div className="action-buttons">
          {isFaculty && (
            <button
              type="button"
              onClick={openGlobalForm}
              className="btn-pill"
            >
              <span className="plus-icon">+</span>
              <span>Global Event</span>
            </button>
          )}

          <button
            type="button"
            onClick={openPersonalForm}
            className="btn-pill"
          >
            <span className="plus-icon">+</span>
            <span>My Event</span>
          </button>

          <button type="button" onClick={loadEvents} className="btn-pill">
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {reminders.length > 0 && (
        <div className="reminders-banner">
          {reminders.map((r) => (
            <div key={r._id} className="reminder-item">
              ⏰ {r.title} in{" "}
              {Math.round((new Date(r.start) - Date.now()) / 60000)}min
            </div>
          ))}
        </div>
      )}

      <div className="filters-panel">
        <select
          value={filters.dept}
          onChange={(e) => applyFilter("dept", e.target.value)}
        >
          <option value="">All Departments</option>
          <option value="CSE">CSE</option>
          <option value="ECE">ECE</option>
          <option value="Civil">Civil</option>
          <option value="Mechanical">Mechanical</option>
          <option value="AI">AI</option>
        </select>

        <select
          value={filters.type}
          onChange={(e) => applyFilter("type", e.target.value)}
        >
          <option value="">All Types</option>
          <option value="exam">Exam</option>
          <option value="class">Class</option>
          <option value="assignment">Assignment</option>
          <option value="holiday">Holiday</option>
          <option value="workshop">Workshop</option>
          <option value="meeting">Meeting</option>
          <option value="placement">Placement Drive</option>
          <option value="event">Event</option>
        </select>

        <input
          type="month"
          value={`${filters.year}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}`}
          onChange={(e) => {
            const [year, month] = e.target.value.split("-");
            setFilters((prev) => ({ ...prev, year }));
            setDate(new Date(Number(year), Number(month) - 1, 1));
          }}
        />

        <button
          type="button"
          onClick={loadEvents}
          className="btn-pill btn-filter"
        >
          Apply Filters
        </button>
      </div>

      <div className="calendar-layout">
        <div className="calendar-pane">
          <Calendar
            onChange={setDate}
            value={date}
            tileContent={tileContent}
            tileClassName={tileClassName}
          />

          {/* Legend */}
          <div className="calendar-legend">
            <div className="legend-item">
              <span className="legend-dot legend-dot-holiday" />
              <span>Official holiday</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot legend-dot-personal" />
              <span>Personal events</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot legend-dot-global" />
              <span>Global events</span>
            </div>
          </div>
        </div>

        <div className="events-pane">
          <h3>
            {date.toLocaleDateString("en-IN")} ({selectedEvents.length} events)
          </h3>
          {loading ? (
            <div>Loading...</div>
          ) : selectedEvents.length === 0 ? (
            <div>No events today</div>
          ) : (
            <div className="events-list">
              {selectedEvents.map((event) => (
                <div
                  key={event._id}
                  className={`event-card ${
                    event.isGlobal
                      ? event.type === "holiday"
                        ? "holiday" // only global holidays → red
                        : "global" // other global events → purple
                      : "personal" // all personal events, even holiday → blue
                  }`}
                >
                  <div className="event-header">
                    {event.isGlobal ? "🌐" : "👤"}{" "}
                    <span className="event-title">{event.title}</span>
                    <span className="event-type-chip">{event.type}</span>
                  </div>

                  <div className="event-meta">
                    <span className="event-time-chip">
                      {formatTimeRange(event.start, event.end)}
                    </span>
                    {event.dept && (
                      <span className="event-dept-chip">
                        📚 {event.dept}
                      </span>
                    )}
                    {event.location && (
                      <span className="event-location-chip">
                        📍 {event.location}
                      </span>
                    )}
                  </div>

                  {((isFaculty && event.isGlobal) || !event.isGlobal) && (
                    <div className="event-actions">
                      <button
                        className="btn-pill"
                        onClick={() => {
                          setFormError("");
                          setEditingEvent({
                            ...event,
                            yearScope: event.year || "All Years",
                          });
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-pill btn-outline"
                        onClick={() => handleDeleteEvent(event._id)}
                      >
                        Delete
                      </button>
                      {event.isGlobal && isFaculty && (
                        <button
                          className="btn-pill btn-outline"
                          onClick={() => handleMakePersonal(event._id)}
                        >
                          Make Personal
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && editingEvent && (
        <div className="event-form-modal">
          <div className="event-form">
            <h3>
              {editingEvent._id
                ? "Edit Event"
                : editingEvent.isGlobal
                ? "New Global Event"
                : "New Personal Event"}
            </h3>

            <input
              type="text"
              placeholder="Title"
              value={editingEvent.title || ""}
              onChange={(e) =>
                setEditingEvent((prev) => ({ ...prev, title: e.target.value }))
              }
            />

            <input
              type="datetime-local"
              value={formatForInput(editingEvent.start)}
              onChange={(e) =>
                setEditingEvent((prev) => ({
                  ...prev,
                  start: new Date(e.target.value),
                }))
              }
            />

            <input
              type="datetime-local"
              value={formatForInput(editingEvent.end)}
              onChange={(e) =>
                setEditingEvent((prev) => ({
                  ...prev,
                  end: new Date(e.target.value),
                }))
              }
            />

            <select
              value={editingEvent.type || ""}
              onChange={(e) =>
                setEditingEvent((prev) => ({
                  ...prev,
                  type: e.target.value,
                }))
              }
            >
              <option value="exam">Exam</option>
              <option value="class">Class</option>
              <option value="assignment">Assignment</option>
              <option value="holiday">Holiday</option>
              <option value="workshop">Workshop</option>
              <option value="meeting">Meeting</option>
              <option value="placement">Placement Drive</option>
              <option value="event">Event</option>
              <option value="other">Other</option>
            </select>

            <select
              value={editingEvent.dept || ""}
              onChange={(e) =>
                setEditingEvent((prev) => ({
                  ...prev,
                  dept: e.target.value,
                }))
              }
            >
              <option value="">All Departments</option>
              <option value="ECE">ECE</option>
              <option value="CSE">CSE</option>
              <option value="Civil">Civil</option>
              <option value="Mechanical">Mechanical</option>
              <option value="AI">AI</option>
            </select>

            <select
              value={editingEvent.yearScope || "All Years"}
              onChange={(e) =>
                setEditingEvent((prev) => ({
                  ...prev,
                  yearScope: e.target.value,
                }))
              }
            >
              <option value="All Years">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>

            <input
              type="text"
              placeholder="Location (e.g. Campus)"
              value={editingEvent.location || ""}
              onChange={(e) =>
                setEditingEvent((prev) => ({
                  ...prev,
                  location: e.target.value,
                }))
              }
            />

            {formError && (
              <p style={{ color: "red", marginTop: "8px" }}>{formError}</p>
            )}

            <div className="form-actions">
              <button
                className="btn-pill"
                type="button"
                onClick={handleSaveEvent}
              >
                Save
              </button>
              <button
                className="btn-pill btn-outline"
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingEvent(null);
                  setFormError("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
