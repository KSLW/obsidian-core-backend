import express from "express";
import { Automation } from "../models/Automation.js";

const router = express.Router();

// list
router.get("/:streamerId", async (req, res) => {
  const list = await Automation.find({ streamerId: req.params.streamerId }).sort({ createdAt: -1 });
  res.json(list);
});

// create
router.post("/", async (req, res) => {
  const doc = await Automation.create(req.body);
  res.status(201).json(doc);
});

// update
router.put("/:id", async (req, res) => {
  await Automation.updateOne({ _id: req.params.id }, { $set: req.body });
  const updated = await Automation.findById(req.params.id);
  res.json(updated);
});

// delete
router.delete("/:id", async (req, res) => {
  await Automation.deleteOne({ _id: req.params.id });
  res.status(204).end();
});

export default router;
