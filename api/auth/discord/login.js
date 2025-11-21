const express = require("express");
const router = express.Router();

router.get("/login", (req, res) => {
  const url =
    `https://discord.com/api/oauth2/authorize?` +
    `client_id=${process.env.DISCORD_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=identify%20bot%20applications.commands`;

  res.redirect(url);
});

module.exports = router;
