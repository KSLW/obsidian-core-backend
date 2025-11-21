const axios = require("axios");
const { getSettings, updateSettings } = require("../services/settings.service");

// GET /api/auth/discord/login
async function discordLogin(req, res) {
  try {
    const settings = await getSettings();
    const clientId = settings.discordClientId;

    if (!clientId) {
      return res.status(400).send("Discord Client ID not set.");
    }

    const redirectUri = process.env.DISCORD_REDIRECT_URI;
    const scope = ["identify", "guilds"].join(" ");

    const authUrl = new URL("https://discord.com/api/oauth2/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("prompt", "consent");

    return res.redirect(authUrl.toString());
  } catch (err) {
    console.error("[Discord] Login error:", err);
    res.status(500).send("Failed to start Discord OAuth");
  }
}

// GET /api/auth/discord/callback
async function discordCallback(req, res) {
  const { code, error } = req.query;

  if (error) return res.status(400).send("Discord OAuth error: " + error);
  if (!code) return res.status(400).send("Missing ?code in Discord callback.");

  try {
    const settings = await getSettings();
    const clientId = settings.discordClientId;
    const clientSecret = settings.discordClientSecret;

    if (!clientId || !clientSecret) {
      return res.status(400).send("Discord keys not configured.");
    }

    const redirectUri = process.env.DISCORD_REDIRECT_URI;

    const data = new URLSearchParams();
    data.append("client_id", clientId);
    data.append("client_secret", clientSecret);
    data.append("grant_type", "authorization_code");
    data.append("code", code);
    data.append("redirect_uri", redirectUri);

    const tokenRes = await axios.post(
      "https://discord.com/api/oauth2/token",
      data,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const token = tokenRes.data;

    const discordAuth = {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresIn: token.expires_in,
      scope: token.scope,
      obtainedAt: Date.now(),
      tokenType: token.token_type,
    };

    await updateSettings({ discordAuth });

    const frontendUrl = process.env.FRONTEND_URL;
    return res.redirect(frontendUrl + "/dashboard");
  } catch (err) {
    console.error("[Discord] OAuth Exchange Error:", err.response?.data || err);
    res.status(500).send("Discord OAuth Exchange Failed");
  }
}

// POST /api/auth/discord/keys
async function saveDiscordKeys(req, res) {
  const { discordClientId, discordClientSecret } = req.body;

  if (!discordClientId || !discordClientSecret)
    return res.status(400).json({ error: "Both fields required." });

  await updateSettings({
    discordClientId,
    discordClientSecret,
  });

  res.json({ success: true });
}

module.exports = {
  discordLogin,
  discordCallback,
  saveDiscordKeys,
};
