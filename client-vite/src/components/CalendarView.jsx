import React, { useState, useEffect, useMemo } from "react";
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
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatTimeRange = (start, end) => {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  if (s.getHours() === e.getHours() && s.getMinutes() === e.getMinutes()) {
    return "All day";
  }
  const opts = { hour: "2-digit", minute: "2-digit" };
  return `${s.toLocaleTimeString([], opts)} – ${e.toLocaleTimeString([], opts)}`;
};

const CalendarView = ({
  user,
  token,
  onEventsChange,
  onPersonalEventAdded,
}) => {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState({ global: [], personal: [] });

  const [filters, setFilters] = useState({
    dept: "All Departments", 
    type: "",
    yearScope: "", 
    location: "",  
    calendarYear: new Date().getFullYear().toString(),
  });

  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [formError, setFormError] = useState("");

  const isFaculty = user?.role === "faculty";
  const isAdmin = user?.role === "admin";
  const canManageGlobal = isFaculty || isAdmin;

  // Memoize flat array of all events to prevent unnecessary downstream recalculations
  const allEvents = useMemo(() => {
    return [...events.global, ...events.personal];
  }, [events]);

  // =========================
  // LOAD EVENTS
  // =========================
  const loadEvents = async () => {
    if (!token) {
      setEvents({ global: [], personal: [] });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const all = res.data?.events || [];
      const global = all.filter((e) => e.isGlobal);
      const personal = all.filter((e) => !e.isGlobal);

      const nextEvents = { global, personal };
      setEvents(nextEvents);

      if (typeof onEventsChange === "function") {
        onEventsChange(nextEvents);
      }
    } catch (err) {
      console.error("Events load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchEvents = async () => {
      if (!mounted) return;
      await loadEvents();
    };
    fetchEvents();
    return () => { mounted = false; };
  }, [token]);

  // =========================
  // REMINDER ENGINE (POLLING)
  // =========================
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const upcoming = allEvents.filter((e) => {
        const start = new Date(e.start);
        const diff = start - now;
        // Remind if event starts between now and 5 minutes from now
        return diff > 0 && diff < 5 * 60 * 1000;
      });
      setReminders(upcoming);
    };

    // Run immediately when events update, then evaluate every 30 seconds
    checkReminders();
    const intervalId = setInterval(checkReminders, 30 * 1000);

    return () => clearInterval(intervalId);
  }, [allEvents]);

  // =========================
  // FILTERED DATA
  // =========================
  const filteredEvents = useMemo(() => {
    return allEvents.filter((e) => {
      if (filters.dept && filters.dept !== "All Departments") {
        const eventDept = !e.dept || e.dept === "" ? "All Departments" : e.dept;
        if (eventDept !== filters.dept) {
          return false;
        }
      }

      if (filters.type && e.type !== filters.type) {
        return false;
      }

      if (filters.yearScope) {
        const eventYearValue = e.year || e.yearScope;
        if (eventYearValue && eventYearValue !== filters.yearScope) {
          return false;
        }
      }

      if (filters.location?.trim()) {
        const eventLocationStr = e.location || "";
        if (!eventLocationStr.toLowerCase().includes(filters.location.toLowerCase().trim())) {
          return false;
        }
      }

      if (filters.calendarYear) {
        const eventYear = new Date(e.start).getFullYear().toString();
        if (eventYear !== filters.calendarYear) {
          return false;
        }
      }

      return true;
    });
  }, [allEvents, filters]);

  const selectedEvents = useMemo(() => {
    return filteredEvents.filter(
      (e) => new Date(e.start).toDateString() === date.toDateString()
    );
  }, [filteredEvents, date]);

  const applyFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // =========================
  // CALENDAR TILE CONTENT
  // =========================
  const tileContent = ({ date: tileDate, view }) => {
    if (view !== "month") return null;

    const dayEvents = filteredEvents.filter(
      (e) => new Date(e.start).toDateString() === tileDate.toDateString()
    );

    if (dayEvents.length === 0) return null;

    return (
      <div className="dot-container">
        {dayEvents.map((event, index) => {
          let bgColor = "#2563eb"; 
          if (event.isGlobal) {
            if (event.type === "holiday") {
              bgColor = "#ef4444"; 
            } else {
              bgColor = "#8b5cf6"; 
            }
          }
          const generatedKey = event._id
            ? `dot-${event._id}`
            : `dot-idx-${index}-${tileDate.getTime()}`;

          return (
            <span
              key={generatedKey}
              className={`dot ${
                event.isGlobal
                  ? event.type === "holiday"
                    ? "official"
                    : "global"
                  : "personal"
              }`}
              style={{ backgroundColor: bgColor }}
            />
          );
        })}
      </div>
    );
  };

  const tileClassName = ({ date: tileDate, view }) => {
    if (view !== "month") return "";
    const classes = [];
    if (tileDate.getDay() === 0) classes.push("sunday-day");

    const dayEvents = filteredEvents.filter(
      (e) => new Date(e.start).toDateString() === tileDate.toDateString()
    );

    if (dayEvents.length === 0) return classes.join(" ");

    if (dayEvents.some((e) => e.type === "holiday" && e.isGlobal)) {
      classes.push("holiday-day");
    }
    if (dayEvents.some((e) => e.isGlobal)) classes.push("global-day");
    if (dayEvents.some((e) => !e.isGlobal)) classes.push("personal-day");

    return classes.join(" ");
  };

  // =========================
  // OPEN FORMS
  // =========================
  const openGlobalForm = () => {
    const { start, end } = getDayDefaultTimes(date);
    setFormError("");
    setEditingEvent({
      _id: null,
      isGlobal: true,
      title: "",
      start: start.toISOString(),
      end: end.toISOString(),
      type: "exam",
      dept: "All Departments", 
      yearScope: "All Years",
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
      start: start.toISOString(),
      end: end.toISOString(),
      type: "assignment",
      dept: "All Departments", 
      yearScope: "All Years",
      location: "",
      isReminder: false,
    });
    setShowForm(true);
  };

  // =========================
  // SAVE EVENT
  // =========================
  const handleSaveEvent = async (e) => {
    if (e) e.preventDefault();
    if (!editingEvent || !token) return;

    if (
      !editingEvent.title?.trim() ||
      !editingEvent.start ||
      !editingEvent.end ||
      !editingEvent.type ||
      !editingEvent.yearScope ||
      (editingEvent.isGlobal && !editingEvent.location?.trim())
    ) {
      setFormError("Please fill in all core fields before saving.");
      return;
    }

    if (new Date(editingEvent.start) > new Date(editingEvent.end)) {
      setFormError("End date/time cannot be earlier than start date/time.");
      return;
    }

    if (editingEvent.type === "holiday" && isFaculty) {
      setFormError("Faculty members are not authorized to create or manage holidays.");
      return;
    }

    setFormError("");

    if (editingEvent.isGlobal && !canManageGlobal) {
      alert("Only faculty and administrators can create global events.");
      return;
    }

    try {
      const sanitizedDept = editingEvent.dept === "All Departments" ? "" : editingEvent.dept;

      const payload = {
        title: editingEvent.title.trim(),
        start: new Date(editingEvent.start).toISOString(),
        end: new Date(editingEvent.end).toISOString(),
        type: editingEvent.type,
        dept: sanitizedDept, 
        location: editingEvent.location ? editingEvent.location.trim() : "",
        year: editingEvent.yearScope,
        isGlobal: editingEvent.isGlobal,
        isReminder: editingEvent.isReminder,
      };

      const headers = { Authorization: `Bearer ${token}` };

      if (editingEvent._id) {
        await axios.put(`${API_BASE_URL}/events/${editingEvent._id}`, payload, { headers });
      } else {
        await axios.post(`${API_BASE_URL}/events`, payload, { headers });
        if (!editingEvent.isGlobal && typeof onPersonalEventAdded === "function") {
          onPersonalEventAdded(payload);
        }
      }

      setEditingEvent(null);
      setShowForm(false);
      await loadEvents();
    } catch (err) {
      console.error("Save event failed", err);
      if (err.response?.status === 403) {
        alert(err.response.data?.message || "Access denied.");
      } else {
        setFormError(err.response?.data?.message || "Failed to save event. Validation error.");
      }
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!token) return;
    const targetEvent = allEvents.find((e) => e._id === id);
    if (targetEvent?.type === "holiday" && isFaculty) {
      alert("Faculty members are not authorized to delete holidays.");
      return;
    }
    if (!window.confirm("Delete this event?")) return;

    try {
      await axios.delete(`${API_BASE_URL}/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadEvents();
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
      await loadEvents();
    } catch (err) {
      console.error("Make personal failed", err);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>
            Academic Calendar
            {user?.name ? ` - ${user.name}` : ""}
            {user?.role ? ` (${user.role})` : ""}
          </h1>
        </div>

        <div className="action-buttons">
          {canManageGlobal && (
            <button type="button" onClick={openGlobalForm} className="btn-pill">
              <span className="plus-icon">+</span>
              <span>Global Event</span>
            </button>
          )}

          <button type="button" onClick={openPersonalForm} className="btn-pill">
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
          {reminders.map((r) => {
            const timeDiff = Math.round((new Date(r.start) - Date.now()) / 60000);
            return (
              <div key={`rem-${r._id}`} className="reminder-item">
                ⏰ {r.title} in {Math.max(0, timeDiff)}min
              </div>
            );
          })}
        </div>
      )}

      <div className="filters-panel">
        <select
          value={filters.dept}
          onChange={(e) => applyFilter("dept", e.target.value)}
        >
          <option value="All Departments">All Departments</option>
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
          <option value="other">Other</option>
        </select>

        <select
          value={filters.yearScope}
          onChange={(e) => applyFilter("yearScope", e.target.value)}
        >
          <option value="">All Academic Years</option>
          <option value="All Years">All Years Batch</option>
          <option value="1st Year">1st Year</option>
          <option value="2nd Year">2nd Year</option>
          <option value="3rd Year">3rd Year</option>
          <option value="4th Year">4th Year</option>
        </select>

        <input
          type="text"
          placeholder="Search Location "
          value={filters.location}
          onChange={(e) => applyFilter("location", e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: "20px",
            border: "1px solid #ccc",
            outline: "none",
            fontSize: "14px",
            minWidth: "180px"
          }}
        />

        <input
          type="month"
          value={`${filters.calendarYear}-${String(date.getMonth() + 1).padStart(2, "0")}`}
          onChange={(e) => {
            if (!e.target.value) return;
            const [year, month] = e.target.value.split("-");
            setFilters((prev) => ({ ...prev, calendarYear: year }));
            setDate(new Date(Number(year), Number(month) - 1, 1));
          }}
        />

        <button type="button" onClick={loadEvents} className="btn-pill btn-filter">
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
          <div className="calendar-legend-container">
            <div className="legend-item">
              <span className="legend-dot official-dot"></span>
              <span className="legend-label">Official holiday</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot personal-dot"></span>
              <span className="legend-label">Personal events</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot global-dot"></span>
              <span className="legend-label">Global events</span>
            </div>
          </div>
        </div>

        <div className="events-pane">
          <h3>
            {date.toLocaleDateString("en-IN")} ({selectedEvents.length}{" "}
            {selectedEvents.length === 1 ? "event" : "events"})
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
                        ? "holiday"
                        : "global"
                      : "personal"
                  }`}
                >
                  <div className="event-header">
                    {event.isGlobal ? "🌐" : "👤"}
                    <span className="event-title">{event.title}</span>
                    <span className="event-type-chip">{event.type}</span>
                  </div>

                  <div className="event-meta">
                    <span className="event-time-chip">
                      {formatTimeRange(event.start, event.end)}
                    </span>
                    
                    {/* Fixed: Explicitly handles falling back to "All Departments" label */}
                    {event.dept === "" || event.dept === "All Departments" || !event.dept ? (
                      <span className="event-dept-chip" style={{ background: "#f3f4f6", color: "#4b5563", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "500" }}>
                        📚 All Departments
                      </span>
                    ) : (
                      <span className="event-dept-chip">📚 {event.dept}</span>
                    )}

                    {(event.year || event.yearScope) && (
                      <span className="event-year-chip" style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "500", marginLeft: "4px" }}>
                        🎓 {event.year || event.yearScope}
                      </span>
                    )}
                    {event.location && <span className="event-location-chip">📍 {event.location}</span>}
                  </div>

                  {((canManageGlobal && event.isGlobal) || !event.isGlobal) && (
                    <div className="event-actions">
                      <button
                        className="btn-pill"
                        onClick={() => {
                          setFormError("");
                          setEditingEvent({
                            ...event,
                            yearScope: event.year || event.yearScope || "All Years",
                            dept: !event.dept || event.dept === "" ? "All Departments" : event.dept,
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

                      {event.isGlobal && canManageGlobal && (
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
              onChange={(e) => setEditingEvent((prev) => ({ ...prev, title: e.target.value }))}
            />

            <input
              type="datetime-local"
              value={formatForInput(editingEvent.start)}
              onChange={(e) => setEditingEvent((prev) => ({ ...prev, start: e.target.value }))}
            />

            <input
              type="datetime-local"
              value={formatForInput(editingEvent.end)}
              onChange={(e) => setEditingEvent((prev) => ({ ...prev, end: e.target.value }))}
            />

            <select
              value={editingEvent.type || ""}
              onChange={(e) => setEditingEvent((prev) => ({ ...prev, type: e.target.value }))}
            >
              <option value="exam">Exam</option>
              <option value="class">Class</option>
              <option value="assignment">Assignment</option>
             {isAdmin && <option value="holiday">Holiday</option>}
              <option value="workshop">Workshop</option>
              <option value="meeting">Meeting</option>
              <option value="placement">Placement Drive</option>
              <option value="event">Event</option>
              <option value="other">Other</option>
            </select>

            <select
              value={editingEvent.dept || "All Departments"}
              onChange={(e) => setEditingEvent((prev) => ({ ...prev, dept: e.target.value }))}
            >
              <option value="All Departments">All Departments</option>
              <option value="ECE">ECE</option>
              <option value="CSE">CSE</option>
              <option value="Civil">Civil</option>
              <option value="Mechanical">Mechanical</option>
              <option value="AI">AI</option>
            </select>

            <select
              value={editingEvent.yearScope || "All Years"}
              onChange={(e) => setEditingEvent((prev) => ({ ...prev, yearScope: e.target.value }))}
            >
              <option value="All Years">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>

            <input
              type="text"
              placeholder="Location"
              value={editingEvent.location || ""}
              onChange={(e) => setEditingEvent((prev) => ({ ...prev, location: e.target.value }))}
            />

            {formError && (
              <p style={{ color: "red", marginTop: "8px", paddingLeft: "4px" }}>
                {formError}
              </p>
            )}

            <div className="form-actions">
              <button className="btn-pill" type="button" onClick={handleSaveEvent}>
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