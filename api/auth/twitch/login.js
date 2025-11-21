const express = require("express");
const router = express.Router();

router.get("/login", (req, res) => {
  const redirect = process.env.TWITCH_REDIRECT_URI;

  const url =
    `https://id.twitch.tv/oauth2/authorize?` +
    `client_id=${process.env.TWITCH_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirect)}` +
    `&response_type=code` +
    `&scope=user:read:email chat:read chat:edit`;

  res.redirect(url);
});

module.exports = router;
