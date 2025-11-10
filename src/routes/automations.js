// src/routes/automations.js
import express from "express";
import { Automation } from "../models/Automation.js";
import { emitEvent } from "../core/eventBus.js";

const router = express.Router();

/* GET /api/automations?streamerId=global&limit=50&cursor=<id> */
router.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const cursor = req.query.cursor;
    const { streamerId, triggerType, enabled } = req.query;

    const q = {};
    if (streamerId) q.streamerId = String(streamerId);
    if (triggerType) q.triggerType = String(triggerType);
    if (enabled !== undefined) q.enabled = enabled === "true";
    if (cursor) q._id = { $gt: cursor };

    const rows = await Automation.find(q).sort({ _id: 1 }).limit(limit + 1).lean();
    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? data[data.length - 1]._id : null;

    res.json({ data, nextCursor });
  } catch (e) {
    next(e);
  }
});

/* POST /api/automations  (create) */
router.post("/", async (req, res, next) => {
  try {
    const {
      streamerId = "global",
      enabled = true,
      triggerType,
      triggerName = null,
      conditions = {},
      actions = [],
    } = req.body;

    if (!triggerType) {
      return res.status(400).json({ error: "triggerType is required" });
    }

    const doc = await Automation.create({
      streamerId,
      enabled,
      triggerType,
      triggerName,
      conditions,
      actions,
    });

    emitEvent(streamerId, "automations.updated", { id: doc._id.toString() });
    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
});

/* PATCH /api/automations/:id  (update) */
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const allowed = ["streamerId", "enabled", "triggerType", "triggerName", "conditions", "actions"];
    const update = {};
    for (const k of allowed) if (k in req.body) update[k] = req.body[k];

    const doc = await Automation.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return res.status(404).json({ error: "Automation not found" });

    emitEvent(doc.streamerId, "automations.updated", { id: doc._id.toString() });
    res.json(doc);
  } catch (e) {
    next(e);
  }
});

/* DELETE /api/automations/:id */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await Automation.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: "Automation not found" });

    emitEvent(doc.streamerId, "automations.updated", { id });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
8