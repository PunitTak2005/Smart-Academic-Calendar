// src/routes/events.js
// ✅ FINAL MERGED ESM ROUTER - Smart Academic Calendar
// Global + personal events, student dept/year filtering, /mine route, make-personal, full CRUD, role checks

import express from "express";
import auth from "../middleware/auth.js";
import Event from "../models/Event.js";

const router = express.Router();

// ========================
// LIST & CREATE ROUTES
// ========================

/**
 * GET /api/events
 * Returns global events + user's personal events
 * (students: also non-global events for their dept/year)
 */
router.get("/", auth, async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const { role, dept, year } = req.user;

    const query = {
      $or: [
        { isGlobal: true },       // all global events
        { createdBy: userId },    // my personal events
      ],
    };

    // Student-specific filtering for non-global events
    if (role === "student") {
      query.$or.push({ dept, year });
    }

    const events = await Event.find(query).sort({ start: 1 });

    return res.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("❌ Failed to list events:", error);
    return res.status(500).json({
      success: false,
      message: "Server error loading events",
    });
  }
});

/**
 * POST /api/events
 * Create event (personal by default; faculty can set global)
 */
router.post("/", auth, async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const isFaculty = req.user?.role === "faculty" || req.user?.isFaculty;

    const {
      title,
      start,
      end,
      type,
      dept,
      year,
      location,
      description,
      isReminder,
      color,
      isGlobal,
    } = req.body;

    if (!title || !start || !end) {
      return res.status(400).json({
        success: false,
        message: "Title, start, and end required",
      });
    }

    if (isGlobal && !isFaculty) {
      return res.status(403).json({
        success: false,
        message: "Only faculty create global events",
      });
    }

    const event = new Event({
      title,
      start,
      end,
      type: type || "meeting",
      dept: dept || "",
      year: year || "All Years",
      location: location || "",
      description: description || "",
      isReminder: !!isReminder,
      color,
      isGlobal: isFaculty && !!isGlobal,
      createdBy: userId,
    });

    const saved = await event.save();

    return res.status(201).json({
      success: true,
      message: "Event created",
      event: saved,
    });
  } catch (error) {
    console.error("❌ Create event failed:", error);
    return res.status(500).json({
      success: false,
      message: "Server error creating event",
    });
  }
});

// ========================
// MY EVENTS ROUTE
// ========================

/**
 * GET /api/events/mine
 * User's personal events only (createdBy = me)
 */
router.get("/mine", auth, async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const events = await Event.find({ createdBy: userId }).sort({ start: 1 });

    return res.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("❌ My events failed:", error);
    return res.status(500).json({
      success: false,
      message: "Server error loading your events",
    });
  }
});

// ========================
// UPDATE & DELETE ROUTES
// ========================

/**
 * PUT /api/events/:id
 * Edit with ownership/role checks
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    const userId = (req.user._id || req.user.id).toString();
    const isOwner = event.createdBy?.toString() === userId;
    const isFaculty = req.user?.role === "faculty" || req.user?.isFaculty;

    if (event.isGlobal && !isFaculty) {
      return res.status(403).json({
        success: false,
        message: "Only faculty edit global events",
      });
    }
    if (!event.isGlobal && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Cannot edit this event",
      });
    }

    // Partial updates (ignore direct isGlobal changes here)
    const updates = req.body;
    Object.keys(updates).forEach((key) => {
      if (key !== "isGlobal" && event[key] !== undefined) {
        event[key] = updates[key];
      }
    });

    // Safe isGlobal upgrade: personal -> global (faculty only)
    if (!event.isGlobal && updates.isGlobal && isFaculty) {
      event.isGlobal = true;
    }

    const updated = await event.save();
    return res.json({
      success: true,
      message: "Event updated",
      event: updated,
    });
  } catch (error) {
    console.error("❌ Update failed:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating event",
    });
  }
});

/**
 * DELETE /api/events/:id
 * Delete with ownership/role checks
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    const userId = (req.user._id || req.user.id).toString();
    const isOwner = event.createdBy?.toString() === userId;
    const isFaculty = req.user?.role === "faculty" || req.user?.isFaculty;

    if (event.isGlobal && !isFaculty) {
      return res.status(403).json({
        success: false,
        message: "Only faculty delete global events",
      });
    }
    if (!event.isGlobal && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Cannot delete this event",
      });
    }

    await event.deleteOne();
    return res.json({
      success: true,
      message: "Event deleted",
    });
  } catch (error) {
    console.error("❌ Delete failed:", error);
    return res.status(500).json({
      success: false,
      message: "Server error deleting event",
    });
  }
});

// ========================
// MAKE PERSONAL COPY
// ========================

/**
 * POST /api/events/:id/make-personal
 * Copy global event to user's personal list
 */
router.post("/:id/make-personal", auth, async (req, res) => {
  try {
    const globalEvent = await Event.findById(req.params.id);
    if (!globalEvent || !globalEvent.isGlobal) {
      return res.status(404).json({
        success: false,
        message: "Global event not found",
      });
    }

    const userId = (req.user._id || req.user.id).toString();

    const personalCopy = new Event({
      ...globalEvent.toObject(),
      _id: undefined, // new document
      isGlobal: false,
      isReminder: true,
      createdBy: userId,
    });

    const saved = await personalCopy.save();
    return res.status(201).json({
      success: true,
      message: "Personal copy created",
      event: saved,
    });
  } catch (error) {
    console.error("❌ Make personal failed:", error);
    return res.status(500).json({
      success: false,
      message: "Server error creating personal copy",
    });
  }
});

export default router;
