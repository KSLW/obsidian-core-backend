const express = require("express");
const router = express.Router();
const Command = require("../models/Command");

// GET ALL COMMANDS
router.get("/", async (req, res) => {
  try {
    const commands = await Command.find().sort({ name: 1 });
    res.json(commands);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch commands." });
  }
});

// CREATE NEW COMMAND
router.post("/", async (req, res) => {
  try {
    const cmd = new Command(req.body);
    await cmd.save();
    res.json(cmd);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE COMMAND
router.put("/:id", async (req, res) => {
  try {
    const updated = await Command.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE COMMAND
router.delete("/:id", async (req, res) => {
  try {
    await Command.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete command." });
  }
});

module.exports = router;
