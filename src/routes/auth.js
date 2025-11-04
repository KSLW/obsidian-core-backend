// backend/src/routes/auth.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { Streamer } from "../models/Streamer.js";

dotenv.config();
const router = express.Router();

/* ────────────────────────────────
   🟣 TWITCH LOGIN (Step 1)
──────────────────────────────── */
router.get("/twitch", (req, res) => {
  try {
    const redirectUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${
      process.env.TWITCH_CLIENT_ID
    }&redirect_uri=${encodeURIComponent(process.env.TWITCH_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(
      "chat:read chat:edit moderator:read:chatters channel:read:redemptions channel:read:subscriptions user:read:email"
    )}`;
    res.redirect(redirectUrl);
  } catch (err) {
    console.error("Twitch login redirect failed:", err.message);
    res.status(500).send("Failed to redirect to Twitch");
  }
});

/* ────────────────────────────────
   🟣 TWITCH OAUTH CALLBACK (Step 2)
──────────────────────────────── */
router.get("/twitch/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing OAuth code");

  try {
    // 1️⃣ Exchange code for access token
    const { data } = await axios.post("https://id.twitch.tv/oauth2/token", null, {
      params: {
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.TWITCH_REDIRECT_URI,
      },
    });

    // 2️⃣ Fetch Twitch user info
    const userInfo = await axios.get("https://api.twitch.tv/helix/users", {
      headers: {
        "Client-Id": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    const user = userInfo.data.data[0];
    const ownerId = user.id;

    const existing = await Streamer.findOne({ ownerId });
    const update = {
      ownerId,
      displayName: user.display_name,
      twitchAuth: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        scope: data.scope,
        obtainedAt: Date.now(),
      },
      twitchBot: {
        username: user.login,
        channel: user.login,
      },
      updatedAt: Date.now(),
    };

    if (existing) await Streamer.update(existing._id, update);
    else await Streamer.create(update);

    console.log(`✅ Twitch OAuth success for ${user.display_name}`);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    console.error("Twitch OAuth Error:", err.response?.data || err.message);
    res.status(500).send("Twitch OAuth failed");
  }
});

/* ────────────────────────────────
   💬 DISCORD LOGIN (Step 1)
──────────────────────────────── */
router.get("/discord", (req, res) => {
  try {
    const redirectUrl = `https://discord.com/oauth2/authorize?client_id=${
      process.env.DISCORD_CLIENT_ID
    }&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(
      "identify guilds"
    )}`;
    res.redirect(redirectUrl);
  } catch (err) {
    console.error("Discord login redirect failed:", err.message);
    res.status(500).send("Failed to redirect to Discord");
  }
});

/* ────────────────────────────────
   💬 DISCORD OAUTH CALLBACK (Step 2)
──────────────────────────────── */
router.get("/discord/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing OAuth code");

  try {
    // 1️⃣ Exchange code for access token
    const { data } = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    // 2️⃣ Fetch Discord user info
    const userInfo = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });

    const ownerId = userInfo.data.id;
    const existing = await Streamer.findOne({ ownerId });

    const update = {
      ownerId,
      displayName: userInfo.data.username,
      discordAuth: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        obtainedAt: Date.now(),
      },
      updatedAt: Date.now(),
    };

    if (existing) await Streamer.update(existing._id, update);
    else await Streamer.create(update);

    console.log(`✅ Discord OAuth success for ${userInfo.data.username}`);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    console.error("Discord OAuth Error:", err.response?.data || err.message);
    res.status(500).send("Discord OAuth failed");
  }
});

export default router;
