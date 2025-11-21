const axios = require("axios");
const { getSettings, updateSettings } = require("../services/settings.service");

async function getSettingsController(req, res) {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err) {
    console.error("[Settings] Load failed:", err);
    res.status(500).json({ error: "Failed to load settings" });
  }
}

async function saveTwitchKeys(req, res) {
  try {
    const { twitchClientId, twitchClientSecret } = req.body;

    if (!twitchClientId || !twitchClientSecret) {
      return res.status(400).json({ error: "Missing Twitch keys" });
    }

    const updated = await updateSettings({
      twitchClientId,
      twitchClientSecret,
    });

    res.json({ success: true, updated });
  } catch (err) {
    console.error("[Settings] Save keys failed:", err);
    res.status(500).json({ error: "Failed to save Twitch keys" });
  }
}

async function resetAuth(req, res) {
  const { provider } = req.params;

  try {
    const update = {};
    if (provider === "twitch") update.twitchAuth = null;
    else if (provider === "discord") update.discordAuth = null;
    else return res.status(400).json({ error: "Unknown provider" });

    const updated = await updateSettings(update);
    res.json({ success: true, updated });
  } catch (err) {
    console.error("[Auth] Reset failed:", err);
    res.status(500).json({ error: "Failed to reset auth" });
  }
}

async function twitchLogin(req, res) {
  // (your existing implementation)
}

async function twitchCallback(req, res) {
  // (your existing implementation)
}

module.exports = {
  getSettingsController,
  saveTwitchKeys,
  resetAuth,
  twitchLogin,
  twitchCallback,
};
