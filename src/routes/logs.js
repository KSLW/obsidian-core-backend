// backend/src/routes/logs.js
import express from "express";
import { getLogs, clearLogs } from "../core/logger.js";

const router = express.Router();

// GET /api/logs?platform=twitch&type=command&limit=50
router.get("/", async (req, res) => {
  try {
    const logs = await getLogs(req.query);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/logs?platform=discord
router.delete("/", async (req, res) => {
  try {
    const result = await clearLogs(req.query.platform);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
