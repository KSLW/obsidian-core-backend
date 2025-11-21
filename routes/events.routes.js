// backend/routes/events.routes.js
const express = require("express");
const router = express.Router();

// In-memory events
let events = [];

// GET /api/events
router.get("/events", (req, res) => {
  res.json(events);
});

// PUT /api/events/:id
router.put("/events/:id", (req, res) => {
  const { id } = req.params;
  const idx = events.findIndex((e) => e._id === id);

  if (idx === -1) {
    return res.status(404).json({ error: "Event not found" });
  }

  events[idx] = { ...events[idx], ...req.body };
  res.json(events[idx]);
});

module.exports = router;
