// src/routes/automations.js
import express from "express";
import { Automation } from "../models/Automation.js";

const router = express.Router();

/** Create */
router.post("/", async (req, res) => {
  try {
    const a = await Automation.create(req.body);
    res.status(201).json(a);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/** List (filter by streamerId optional) */
router.get("/", async (req, res) => {
  try {
    const { streamerId } = req.query;
    const q = streamerId ? { streamerId } : {};
    const items = await Automation.find(q).sort({ updatedAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Get one */
router.get("/:id", async (req, res) => {
  try {
    const item = await Automation.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/** Update */
router.patch("/:id", async (req, res) => {
  try {
    const updated = await Automation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/** Delete */
router.delete("/:id", async (req, res) => {
  try {
    const removed = await Automation.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
