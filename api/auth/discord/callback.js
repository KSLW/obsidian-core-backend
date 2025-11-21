const express = require("express");
const axios = require("axios");
const Settings = require("../../../models/Settings");
const router = express.Router();

router.get("/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const tokenResponse = await axios.post(
      `https://discord.com/api/oauth2/token`,
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
        code,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    const identify = await axios.get(
      "https://discord.com/api/users/@me",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const settings = await Settings.get();
    settings.discordAuth = {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      obtainedAt: Date.now(),
      user: identify.data,
    };

    await settings.save();

    res.redirect("http://localhost:3000/settings");
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: "Discord authentication failed" });
  }
});

module.exports = router;
