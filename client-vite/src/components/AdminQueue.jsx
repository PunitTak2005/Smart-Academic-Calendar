// src/components/AdminQueue.jsx
import React, { useEffect, useState } from "react";
import "./AdminQueue.css"; // ✅ Custom styling hook bound cleanly

const AdminQueue = ({ token }) => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Fetch all pending faculty requests from your backend endpoint
  const fetchPendingQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/auth/pending-faculty", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch pending queue.");

      setPendingUsers(data.data || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPendingQueue();
  }, [token]);

  // Handle Approve / Reject click events
  const handleAction = async (id, actionType) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`http://localhost:5000/api/auth/approve-faculty/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: actionType }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not complete action.");

      // Cleanly remove the processed user record from the UI state instantly
      setPendingUsers((prev) => prev.filter((user) => user.id !== id));
    } catch (err) {
      alert(`Error processing request: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return <div className="queue-container" style={{ padding: "2rem", color: "#6b7280" }}>Loading request queue...</div>;
  }

  if (error) {
    return <div className="queue-container" style={{ padding: "2rem", color: "#dc2626" }}>⚠️ Error: {error}</div>;
  }

  return (
    <div className="queue-container">
      <div className="queue-header">
        <div>
          <h2 className="queue-title">Faculty Approvals Queue</h2>
          <p className="queue-subtitle">
            Review and authorize access privileges for new faculty registrations.
          </p>
        </div>
        <span className="queue-badge">
          {pendingUsers.length} Pending Actions
        </span>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="queue-empty-state">
          No registrations currently pending review.
        </div>
      ) : (
        <div className="queue-table-wrapper">
          <table className="queue-table">
            <thead>
              <tr>
                <th className="queue-th">Full Name</th>
                <th className="queue-th">Email Address</th>
                <th className="queue-th">Department</th>
                <th className="queue-th">Designation</th>
                <th className="queue-th" style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((user) => (
                <tr key={user.id} className="queue-tr">
                  <td className="queue-td queue-td-name">{user.name}</td>
                  <td className="queue-td queue-td-email">{user.email}</td>
                  <td className="queue-td">
                    <span className="queue-dept-tag">
                      {user.dept}
                    </span>
                  </td>
                  <td className="queue-td queue-td-designation">{user.designation || "N/A"}</td>
                  <td className="queue-td queue-actions-cell">
                    <div className="queue-actions-group">
                      <button
                        onClick={() => handleAction(user.id, "approve")}
                        disabled={actionLoadingId !== null}
                        className="btn-approve"
                      >
                        {actionLoadingId === user.id ? "..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleAction(user.id, "reject")}
                        disabled={actionLoadingId !== null}
                        className="btn-reject"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminQueue;