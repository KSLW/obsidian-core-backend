// src/routes/auth.js
import express from "express";
import axios from "axios";
import { Streamer } from "../models/Streamer.js";
import { provisionDefaultsForStreamer } from "../utils/provisionDefaults.js";

const router = express.Router();

/* ─────────────────────────────────────────
   TWITCH OAUTH
────────────────────────────────────────── */
const TWITCH_SCOPES = [
  "chat:read",
  "chat:edit",
  "moderator:read:chatters",
  "channel:read:redemptions",
  "channel:read:subscriptions",
  "user:read:email",
];

router.get("/twitch", (req, res) => {
  const url = new URL("https://id.twitch.tv/oauth2/authorize");
  url.searchParams.set("client_id", process.env.TWITCH_CLIENT_ID);
  url.searchParams.set("redirect_uri", process.env.TWITCH_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", TWITCH_SCOPES.join(" "));
  // optional: pass state= to restore UI flow
  if (req.query.state) url.searchParams.set("state", String(req.query.state));
  res.redirect(url.toString());
});

router.get("/twitch/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing OAuth code");

  try {
    // 1) Exchange code
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

    // 2) Fetch user
    const userRes = await axios.get("https://api.twitch.tv/helix/users", {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const u = userRes.data.data?.[0];
    if (!u?.id) throw new Error("No Twitch user returned");

    // 3) Persist
    await Streamer.setTwitchAuth(
      u.id,
      {
        accessToken,
        refreshToken: tokenRes.data.refresh_token,
        scope: tokenRes.data.scope || [],
        obtainedAt: Date.now(),
        expiresIn: tokenRes.data.expires_in,
      },
      {
        username: u.login,
        channel: u.login,
      }
    );
    await Streamer.updateOrCreateByOwner(u.id, { displayName: u.display_name });

    // 4) Redirect back to app
    const dest = (process.env.FRONTEND_URL || "").replace(/\/$/, "") || "";
    res.redirect(dest ? `${dest}/dashboard` : "/dashboard");
  } catch (e) {
    console.error("Twitch OAuth error:", e.response?.data || e.message);
    res.status(500).send("Twitch OAuth failed");
  }

  // inside auth/twitch callback
  await provisionDefaultsForStreamer(Streamer._id);

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
