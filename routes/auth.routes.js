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

router.post("/auth/twitch/keys", saveTwitchKeys);

router.get("/auth/twitch/login", twitchLogin);
router.get("/auth/twitch/callback", twitchCallback);

router.post("/auth/reset/:provider", resetAuth);

module.exports = router;
