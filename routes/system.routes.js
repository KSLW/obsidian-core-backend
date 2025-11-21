// backend/routes/system.routes.js
const express = require("express");
const router = express.Router();

// GET /api/health
router.get("/health", (req, res) => {
  res.json({
    ok: true,
    status: "online",
    timestamp: Date.now(),
  });
});

// POST /api/system/restart
router.post("/system/restart", (req, res) => {
  console.log("Backend restart requested (stub).");

  // Here you could trigger:
  // - a PM2 restart
  // - a docker restart
  // - or just log it for now

  res.json({
    ok: true,
    message: "Restart request received (no-op in dev).",
  });
});

module.exports = router;
