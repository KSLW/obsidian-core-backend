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
  const { code, error } = req.query;

  if (error) {
    return res.status(400).send("OAuth Error: " + error);
  }

  try {
    const settings = await getSettings();
    const clientId = settings.twitchClientId;
    const clientSecret = settings.twitchClientSecret;

    const redirectUri = process.env.TWITCH_REDIRECT_URI;

    const tokenRes = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      null,
      {
        params: {
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri
        },
      }
    );

    const data = tokenRes.data;

    await updateSettings({
      twitchAuth: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
        scope: data.scope,
        obtainedAt: Date.now(),
      },
    });

    return res.redirect(
      process.env.FRONTEND_URL + "/dashboard"
    );
  } catch (err) {
    console.error("OAuth Exchange Failed:", err.response?.data || err);
    return res.status(500).send("OAuth Exchange Failed");
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
