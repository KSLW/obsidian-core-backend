// backend/controllers/auth.controller.js
const axios = require("axios");
const { getSettings, updateSettings } = require("../services/settings.service");

// GET /api/auth/twitch/login
async function twitchLogin(req, res) {
  try {
    const settings = await getSettings();
    const clientId = settings.twitchClientId;

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

    console.log("[Twitch] Redirecting to:", authUrl.toString());

    return res.redirect(authUrl.toString());
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
    const clientId = settings.twitchClientId;
    const clientSecret = settings.twitchClientSecret;
    const redirectUri = process.env.TWITCH_REDIRECT_URI;

    if (!clientId || !clientSecret) {
      return res.status(400).send("Twitch Client ID/Secret not configured.");
    }

    console.log("[Twitch] Exchanging code for tokens...");

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
    console.log("[Twitch] Token response:", tokenData);

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
    console.log("[Twitch] Auth success, redirecting to", frontendUrl + "/dashboard");

    return res.redirect(frontendUrl + "/dashboard");
  } catch (err) {
    console.error(
      "[Twitch] OAuth exchange failed:",
      err.response?.data || err.message
    );
    res.status(500).send("OAuth Exchange Failed");
  }
}

module.exports = {
  // ...other handlers...
  updateSettings,
  twitchLogin,
  twitchCallback,
};
