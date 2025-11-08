// backend/src/routes/moderation.js
import express from "express";
import {
  getModerationSettings,
  setModerationLevel,
  setCustomBanned,
} from "../core/moderation.js";

const router = express.Router();

/* ────────────────────────────────
   📄 GET /api/moderation/:streamerId
   Returns moderation settings for a streamer
──────────────────────────────── */
router.get("/:streamerId", async (req, res) => {
  try {
    const settings = await getModerationSettings(req.params.streamerId);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ────────────────────────────────
   ⚙️ POST /api/moderation/level
   Body: { streamerId, level }
──────────────────────────────── */
router.post("/level", async (req, res) => {
  try {
    const { streamerId, level } = req.body;
    if (!streamerId || !level)
      return res.status(400).json({ error: "Missing streamerId or level" });

    const settings = await setModerationLevel(streamerId, level);
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ────────────────────────────────
   🧩 POST /api/moderation/custom
   Body: { streamerId, words: ["word1", "word2"] }
──────────────────────────────── */
router.post("/custom", async (req, res) => {
  try {
    const { streamerId, words } = req.body;
    if (!streamerId || !Array.isArray(words))
      return res.status(400).json({ error: "Missing streamerId or words[]" });

    const settings = await setCustomBanned(streamerId, words);
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
