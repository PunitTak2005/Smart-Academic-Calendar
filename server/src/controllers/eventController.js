// controllers/eventController.js
import Event from "../models/Event.js";

// POST /api/events/global
export const createGlobalEvent = async (req, res) => {
  try {
    if (req.user?.role !== "faculty" && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Only faculty and administrators can manage global events." });
    }

    const { title, start, end, type, dept = "", year = "", location = "", isReminder = false } = req.body;
    
    const event = await Event.create({
      title, start, end, type, dept, year, location, isReminder,
      isGlobal: true,
      owner: null,
    });
    
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/events/personal
export const createPersonalEvent = async (req, res) => {
  try {
    const { title, start, end, type, dept = "", year = "", location = "", isReminder = false } = req.body;
    
    const event = await Event.create({
      title, start, end, type, dept, year, location, isReminder,
      isGlobal: false,
      owner: req.user.id, 
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

    const isGlobalTrue = includeGlobal === "true";
    const isPersonalTrue = includePersonal === "true";

    // Build scope filters first
    const scopeFilters = [];
    if (isGlobalTrue) scopeFilters.push({ isGlobal: true });
    if (isPersonalTrue) scopeFilters.push({ isGlobal: false, owner: req.user.id });

    // If neither scope is requested, return early without hitting DB
    if (scopeFilters.length === 0) {
      return res.json({ global: [], personal: [], all: [] });
    }

    // Build institutional filters (dept, year) and type filters
    const filterConditions = [];
    if (type) filterConditions.push({ type });

    // Institutional scope logic: match specific department/year OR global fallback elements
    if (dept || year) {
      const institutionalMatch = {};
      if (dept) institutionalMatch.dept = dept;
      if (year) institutionalMatch.year = year;
      
      // Allow the criteria OR pass through if the event is global and blank/omitted
      filterConditions.push({
        $or: [
          institutionalMatch,
          { isGlobal: true, dept: "", year: "" } 
        ]
      });
    }

    // Combine scope filters ($or) and metadata criteria into an $and clause
    const finalQuery = {
      $and: [
        { $or: scopeFilters },
        ...(filterConditions.length > 0 ? filterConditions : [])
      ]
    };

    const allEvents = await Event.find(finalQuery);

    // Partition the results in memory
    const global = [];
    const personal = [];

    for (const event of allEvents) {
      if (event.isGlobal) {
        global.push(event);
      } else {
        personal.push(event);
      }
    }

    res.json({ global, personal, all: allEvents });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/events/:id
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Authorization guards
    if (event.isGlobal) {
      if (req.user?.role !== "faculty" && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Only faculty and administrators can modify global events." });
      }
    } else {
      if (event.owner?.toString() !== req.user.id?.toString() && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. You do not own this personal event." });
      }
    }

    // Prevent malicious data mutations via req.body injection
    const { isGlobal, owner, ...allowedUpdates } = req.body;

    const updated = await Event.findByIdAndUpdate(
      req.params.id, 
      allowedUpdates, 
      { new: true, runValidators: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/events/:id
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Authorization guards
    if (event.isGlobal) {
      if (req.user?.role !== "faculty" && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Only faculty and administrators can delete global events." });
      }
    } else {
      if (event.owner?.toString() !== req.user.id?.toString() && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. You do not own this personal event." });
      }
    }

    await Event.findByIdAndDelete(req.params.id);
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
      owner: req.user.id, 
      isReminder: true,
    });

    res.status(201).json(copy);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};