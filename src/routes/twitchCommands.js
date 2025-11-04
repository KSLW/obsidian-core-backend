import express from "express";
import { Streamer } from "../models/Streamer.js";
import { Command } from "../models/Command.js";
import { setTwitchCommands } from "../core/registry.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  const s = await mostRecentStreamer();
  const list = await Command.find({ streamerId: s?._id, platforms: { $in: ["twitch"] } });
  res.json(list || []);
});

router.post("/", async (req, res) => {
  const s = await mostRecentStreamer();
  const doc = await Command.create({ ...req.body, streamerId: s?._id, platforms: ["twitch"] });
  const enabled = await Command.find({ streamerId: s?._id, enabled: true, platforms: { $in: ["twitch"] } });
  setTwitchCommands(s?._id, enabled);
  res.json(doc);
});

router.put("/:id", async (req, res) => {
  const s = await mostRecentStreamer();
  const updated = await Command.update(req.params.id, req.body);
  const enabled = await Command.find({ streamerId: s?._id, enabled: true, platforms: { $in: ["twitch"] } });
  setTwitchCommands(s?._id, enabled);
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const s = await mostRecentStreamer();
  await Command.remove(req.params.id);
  const enabled = await Command.find({ streamerId: s?._id, enabled: true, platforms: { $in: ["twitch"] } });
  setTwitchCommands(s?._id, enabled);
  res.json({ ok: true });
});

async function mostRecentStreamer() {
  const all = await Streamer.find({});
  if (!all?.length) return null;
  return all.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
}
export default router;
