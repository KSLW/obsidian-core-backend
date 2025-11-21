const router = require("express").Router();
const Settings = require("../models/Settings");

// GET settings
router.get("/", async (req, res) => {
  const settings = await Settings.get();
  res.json(settings);
});

// UPDATE settings
router.put("/", async (req, res) => {
  let settings = await Settings.get();
  Object.assign(settings, req.body);
  await settings.save();
  res.json(settings);
});

// DELETE /api/settings/auth/:provider
router.delete("/auth/:provider", async (req, res) => {
  const settings = await Settings.get();
  const provider = req.params.provider;

  if (provider === "twitch") {
    settings.twitchAuth = {};
  } else if (provider === "discord") {
    settings.discordAuth = {};
  }

  await settings.save();
  res.json({ success: true });
});


module.exports = router;
