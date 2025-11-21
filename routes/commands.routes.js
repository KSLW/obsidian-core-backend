// backend/routes/commands.routes.js
const express = require("express");
const router = express.Router();

// Temporary in-memory store.
// Replace with a DB later (NeDB, Mongo, JSON, etc.)
let commands = [];

// GET /api/commands
router.get("/commands", (req, res) => {
  res.json(commands);
});

// POST /api/commands
router.post("/commands", (req, res) => {
  const { name, trigger, response, enabled } = req.body;

  const newCommand = {
    _id: Date.now().toString(),
    name: name || "New Command",
    trigger: trigger || "!example",
    response: response || "",
    enabled: enabled !== undefined ? enabled : true,
  };

  commands.push(newCommand);
  res.status(201).json(newCommand);
});

// PUT /api/commands/:id
router.put("/commands/:id", (req, res) => {
  const { id } = req.params;
  const idx = commands.findIndex((c) => c._id === id);

  if (idx === -1) {
    return res.status(404).json({ error: "Command not found" });
  }

  commands[idx] = { ...commands[idx], ...req.body };
  res.json(commands[idx]);
});

// DELETE /api/commands/:id
router.delete("/commands/:id", (req, res) => {
  const { id } = req.params;
  const idx = commands.findIndex((c) => c._id === id);

  if (idx === -1) {
    return res.status(404).json({ error: "Command not found" });
  }

  const [removed] = commands.splice(idx, 1);
  res.json(removed);
});

module.exports = router;
