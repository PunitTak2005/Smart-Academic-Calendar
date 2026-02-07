// src/models/Event.js
// ✅ FINAL MERGED MODEL - Smart Academic Calendar (Techno NJR Institute)
// ESM syntax, full enums, indexes, validation, clean JSON output

import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"] },

    start: { type: Date, required: [true, "Start date is required"] },
    end: { type: Date, required: [true, "End date is required"] },

    // Event types matching frontend dropdown
    type: {
      type: String,
      enum: [
        "exam",
        "class",
        "assignment",
        "holiday",
        "workshop",
        "meeting",
        "placement",
        "event",
        "other",
      ],
      default: "other",
    },

    // Department filter (exact match to college dropdowns)
    dept: {
      type: String,
      enum: [
        "",
        "CSE",
        "ECE",
        "Civil",
        "Mechanical",
        "AI",
        "EE",
        "Basic Sciences",
      ],
      default: "",
    },

    // Year scope (matches Dashboard yearScope + batch years)
    year: {
      type: String,
      enum: [
        "All Years",
        "1st Year",
        "2nd Year",
        "3rd Year",
        "4th Year",
        "2023",
        "2024",
        "2025",
        "2026",
        "2027",
      ],
      default: "All Years",
    },

    location: { type: String, default: "", trim: true },

    // Core flags for faculty/student dashboard logic
    isGlobal: { type: Boolean, default: false }, // campus-wide vs personal
    isReminder: { type: Boolean, default: false }, // reminder events

    // Ownership tracking
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator required"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Indexes for fast dashboard queries
eventSchema.index({ start: 1, year: 1, dept: 1 });
eventSchema.index({ isGlobal: 1, createdBy: 1 });
eventSchema.index({ type: 1, dept: 1 });

const Event = mongoose.model("Event", eventSchema);
export default Event;
