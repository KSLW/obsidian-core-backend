const express = require("express");
const router = express.Router();
const {
  getSettingsController,
  updateSettingsController,
  saveTwitchKeys,
  twitchLogin,
  twitchCallback,
  resetAuth,
} = require("../controllers/auth.controller");

// Settings
router.get("/settings", getSettingsController);
router.put("/settings", updateSettingsController);

// Twitch app keys
router.post("/auth/twitch/keys", saveTwitchKeys);

// Twitch OAuth
router.get("/auth/twitch/login", twitchLogin);
router.get("/auth/twitch/callback", twitchCallback);

// Reset auth tokens
router.post("/auth/reset/:provider", resetAuth);

module.exports = router;
