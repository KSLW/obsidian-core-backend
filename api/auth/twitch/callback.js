const express = require("express");
const axios = require("axios");
const Settings = require("../../../models/Settings");
const router = express.Router();

router.get("/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const response = await axios.post(
      `https://id.twitch.tv/oauth2/token`,
      null,
      {
        params: {
          client_id: process.env.TWITCH_CLIENT_ID,
          client_secret: process.env.TWITCH_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: process.env.TWITCH_REDIRECT_URI,
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    const settings = await Settings.get();
    settings.twitchAuth = {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      obtainedAt: Date.now(),
      scope: ["chat:read", "chat:edit"],
    };

    await settings.save();

    res.redirect("http://localhost:3000/settings");
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: "Twitch authentication failed" });
  }
});

module.exports = router;
