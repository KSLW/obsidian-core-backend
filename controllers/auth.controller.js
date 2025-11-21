// backend/controllers/auth.controller.js
const axios = require("axios");
const { getSettings, updateSettings } = require("../services/settings.service");

// GET /api/settings
async function getSettingsController(req, res) {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err) {
    console.error("[Settings] Load Error:", err);
    res.status(500).json({ error: "Failed to load settings" });
  }
}

// POST /api/auth/twitch/keys
async function saveTwitchKeys(req, res) {
  try {
    const { twitchClientId, twitchClientSecret } = req.body;

    if (!twitchClientId || !twitchClientSecret) {
      return res
        .status(400)
        .json({ error: "Both twitchClientId and twitchClientSecret are required" });
    }

    const updated = await updateSettings({
      twitchClientId,
      twitchClientSecret,
    });

    res.json({ success: true, twitchClientId: updated.twitchClientId });
  } catch (err) {
    console.error("[Twitch] Save Keys Error:", err);
    res.status(500).json({ error: "Failed to save Twitch keys" });
  }
}

// GET /api/auth/twitch/login
async function twitchLogin(req, res) {
  try {
    const settings = await getSettings();
    const clientId = process.env.TWITCH_CLIENT_ID;

    if (!clientId) {
      return res.status(400).send("Twitch Client ID not set.");
    }

    const redirectUri = process.env.TWITCH_REDIRECT_URI;
    if (!redirectUri) {
      return res.status(500).send("TWITCH_REDIRECT_URI not configured.");
    }

    const scope = [
      "user:read:email",
      "chat:read",
      "chat:edit",
      "moderator:read:chat_settings",
      "moderator:manage:chat_settings",
    ].join(" ");

    const authUrl = new URL("https://id.twitch.tv/oauth2/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scope);

    console.log("[Twitch] Redirecting:", authUrl.toString());
    res.redirect(authUrl.toString());
  } catch (err) {
    console.error("[Twitch] Login error:", err);
    res.status(500).send("Failed to start Twitch OAuth");
  }
}

// GET /api/auth/twitch/callback
async function twitchCallback(req, res) {
  const { code, error } = req.query;

  if (error) {
    console.error("[Twitch] OAuth error:", error);
    return res.status(400).send("Twitch OAuth error: " + error);
  }

  if (!code) {
    return res.status(400).send("Missing ?code in Twitch callback.");
  }

  try {
    const settings = await getSettings();
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    const redirectUri = process.env.TWITCH_REDIRECT_URI;

    if (!clientId || !clientSecret) {
      return res.status(400).send("Twitch Client ID/Secret not configured.");
    }

    console.log("[Twitch] Exchanging code for token...");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);
    params.append("code", code);
    params.append("grant_type", "authorization_code");
    params.append("redirect_uri", redirectUri);

    const tokenRes = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      params
    );

    const tokenData = tokenRes.data;
    console.log("[Twitch] Token response received.");

    const twitchAuth = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
      tokenType: tokenData.token_type,
      obtainedAt: Date.now(),
    };

    await updateSettings({ twitchAuth });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(frontendUrl + "/dashboard");
  } catch (err) {
    console.error("[Twitch] OAuth exchange failed:", err.response?.data || err);
    res.status(500).send("OAuth Exchange Failed");
  }
}

// POST /api/auth/reset/:provider
async function resetAuth(req, res) {
  const { provider } = req.params;

  try {
    const update = {};

    if (provider === "twitch") update.twitchAuth = null;
    else if (provider === "discord") update.discordAuth = null;
    else return res.status(400).json({ error: "Unknown provider." });

    const settings = await updateSettings(update);
    res.json({ success: true, settings });
  } catch (err) {
    console.error("[Auth] Reset error:", err);
    res.status(500).json({ error: "Failed to reset auth" });
  }
}

// ============================
// DISCORD LOGIN
// ============================
async function discordLogin(req, res) {
  try {
    const settings = await getSettings();
    const clientId = settings.discordClientId;

    if (!clientId) {
      return res.status(400).send("Discord Client ID not set.");
    }

    const redirectUri = process.env.DISCORD_REDIRECT_URI;

    const scope = [
      "identify",
      "guilds",           // optional
      "guilds.members.read" // optional
    ].join(" ");

    const authUrl = new URL("https://discord.com/api/oauth2/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scope);

    return res.redirect(authUrl.toString());
  } catch (err) {
    console.error("[Discord] Login error:", err);
    return res.status(500).send("Failed to start Discord OAuth");
  }
}

// ============================
// DISCORD CALLBACK
// ============================
async function discordCallback(req, res) {
  const { code, error } = req.query;

  if (error) {
    console.error("[Discord] OAuth error:", error);
    return res.status(400).send("Discord OAuth error: " + error);
  }

  if (!code) {
    return res.status(400).send("Missing ?code in Discord callback.");
  }

  try {
    const settings = await getSettings();
    const clientId = settings.discordClientId;
    const clientSecret = settings.discordClientSecret;
    const redirectUri = process.env.DISCORD_REDIRECT_URI;

    if (!clientId || !clientSecret) {
      return res.status(400).send("Discord Client ID/Secret not configured.");
    }

    const tokenRes = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const tokenData = tokenRes.data;
    console.log("[Discord] Token response:", tokenData);

    const discordAuth = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
      obtainedAt: Date.now(),
    };

    await updateSettings({ discordAuth });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(frontendUrl + "/dashboard");
  } catch (err) {
    console.error(
      "[Discord] OAuth exchange failed:",
      err.response?.data || err.message
    );
    return res.status(500).send("Discord OAuth Exchange Failed");
  }
}

async function saveDiscordKeys(req, res) {
  try {
    const { discordClientId, discordClientSecret } = req.body;

    if (!discordClientId || !discordClientSecret) {
      return res.status(400).json({
        error: "Discord Client ID and Secret required.",
      });
    }

    await updateSettings({
      discordClientId,
      discordClientSecret,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Failed saving Discord keys:", err);
    res.status(500).json({ error: "Error saving Discord keys." });
  }
}



module.exports = {
  getSettingsController,
  saveTwitchKeys,
  twitchLogin,
  twitchCallback,
  resetAuth,
  discordLogin,
  discordCallback,
  saveDiscordKeys,
};
