const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");

// GET settings
router.get("/", async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Failed to load settings." });
  }
});

// UPDATE settings
router.put("/", async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    Object.assign(settings, req.body, { updatedAt: Date.now() });
    await settings.save();

    res.json(settings);
  } catch (err) {
    res.status(400).json({ error: "Failed to update settings." });
  }
});

module.exports = router;
