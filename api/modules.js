const express = require("express");
const router = express.Router();

// Temporary in-memory modules list
// Eventually this will load from DB or filesystem
let modules = [
  { id: "logger", name: "Logger", description: "Logs events", enabled: true },
  { id: "welcome", name: "Welcome", description: "Sends a welcome message", enabled: true }
];

// GET /api/modules
router.get("/", (req, res) => {
  res.json(modules);
});

// PATCH /api/modules/:id/toggle
router.patch("/:id/toggle", (req, res) => {
  const id = req.params.id;
  const mod = modules.find((m) => m.id === id);

  if (!mod) return res.status(404).json({ error: "Module not found" });

  mod.enabled = !mod.enabled;

  res.json({ success: true, module: mod });
});

module.exports = router;
