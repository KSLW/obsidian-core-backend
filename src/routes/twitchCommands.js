// backend/src/routes/twitchCommands.js
import express from "express";
import { Streamer } from "../models/Streamer.js";
import { TwitchCommand } from "../models/TwitchCommand.js";
import { setCommands, upsertTwitchCommand, removeTwitchCommand } from "../core/registry.js";

const router = express.Router();

async function getActiveStreamer() {
  const list = await Streamer.find({});
  if (!list.length) return null;
  return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
}

// List
router.get("/", async (_req, res) => {
  const s = await getActiveStreamer();
  if (!s) return res.json([]);
  const list = await TwitchCommand.find({ streamerId: s._id });
  res.json(list);
});

// Create
router.post("/", async (req, res) => {
  const s = await getActiveStreamer();
  if (!s) return res.status(400).json({ error: "No active streamer" });

  const doc = await TwitchCommand.create({
    streamerId: s._id,
    ...req.body,
  });

  // refresh cache
  const all = await TwitchCommand.find({ streamerId: s._id, enabled: true });
  setCommands(s._id, all);

  upsertTwitchCommand(s._id, doc);
  res.json(doc);
});

// Update
router.put("/:id", async (req, res) => {
  const s = await getActiveStreamer();
  if (!s) return res.status(400).json({ error: "No active streamer" });

  const doc = await TwitchCommand.update(req.params.id, req.body);
  if (!doc) return res.status(404).json({ error: "Not found" });

  const all = await TwitchCommand.find({ streamerId: s._id, enabled: true });
  setCommands(s._id, all);

  res.json(doc);
});

// Delete
router.delete("/:id", async (req, res) => {
  const s = await getActiveStreamer();
  if (!s) return res.status(400).json({ error: "No active streamer" });

  await TwitchCommand.remove(req.params.id);
  const all = await TwitchCommand.find({ streamerId: s._id, enabled: true });
  setCommands(s._id, all);

  removeTwitchCommand(s._id, req.params.id);
  res.json({ ok: true });
});

export default router;
