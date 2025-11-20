const express = require("express");
const router = express.Router();
const Event = require("../models/Event");

// GET ALL EVENTS
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ type: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch events." });
  }
});

// CREATE EVENT (usually not used except initial setup)
router.post("/", async (req, res) => {
  try {
    const evt = new Event(req.body);
    await evt.save();
    res.json(evt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE EVENT MESSAGE / SETTINGS
router.put("/:id", async (req, res) => {
  try {
    const updated = await Event.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE EVENT (rarely needed)
router.delete("/:id", async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete event." });
  }
});

module.exports = router;
