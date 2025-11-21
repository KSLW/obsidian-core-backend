const express = require("express");
const router = express.Router();
const {
  discordLogin,
  discordCallback,
  saveDiscordKeys,
} = require("../controllers/discord.controller");

router.post("/auth/discord/keys", saveDiscordKeys);
router.get("/auth/discord/login", discordLogin);
router.get("/auth/discord/callback", discordCallback);

module.exports = router;
