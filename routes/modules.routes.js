// backend/routes/modules.routes.js
const express = require("express");
const router = express.Router();

// Example built-in modules. You can edit this list to match Obsidian.
let modules = [
  {
    _id: "twitch-core",
    name: "Twitch Core",
    description: "Base Twitch connectivity and chat handling.",
    enabled: true,
  },
  {
    _id: "discord-core",
    name: "Discord Core",
    description: "Base Discord connectivity and commands.",
    enabled: false,
  },
  {
    _id: "ai-responder",
    name: "AI Responder",
    description: "Experimental AI reply system.",
    enabled: false,
  },
];

// GET /api/modules
router.get("/modules", (req, res) => {
  res.json(modules);
});

// PUT /api/modules/:id
router.put("/modules/:id", (req, res) => {
  const { id } = req.params;
  const idx = modules.findIndex((m) => m._id === id);

  if (idx === -1) {
    return res.status(404).json({ error: "Module not found" });
  }

  modules[idx] = { ...modules[idx], ...req.body };
  res.json(modules[idx]);
});

module.exports = router;
