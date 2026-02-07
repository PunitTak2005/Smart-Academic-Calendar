// src/pages/CalendarPage.jsx
import React from "react";
import CalendarView from "../components/CalendarView";
import "./CalendarPage.css";

const CalendarPage = ({ user, token, onEventsChange }) => {
  const handleEventsChange = (summary) => {
    if (onEventsChange) onEventsChange(summary);
  };

  const handlePersonalEventAdded = (event) => {
    console.log("New personal event added:", event);
  };

  return (
    <div className="calendar-page">
      <div className="page-header">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          📅 Smart Academic Calendar
        </h1>
        <p className="text-gray-600 mb-8">
          View and manage your academic events, exams, classes, and deadlines.
        </p>
      </div>

      <CalendarView
        user={user}
        token={token}
        onEventsChange={handleEventsChange}
        onPersonalEventAdded={handlePersonalEventAdded}
      />
    </div>
  );
};

export default CalendarPage;
