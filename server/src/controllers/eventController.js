// controllers/eventController.js
import Event from "../models/Event.js";

// POST /api/events/global
export const createGlobalEvent = async (req, res) => {
  try {
    const body = req.body;
    const event = await Event.create({
      title: body.title,
      start: body.start,
      end: body.end,
      type: body.type,
      dept: body.dept || "",
      year: body.year || "",
      location: body.location || "",
      isGlobal: true,
      owner: null,
      isReminder: body.isReminder || false,
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/events/personal
export const createPersonalEvent = async (req, res) => {
  try {
    const body = req.body;
    const event = await Event.create({
      title: body.title,
      start: body.start,
      end: body.end,
      type: body.type,
      dept: body.dept || "",
      year: body.year || "",
      location: body.location || "",
      isGlobal: false,
      owner: req.user._id,
      isReminder: body.isReminder || false,
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/events/dashboard?dept=&type=&year=&includeGlobal=&includePersonal=
export const getDashboardEvents = async (req, res) => {
  try {
    const { dept, type, year, includeGlobal, includePersonal } = req.query;

    const baseFilter = {};
    if (dept) baseFilter.dept = dept;
    if (type) baseFilter.type = type;
    if (year) baseFilter.year = year;

    const queries = [];

    if (includeGlobal === "true" || includeGlobal === true) {
      queries.push(Event.find({ ...baseFilter, isGlobal: true }));
    }
    if (includePersonal === "true" || includePersonal === true) {
      queries.push(
        Event.find({ ...baseFilter, isGlobal: false, owner: req.user._id })
      );
    }

    const [global = [], personal = []] = await Promise.all(queries);

    const all = [...global, ...personal];
    res.json({ global, personal, all });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/events/:id
export const updateEvent = async (req, res) => {
  try {
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Event not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/events/:id
export const deleteEvent = async (req, res) => {
  try {
    const deleted = await Event.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/events/:id/make-personal
export const makePersonalCopy = async (req, res) => {
  try {
    const base = await Event.findById(req.params.id);
    if (!base || !base.isGlobal) {
      return res.status(404).json({ message: "Global event not found" });
    }

    const copy = await Event.create({
      title: base.title,
      start: base.start,
      end: base.end,
      type: base.type,
      dept: base.dept,
      year: base.year,
      location: base.location,
      isGlobal: false,
      owner: req.user._id,
      isReminder: true, // or copy base.isReminder
    });

    res.status(201).json(copy);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
