// backend/src/routes/auth.js
import express from "express";
import axios from "axios";
import { Streamer } from "../models/Streamer.js";

const router = express.Router();

/* ────────────────────────────────
   🟣 TWITCH LOGIN (Step 1)
──────────────────────────────── */
router.get("/twitch", (req, res) => {
  try {
    const url = new URL("https://id.twitch.tv/oauth2/authorize");
    url.searchParams.set("client_id", process.env.TWITCH_CLIENT_ID);
    url.searchParams.set("redirect_uri", process.env.TWITCH_REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set(
      "scope",
      [
        "chat:read",
        "chat:edit",
        "moderator:read:chatters",
        "channel:read:redemptions",
        "channel:read:subscriptions",
        "user:read:email",
      ].join(" ")
    );

    res.redirect(url.toString());
  } catch (err) {
    console.error("Twitch login redirect failed:", err.message);
    res.status(500).send("Failed to redirect to Twitch");
  }
});

/* ────────────────────────────────
   🟣 TWITCH CALLBACK (Step 2)
──────────────────────────────── */
router.get("/twitch/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing OAuth code");

  try {
    // Exchange the code for an access token
    const tokenRes = await axios.post("https://id.twitch.tv/oauth2/token", null, {
      params: {
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.TWITCH_REDIRECT_URI,
      },
    });

    const accessToken = tokenRes.data.access_token;
    const refreshToken = tokenRes.data.refresh_token;

    // Fetch Twitch user info
    await safeTwitchApiCall(user.ownerId, async (token) =>
    axios.get("https://api.twitch.tv/helix/users", {
    headers: {
      "Client-ID": process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token || user.twitchAuth.accessToken}`,
    },
  })
);


    const u = userRes.data.data[0];

    // Store or update streamer in Mongo
    await Streamer.updateOrCreate(
      { ownerId: u.id },
      {
        displayName: u.display_name,
        twitchAuth: {
          accessToken,
          refreshToken,
          expiresIn: tokenRes.data.expires_in,
          obtainedAt: Date.now(),
        },
        twitchBot: { username: u.login, channel: u.login },
      }
    );

    console.log(`✅ Twitch OAuth success for ${u.display_name}`);
    res.redirect(`${process.env.FRONTEND_URL || "/"}/dashboard`);
  } catch (err) {
    console.error("❌ Twitch OAuth error:", err.response?.data || err.message);
    res.status(500).send("Twitch OAuth failed");
  }
});

/* ────────────────────────────────
   💬 DISCORD LOGIN (Step 1)
──────────────────────────────── */
router.get("/discord", (req, res) => {
  try {
    const url = new URL("https://discord.com/oauth2/authorize");
    url.searchParams.set("client_id", process.env.DISCORD_CLIENT_ID);
    url.searchParams.set("redirect_uri", process.env.DISCORD_REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "identify guilds");
    res.redirect(url.toString());
  } catch (err) {
    console.error("Discord login redirect failed:", err.message);
    res.status(500).send("Failed to redirect to Discord");
  }
});

/* ────────────────────────────────
   💬 DISCORD CALLBACK (Step 2)
──────────────────────────────── */
router.get("/discord/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing OAuth code");

  try {
    // Exchange the code for an access token
    const tokenRes = await axios.post(
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

    const accessToken = tokenRes.data.access_token;
    const refreshToken = tokenRes.data.refresh_token;

    // Fetch Discord user info
    const me = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Store or update in DB
    await Streamer.updateOrCreate(
      { ownerId: me.data.id },
      {
        displayName: me.data.username,
        discordAuth: {
          accessToken,
          refreshToken,
          expiresIn: tokenRes.data.expires_in,
          obtainedAt: Date.now(),
        },
      }
    );

    console.log(`✅ Discord OAuth success for ${me.data.username}`);
    res.redirect(`${process.env.FRONTEND_URL || "/"}/dashboard`);
  } catch (err) {
    console.error("❌ Discord OAuth error:", err.response?.data || err.message);
    res.status(500).send("Discord OAuth failed");
  }
});

export default router;
