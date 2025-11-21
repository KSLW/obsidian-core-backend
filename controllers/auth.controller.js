const axios = require("axios");
const { getSettings, updateSettings } = require("../services/settings.service");

// GET /api/settings
async function getSettingsController(req, res) {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err) {
    console.error("Failed to load settings", err);
    res.status(500).json({ error: "Failed to load settings" });
  }
}

// POST /api/auth/twitch/keys
async function saveTwitchKeys(req, res) {
  try {
    const { twitchClientId, twitchClientSecret } = req.body;

    if (!twitchClientId || !twitchClientSecret) {
      return res.status(400).json({ error: "Both values are required" });
    }

    const updated = await updateSettings({
      twitchClientId,
      twitchClientSecret
    });

    res.json({ success: true, settings: updated });
  } catch (err) {
    console.error("Error saving Twitch keys", err);
    res.status(500).json({ error: "Failed to save keys" });
  }
}

// GET /api/auth/twitch/login
async function twitchLogin(req, res) {
  try {
    const settings = await getSettings();
    const clientId = settings.twitchClientId;

    if (!clientId) {
      return res.status(400).send("Twitch Client ID not set.");
    }

    const redirectUri = process.env.TWITCH_REDIRECT_URI;
    const scope = [
      "chat:read",
      "chat:edit",
      "user:read:email",
      "moderator:manage:shoutouts"
    ].join(" ");

    const link = new URL("https://id.twitch.tv/oauth2/authorize");
    link.searchParams.set("client_id", clientId);
    link.searchParams.set("redirect_uri", redirectUri);
    link.searchParams.set("response_type", "code");
    link.searchParams.set("scope", scope);

    res.redirect(link.toString());
  } catch (err) {
    console.error("Twitch login error", err);
    res.status(500).send("Failed to start OAuth");
  }
}

// GET /api/auth/twitch/callback
async function twitchCallback(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Missing OAuth code");
  }

  try {
    const settings = await getSettings();
    const clientId = settings.twitchClientId;
    const clientSecret = settings.twitchClientSecret;

    const response = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      null,
      {
        params: {
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: process.env.TWITCH_REDIRECT_URI
        }
      }
    );

    const tokenData = response.data;

    await updateSettings({
      twitchAuth: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        obtainedAt: Date.now()
      }
    });

    const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(frontend + "/dashboard");
  } catch (err) {
    console.error("Twitch callback error:", err.response?.data || err);
    res.status(500).send("OAuth Exchange Failed");
  }
}

// POST /api/auth/reset/:provider
async function resetAuth(req, res) {
  try {
    const updated =
      req.params.provider === "twitch"
        ? await updateSettings({ twitchAuth: null })
        : req.params.provider === "discord"
        ? await updateSettings({ discordAuth: null })
        : null;

    if (!updated) return res.status(400).json({ error: "Unknown provider" });

    res.json({ success: true, settings: updated });
  } catch (err) {
    console.error("Reset error", err);
    res.status(500).json({ error: "Failed to reset auth" });
  }
}

async function updateSettingsController(req, res) {
  try {
    const updated = await updateSettings(req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
}


module.exports = {
  getSettingsController,
  saveTwitchKeys,
  twitchLogin,
  twitchCallback,
  resetAuth,
  updateSettingsController
};
