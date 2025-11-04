import express from "express";
import { Streamer } from "../models/Streamer.js";
import { Command } from "../models/Command.js";
import { Automation } from "../models/Automation.js";
import { setCommands, setAutomations } from "../core/registry.js";

const router = express.Router();

/* Commands CRUD */
router.get("/commands", async (_req, res) => {
  const s = await mostRecentStreamer();
  const list = await Command.find({ streamerId: s?._id });
  res.json(list || []);
});

router.post("/commands", async (req, res) => {
  const s = await mostRecentStreamer();
  const doc = await Command.create({ ...req.body, streamerId: s?._id });
  const enabled = await Command.find({ streamerId: s?._id, enabled: true });
  setCommands(s?._id, enabled);
  res.json(doc);
});

router.put("/commands/:id", async (req, res) => {
  const s = await mostRecentStreamer();
  const updated = await Command.update(req.params.id, req.body);
  const enabled = await Command.find({ streamerId: s?._id, enabled: true });
  setCommands(s?._id, enabled);
  res.json(updated);
});

router.delete("/commands/:id", async (req, res) => {
  const s = await mostRecentStreamer();
  const out = await Command.remove(req.params.id);
  const enabled = await Command.find({ streamerId: s?._id, enabled: true });
  setCommands(s?._id, enabled);
  res.json({ ok: true, removed: out });
});

/* Automations CRUD */
router.get("/automations", async (_req, res) => {
  const s = await mostRecentStreamer();
  const list = await Automation.find({ streamerId: s?._id });
  res.json(list || []);
});

router.post("/automations", async (req, res) => {
  const s = await mostRecentStreamer();
  const doc = await Automation.create({ ...req.body, streamerId: s?._id });
  const enabled = await Automation.find({ streamerId: s?._id, enabled: true });
  setAutomations(s?._id, enabled);
  res.json(doc);
});

router.put("/automations/:id", async (req, res) => {
  const s = await mostRecentStreamer();
  const updated = await Automation.update(req.params.id, req.body);
  const enabled = await Automation.find({ streamerId: s?._id, enabled: true });
  setAutomations(s?._id, enabled);
  res.json(updated);
});

router.delete("/automations/:id", async (req, res) => {
  const s = await mostRecentStreamer();
  const out = await Automation.remove(req.params.id);
  const enabled = await Automation.find({ streamerId: s?._id, enabled: true });
  setAutomations(s?._id, enabled);
  res.json({ ok: true, removed: out });
});

async function mostRecentStreamer() {
  const all = await Streamer.find({});
  if (!all?.length) return null;
  return all.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
}

export default router;
