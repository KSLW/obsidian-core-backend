const router = require("express").Router();
const Command = require("../models/Command");

// GET all
router.get("/", async (req, res) => {
  const cmds = await Command.find().sort({ createdAt: -1 });
  res.json(cmds);
});

// CREATE
router.post("/", async (req, res) => {
  const cmd = await Command.create(req.body);
  res.json(cmd);
});

// UPDATE
router.put("/:id", async (req, res) => {
  const cmd = await Command.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  });
  res.json(cmd);
});

// DELETE
router.delete("/:id", async (req, res) => {
  await Command.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
