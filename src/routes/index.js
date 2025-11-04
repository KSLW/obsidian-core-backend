import express from "express";
import { Streamer } from "../models/Streamer.js";
import { Command } from "../models/Command.js";
import { Automation } from "../models/Automation.js";
import {
  setCommands, upsertCommand, removeCommand,
  addAutomation, removeAutomation, setAutomations
} from "../core/registry.js";

const router = express.Router();

async function getActiveStreamer() {
  // pick latest updated streamer (OAuth’d) or null
  const list = await Streamer.find({});
  if (!list.length) return null;
  return list.sort((a,b) => (b.updatedAt||0)-(a.updatedAt||0))[0];
}

/* Commands */
router.get("/commands", async (_req, res) => {
  const s = await getActiveStreamer();
  if (!s) return res.json([]);
  const list = await Command.find({ streamerId: s._id });
  res.json(list);
});

router.post("/commands", async (req, res) => {
  const s = await getActiveStreamer();
  if (!s) return res.status(400).json({ error: "No streamer" });
  const doc = await Command.create({ ...req.body, streamerId: s._id, enabled: true });
  const all = await Command.find({ streamerId: s._id, enabled: true });
  setCommands(s._id, all);
  upsertCommand(s._id, doc);
  res.json(doc);
});

router.put("/commands/:id", async (req, res) => {
  const updated = await Command.update(req.params.id, req.body);
  if (!updated) return res.status(404).send("Not found");
  const s = await getActiveStreamer();
  const all = await Command.find({ streamerId: s._id, enabled: true });
  setCommands(s._id, all);
  res.json({ ok: true });
});

router.delete("/commands/:id", async (req, res) => {
  await Command.remove(req.params.id);
  const s = await getActiveStreamer();
  if (s) {
    const all = await Command.find({ streamerId: s._id, enabled: true });
    setCommands(s._id, all);
  }
  res.json({ ok: true });
});

/* Automations */
router.get("/automations", async (_req, res) => {
  const s = await getActiveStreamer();
  if (!s) return res.json([]);
  const list = await Automation.find({ streamerId: s._id });
  res.json(list);
});

router.post("/automations", async (req, res) => {
  const s = await getActiveStreamer();
  if (!s) return res.status(400).json({ error: "No streamer" });
  const doc = await Automation.create({ ...req.body, streamerId: s._id, enabled: true });
  addAutomation(s._id, doc);
  res.json(doc);
});

router.put("/automations/:id", async (req, res) => {
  const updated = await Automation.update(req.params.id, req.body);
  if (!updated) return res.status(404).send("Not found");
  const s = await getActiveStreamer();
  const list = await Automation.find({ streamerId: s._id, enabled: true });
  setAutomations(s._id, list);
  res.json({ ok: true });
});

router.delete("/automations/:id", async (req, res) => {
  await Automation.remove(req.params.id);
  const s = await getActiveStreamer();
  if (s) {
    const list = await Automation.find({ streamerId: s._id, enabled: true });
    setAutomations(s._id, list);
  }
  res.json({ ok: true });
});



export default router;
