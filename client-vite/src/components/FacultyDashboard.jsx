import React, { useState, useEffect } from "react";
import axios from "axios";
import "./FacultyDashboard.css"; // Containing our custom layout overrides and footer styling

const API_BASE_URL = "http://localhost:5000/api";

const FacultyDashboard = ({ token }) => {
  const [facultyData, setFacultyData] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for creating a new academic event/class notification
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    department: "",
    semester: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        // Fetching faculty profile information
        const profileRes = await axios.get(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFacultyData(profileRes.data.user || profileRes.data);

        // Fetching the relevant academic calendar/schedule items for this faculty
        const scheduleRes = await axios.get(`${API_BASE_URL}/calendar/faculty-schedule`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSchedule(scheduleRes.data.events || scheduleRes.data || []);
        
        setError("");
      } catch (err) {
        console.error("Dashboard loading failed:", err);
        setError(err.response?.data?.message || "Failed to sync dashboard metrics.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await axios.post(`${API_BASE_URL}/calendar/events`, newEvent, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setSuccessMsg("Academic event posted to calendar successfully!");
      // Add the newly created event directly to the UI schedule list
      setSchedule((prev) => [res.data.event || res.data, ...prev]);
      
      // Clear form
      setNewEvent({ title: "", description: "", date: "", time: "", department: "", semester: "" });
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Failed to add event:", err);
      setError(err.response?.data?.message || "Could not publish calendar updates.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return <div className="p-6 text-center text-gray-500">Access denied. Please authenticate to view your portal.</div>;
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500 font-medium">Synchronizing Faculty Portal...</div>;
  }

  return (
    <div className="faculty-dashboard-container bg-gray-50">
      {/* Scrollable Content Wrapper */}
      <div className="p-6 max-w-7xl mx-auto space-y-6 w-full">
        
        {/* Upper Welcome Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 profile-card">
          <div>
            <h1 className="text-2xl font-bold">Faculty Portal</h1>
            <p className="text-purple-100 mt-1">Welcome back, {facultyData?.name || "Professor"}</p>
          </div>
          <div className="text-right md:text-right bg-white/10 p-3 rounded-lg backdrop-blur-sm text-sm">
            <div><span className="font-semibold">Dept:</span> {facultyData?.dept || facultyData?.department || "Not Configured"}</div>
            <div><span className="font-semibold">Email:</span> {facultyData?.email}</div>
          </div>
        </div>

        {/* Error & Success Messages */}
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">⚠️ {error}</div>}
        {successMsg && <div className="p-3 bg-green-50 border border-green-200 text-green-600 rounded-xl text-sm">✅ {successMsg}</div>}

        {/* Main Grid: Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Schedule Overview & Statistics */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 profile-card">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Today's Sessions</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">{schedule.length} Tasks</h3>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 profile-card">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Role Designation</p>
                <h3 className="text-lg font-semibold text-purple-700 mt-2 capitalize">{facultyData?.role || "Faculty"}</h3>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 profile-card">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Academic Term</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">2026 Regular</h3>
              </div>
            </div>

            {/* Current Academic Agenda/Schedule */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 profile-card">
              <h2 className="text-lg font-bold text-gray-800 mb-4">My Academic Agenda</h2>
              
              {schedule.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No upcoming events or class lectures assigned on your roster.</p>
              ) : (
                <div className="space-y-3">
                  {schedule.map((item, idx) => (
                    <div key={item._id || idx} className="flex items-start justify-between p-3 rounded-lg border border-gray-50 bg-gray-50/50 hover:bg-gray-50 transition">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-gray-800 text-sm">{item.title}</h4>
                        <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                        <div className="flex gap-3 text-[11px] text-gray-400 font-medium pt-1">
                          <span>Target Sem: {item.semester || "All"}</span>
                          <span>Dept: {item.department || "All"}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
                          {item.time || "TBD"}
                        </span>
                        <p className="text-[11px] text-gray-400 mt-1">{item.date ? new Date(item.date).toLocaleDateString() : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Manage Calendar / Post Event Updates */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 h-fit profile-card">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Schedule Operations</h2>
            <p className="text-xs text-gray-400 mb-4">Broadcast class adjustments, deadlines, or schedules directly to student timelines.</p>
            
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500">Event/Class Title</label>
                <input
                  type="text"
                  name="title"
                  value={newEvent.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Extra Lecture - Operating Systems"
                  className="w-full mt-1 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500">Detailed Description</label>
                <textarea
                  name="description"
                  value={newEvent.description}
                  onChange={handleInputChange}
                  placeholder="Provide details or syllabus goals..."
                  className="w-full mt-1 border border-gray-200 rounded-lg p-2 text-sm h-20 resize-none focus:outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={newEvent.date}
                    onChange={handleInputChange}
                    className="w-full mt-1 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:border-purple-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500">Time slot</label>
                  <input
                    type="text"
                    name="time"
                    value={newEvent.time}
                    onChange={handleInputChange}
                    placeholder="e.g., 10:30 AM"
                    className="w-full mt-1 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:border-purple-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500">Target Dept</label>
                  <select
                    name="department"
                    value={newEvent.department}
                    onChange={handleInputChange}
                    className="w-full mt-1 border border-gray-200 rounded-lg p-2 text-sm bg-white focus:outline-none focus:border-purple-600"
                    required
                  >
                    <option value="">Select Dept</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500">Semester/Year</label>
                  <select
                    name="semester"
                    value={newEvent.semester}
                    onChange={handleInputChange}
                    className="w-full mt-1 border border-gray-200 rounded-lg p-2 text-sm bg-white focus:outline-none focus:border-purple-600"
                    required
                  >
                    <option value="">Select Sem</option>
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white font-medium p-2.5 rounded-lg text-sm shadow-sm transition"
              >
                {submitting ? "Publishing Update..." : "Publish to Smart Calendar"}
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* Centered Designer Branding Footer */}
      <footer className="designer-footer">
        <div className="designer-badge">
          <span className="designer-text">
            Designed with ♥ by <span className="designer-name">Engineers Portal</span>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default FacultyDashboard;