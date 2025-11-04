import express from "express";
import axios from "axios";
import { Streamer } from "../models/Streamer.js";

const router = express.Router();

/* ======================
   🟣 TWITCH LOGIN + CALLBACK
====================== */
router.get("/twitch", (req, res) => {
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_REDIRECT_URI)
    return res.status(500).send("Twitch credentials missing");

  const url = new URL("https://id.twitch.tv/oauth2/authorize");
  url.searchParams.set("client_id", process.env.TWITCH_CLIENT_ID);
  url.searchParams.set("redirect_uri", process.env.TWITCH_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", [
    "chat:read",
    "chat:edit",
    "moderator:read:chatters",
    "channel:read:redemptions",
    "channel:read:subscriptions",
    "user:read:email",
  ].join(" "));
  res.redirect(url.toString());
});

router.get("/twitch/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing OAuth code");
  try {
    const tokenRes = await axios.post("https://id.twitch.tv/oauth2/token", null, {
      params: {
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: process.env.TWITCH_REDIRECT_URI,
        code,
      },
    });

    const accessToken = tokenRes.data.access_token;
    const userRes = await axios.get("https://api.twitch.tv/helix/users", {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const user = userRes.data.data[0];

    await Streamer.updateOrCreate(user.id, {
      ownerId: user.id,
      displayName: user.display_name,
      twitchAuth: {
        accessToken,
        refreshToken: tokenRes.data.refresh_token,
        expiresIn: tokenRes.data.expires_in,
        obtainedAt: Date.now(),
      },
      twitchBot: { username: user.login, channel: user.login },
    });

    console.log(`✅ Twitch OAuth success for ${user.display_name}`);
    res.redirect(`${process.env.FRONTEND_URL || "/"}/dashboard`);
  } catch (err) {
    console.error("❌ Twitch OAuth error:", err.response?.data || err.message);
    res.status(500).send("Twitch OAuth failed");
  }
});

/* ======================
   💬 DISCORD LOGIN + CALLBACK
====================== */
router.get("/discord", (req, res) => {
  if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_REDIRECT_URI)
    return res.status(500).send("Discord credentials missing");

  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", process.env.DISCORD_CLIENT_ID);
  url.searchParams.set("redirect_uri", process.env.DISCORD_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify guilds");
  res.redirect(url.toString());
});

router.get("/discord/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing OAuth code");
  try {
    const tokenRes = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
        code,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const me = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
    });

    await Streamer.updateOrCreate(me.data.id, {
      ownerId: me.data.id,
      displayName: me.data.username,
      discordAuth: {
        accessToken: tokenRes.data.access_token,
        refreshToken: tokenRes.data.refresh_token,
        expiresIn: tokenRes.data.expires_in,
        obtainedAt: Date.now(),
      },
    });

    console.log(`✅ Discord OAuth success for ${me.data.username}`);
    res.redirect(`${process.env.FRONTEND_URL || "/"}/dashboard`);
  } catch (err) {
    console.error("❌ Discord OAuth error:", err.response?.data || err.message);
    res.status(500).send("Discord OAuth failed");
  }
});

export default router;
