// src/routes/auth.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { Streamer } from "../models/Streamer.js";
import { provisionDefaultsForStreamer } from "../utils/provisionDefaults.js";

const router = express.Router();
dotenv.config({ path: process.env.ENV_PATH || ".env" });

/**
 * Step 1: Redirect user to Twitch for authorization
 */
router.get("/twitch", (req, res) => {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const redirectUri = `${process.env.BACKEND_URL}/api/auth/twitch/callback`;
  const scope = [
    "chat:read",
    "chat:edit",
    "channel:read:redemptions",
    "channel:manage:redemptions",
    "moderator:read:chatters",
    "moderator:manage:banned_users",
    "channel:read:subscriptions",
    "user:read:email",
  ].join(" ");

  const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${encodeURIComponent(scope)}&state=frontend`;

  console.log("🔗 Redirecting to Twitch OAuth:", authUrl);
  return res.redirect(authUrl);
});

/**
 * Step 2: Handle Twitch callback and persist credentials
 */
router.get("/twitch/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing OAuth code");

  const redirectUri = `${process.env.BACKEND_URL}/api/auth/twitch/callback`;

  console.log("🔑 OAuth Debug:", {
    client_id: process.env.TWITCH_CLIENT_ID,
    redirect_uri: redirectUri,
  });

  try {
    // 1️⃣ Exchange the code for access/refresh tokens
    const tokenRes = await axios.post("https://id.twitch.tv/oauth2/token", null, {
      params: {
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      },
    });

    const { access_token, refresh_token, expires_in, scope } = tokenRes.data;

    // 2️⃣ Fetch user info
    const userRes = await axios.get("https://api.twitch.tv/helix/users", {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${access_token}`,
      },
    });

    const u = userRes.data.data?.[0];
    if (!u) throw new Error("No Twitch user returned from API");

    // 3️⃣ Upsert streamer record
    const streamerDoc = await Streamer.findOneAndUpdate(
      { twitchId: u.id },
      {
        twitchId: u.id,
        twitchAuth: {
          accessToken: access_token,
          refreshToken: refresh_token,
          scope,
          obtainedAt: Date.now(),
          expiresIn: expires_in,
        },
        twitchBot: {
          username: u.login,
          channel: u.login,
        },
        displayName: u.display_name,
      },
      { upsert: true, new: true }
    );

    // 4️⃣ Provision defaults (commands, automations, moderation)
    await provisionDefaultsForStreamer(streamerDoc._id);

    console.log(`✅ Twitch OAuth success for ${u.display_name} (${u.login})`);

    // 5️⃣ Redirect to frontend dashboard
    const frontend = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
    return res.redirect(`${frontend}/dashboard`);
  } catch (err) {
    console.error("❌ Twitch OAuth failed:", err.response?.data || err.message);
    return res.status(500).json({
      error: "Twitch OAuth failed",
      details: err.response?.data || err.message,
    });
  }
});
/* ─────────────────────────────────────────
   DISCORD OAUTH (optional – safe to keep)
────────────────────────────────────────── */
const DISCORD_SCOPES = ["identify", "guilds"];

router.get("/discord", (req, res) => {
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", process.env.DISCORD_CLIENT_ID);
  url.searchParams.set("redirect_uri", process.env.DISCORD_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", DISCORD_SCOPES.join(" "));
  if (req.query.state) url.searchParams.set("state", String(req.query.state));
  res.redirect(url.toString());
});

router.get("/discord/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing OAuth code");

  try {
    // 1) Exchange code
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

    const accessToken = tokenRes.data.access_token;

    // 2) Fetch user
    const me = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // 3) Persist under the SAME ownerId as Twitch *if you want cross-linking*.
    // If you prefer Discord to write/own a separate ownerId, you can store a mapping collection.
    // For now, we store discord on the same document IF it already exists, else create a discord-only doc.
    const existing = await Streamer.findOne({ ownerId: me.data.id }).lean(false);
    const ownerId = existing?.ownerId || me.data.id;

    await Streamer.setDiscordAuth(ownerId, {
      accessToken,
      refreshToken: tokenRes.data.refresh_token,
      scope: (tokenRes.data.scope || "").split(" ").filter(Boolean),
      obtainedAt: Date.now(),
      expiresIn: tokenRes.data.expires_in,
    });

    await Streamer.updateOrCreateByOwner(ownerId, {
      displayName: existing?.displayName || me.data.username,
    });

    const dest = (process.env.FRONTEND_URL || "").replace(/\/$/, "") || "";
    res.redirect(dest ? `${dest}/dashboard` : "/dashboard");
  } catch (e) {
    console.error("Discord OAuth error:", e.response?.data || e.message);
    res.status(500).send("Discord OAuth failed");
  }
});

/* ─────────────────────────────────────────
   STATUS (handy for frontend “Connect” buttons)
────────────────────────────────────────── */
router.get("/status", async (_req, res) => {
  const s = await Streamer.getActiveStreamer();
  if (!s) return res.json({ twitch: false, discord: false });

  res.json({
    twitch: Boolean(s?.twitchAuth?.accessToken),
    discord: Boolean(s?.discordAuth?.accessToken),
    displayName: s?.displayName || null,
    channel: s?.twitchBot?.channel || null,
  });
});

export default router;
