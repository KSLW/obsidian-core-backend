// backend/routes/auth.routes.js
const express = require("express");
const router = express.Router();

const {
  getSettingsController,
  saveTwitchKeys,
  twitchLogin,
  twitchCallback,
  resetAuth,
} = require("../controllers/auth.controller");

router.get("/settings", getSettingsController);

// Twitch Developer Keys
router.post("/auth/twitch/keys", saveTwitchKeys);

// Twitch OAuth Flow
router.get("/auth/twitch/login", twitchLogin);
router.get("/auth/twitch/callback", twitchCallback);

// Reset auth for Twitch or Discord
router.post("/auth/reset/:provider", resetAuth);

module.exports = router;
