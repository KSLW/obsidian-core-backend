const express = require("express");
const router = express.Router();
const Module = require("../models/Module");

// GET ALL MODULES
router.get("/", async (req, res) => {
  try {
    const modules = await Module.find().sort({ name: 1 });
    res.json(modules);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch modules." });
  }
});

// CREATE MODULE ENTRY (dashboard/admin only)
router.post("/", async (req, res) => {
  try {
    const mod = new Module(req.body);
    await mod.save();
    res.json(mod);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE MODULE (toggle, rename, edit description, etc)
router.put("/:id", async (req, res) => {
  try {
    const updated = await Module.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE MODULE
router.delete("/:id", async (req, res) => {
  try {
    await Module.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete module." });
  }
});

const moduleEngine = require("../engine/moduleEngine");

router.post("/reload", async (req, res) => {
  try {
    await moduleEngine.loadModules();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to reload modules." });
  }
});


module.exports = router;
