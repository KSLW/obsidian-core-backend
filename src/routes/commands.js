// src/routes/commands.js
import express from "express";
import { Command } from "../models/Command.js";
import { emitEvent } from "../core/eventBus.js";

const router = express.Router();

/* Utility: build paging & filtering */
function buildQuery(req) {
  const { streamerId, name, enabled } = req.query;
  const q = {};
  if (streamerId) q.streamerId = String(streamerId);
  if (name) q.name = String(name).toLowerCase();
  if (enabled !== undefined) q.enabled = enabled === "true";
  return q;
}

/* GET /api/commands?streamerId=global&limit=50&cursor=<id> */
router.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const cursor = req.query.cursor; // pass last _id to paginate
    const q = buildQuery(req);
    if (cursor) q._id = { $gt: cursor };

    const rows = await Command.find(q)
      .sort({ _id: 1 })
      .limit(limit + 1)
      .lean();

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? data[data.length - 1]._id : null;

    res.json({ data, nextCursor });
  } catch (e) {
    next(e);
  }
});

/* POST /api/commands  (create) */
router.post("/", async (req, res, next) => {
  try {
    const {
      streamerId = "global",
      name,
      response,
      enabled = true,
      cooldown = 10,
      permissions = "everyone",
    } = req.body;

    if (!name || !response) {
      return res.status(400).json({ error: "name and response are required" });
    }

    const doc = await Command.create({
      streamerId,
      name: String(name).toLowerCase().trim(),
      response,
      enabled,
      cooldown,
      permissions,
    });

    emitEvent(streamerId, "commands.updated", { id: doc._id.toString() });
    res.status(201).json(doc);
  } catch (e) {
    // handle duplicate key error (unique index streamerId+name)
    if (e?.code === 11000) {
      return res.status(409).json({ error: "Command name already exists for this streamer." });
    }
    next(e);
  }
});

/* PATCH /api/commands/:id  (update) */
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const update = {};
    for (const k of ["name", "response", "enabled", "cooldown", "permissions", "lastUsed"]) {
      if (k in req.body) update[k] = req.body[k];
    }
    if (update.name) update.name = String(update.name).toLowerCase().trim();

    const doc = await Command.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return res.status(404).json({ error: "Command not found" });

    emitEvent(doc.streamerId, "commands.updated", { id: doc._id.toString() });
    res.json(doc);
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ error: "Command name already exists for this streamer." });
    }
    next(e);
  }
});

/* DELETE /api/commands/:id */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await Command.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: "Command not found" });

    emitEvent(doc.streamerId, "commands.updated", { id });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
