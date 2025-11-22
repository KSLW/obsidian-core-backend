// backend/controllers/auth.controller.js
const axios = require("axios");
const { getSettings, updateSettings } = require("../services/settings.service");

// ------------------------------------------------------------
// GET /api/settings (Used by frontend)
// ------------------------------------------------------------
async function getSettingsController(req, res) {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err) {
    console.error("[Settings] Load failed:", err);
    res.status(500).json({ error: "Failed to load settings" });
  }
}

// ------------------------------------------------------------
// POST /api/auth/twitch/keys
// Saves Twitch Client ID + Secret
// ------------------------------------------------------------
async function saveTwitchKeys(req, res) {
  const { twitchClientId, twitchClientSecret } = req.body;

  if (!twitchClientId || !twitchClientSecret) {
    return res.status(400).json({ error: "Missing Twitch keys" });
  }

  const updated = await updateSettings({
    twitchClientId,
    twitchClientSecret,
  });

  res.json({ success: true, twitchClientId: updated.twitchClientId });
}

// ------------------------------------------------------------
// POST /api/auth/discord/keys
// Saves Discord Client ID + Secret
// ------------------------------------------------------------
async function saveDiscordKeys(req, res) {
  const { discordClientId, discordClientSecret } = req.body;

  if (!discordClientId || !discordClientSecret) {
    return res.status(400).json({ error: "Missing Discord keys" });
  }

  const updated = await updateSettings({
    discordClientId,
    discordClientSecret,
  });

  res.json({ success: true, discordClientId: updated.discordClientId });
}

// ------------------------------------------------------------
// GET /api/auth/twitch/login
// Start Twitch OAuth
// ------------------------------------------------------------
async function twitchLogin(req, res) {
  try {
    const settings = await getSettings();
    const clientId = settings.twitchClientId;

    if (!clientId) return res.status(400).send("Twitch Client ID not set.");

    const redirectUri = process.env.TWITCH_REDIRECT_URI;

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

    console.log("[Twitch] Redirecting to:", authUrl.toString());
    res.redirect(authUrl.toString());
  } catch (err) {
    console.error("[Twitch] Login failed:", err);
    res.status(500).send("Failed to start Twitch OAuth.");
  }
}

// ------------------------------------------------------------
// GET /api/auth/twitch/callback
// Twitch OAuth Completion
// ------------------------------------------------------------
async function twitchCallback(req, res) {
  const { code, error } = req.query;

  if (error) {
    console.error("[Twitch] OAuth error:", error);
    return res.status(400).send("Twitch OAuth error: " + error);
  }

  if (!code) return res.status(400).send("Missing ?code.");

  try {
    const settings = await getSettings();
    const redirectUri = process.env.TWITCH_REDIRECT_URI;

    const params = new URLSearchParams();
    params.append("client_id", settings.twitchClientId);
    params.append("client_secret", settings.twitchClientSecret);
    params.append("code", code);
    params.append("grant_type", "authorization_code");
    params.append("redirect_uri", redirectUri);

    console.log("[Twitch] Exchanging code for tokens...");
    const tokenRes = await axios.post("https://id.twitch.tv/oauth2/token", params);

    const tokenData = tokenRes.data;
    console.log("[Twitch] Token response received.");

    const twitchAuth = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
      obtainedAt: Date.now(),
    };

    await updateSettings({ twitchAuth });

    const frontendUrl = process.env.FRONTEND_URL;
    return res.redirect(frontendUrl + "/dashboard");
  } catch (err) {
    console.error("[Twitch] OAuth exchange failed:", err.response?.data || err.message);
    res.status(500).send("OAuth Exchange Failed");
  }
}

// ------------------------------------------------------------
// GET /api/auth/discord/login
// ------------------------------------------------------------
async function discordLogin(req, res) {
  const settings = await getSettings();
  const clientId = settings.discordClientId;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId) return res.status(400).send("Discord Client ID not set.");

  const scope = ["identify", "email", "guilds.join"].join(" ");

  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);

  console.log("[Discord] Redirecting to:", url.toString());
  res.redirect(url.toString());
}

// ------------------------------------------------------------
// GET /api/auth/discord/callback
// ------------------------------------------------------------
async function discordCallback(req, res) {
  const { code } = req.query;

  if (!code) return res.status(400).send("Missing code.");

  try {
    const settings = await getSettings();
    const tokenUrl = "https://discord.com/api/oauth2/token";

    const params = new URLSearchParams();
    params.append("client_id", settings.discordClientId);
    params.append("client_secret", settings.discordClientSecret);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", process.env.DISCORD_REDIRECT_URI);

    console.log("[Discord] Exchanging code...");

    const tokenRes = await axios.post(tokenUrl, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const tokenData = tokenRes.data;

    const discordAuth = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
      obtainedAt: Date.now(),
    };

    await updateSettings({ discordAuth });

    const frontendUrl = process.env.FRONTEND_URL;
    return res.redirect(frontendUrl + "/dashboard");
  } catch (err) {
    console.error("[Discord] OAuth exchange failed:", err.response?.data || err.message);
    res.status(500).send("Discord OAuth exchange failed");
  }
}

// ------------------------------------------------------------
// POST /api/auth/reset/:provider
// ------------------------------------------------------------
async function resetAuth(req, res) {
  const provider = req.params.provider;

  const field = provider === "twitch" ? "twitchAuth" : "discordAuth";

  await updateSettings({ [field]: null });

  res.json({ success: true });
}

module.exports = {
  getSettingsController,
  saveTwitchKeys,
  saveDiscordKeys,
  twitchLogin,
  twitchCallback,
  discordLogin,
  discordCallback,
  resetAuth,
};
