import express from "express";
import axios from "axios";
import { Streamer } from "../models/Streamer.js";

const router = express.Router();

function requireEnv(vars) {
  for (const v of vars) {
    if (!process.env[v]) throw new Error(`Missing env: ${v}`);
  }
}

/* ───────── TWITCH: Login ───────── */
router.get("/twitch", (req, res) => {
  requireEnv(["TWITCH_CLIENT_ID", "BACKEND_URL"]);
  const redirectUri = `${process.env.BACKEND_URL.replace(/\/$/, "")}/api/auth/twitch/callback`;
  const url = new URL("https://id.twitch.tv/oauth2/authorize");
  url.searchParams.set("client_id", process.env.TWITCH_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set(
    "scope",
    [
      "chat:read",
      "chat:edit",
      "moderator:read:chatters",
      "moderator:manage:banned_users",
      "channel:read:redemptions",
      "channel:manage:redemptions",
      "channel:read:subscriptions",
      "user:read:email",
    ].join(" ")
  );
  res.redirect(url.toString());
});

/* ───────── TWITCH: Callback ───────── */
router.get("/twitch/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing OAuth code");
  try {
    requireEnv(["TWITCH_CLIENT_ID", "TWITCH_CLIENT_SECRET", "BACKEND_URL"]);
    const redirectUri = `${process.env.BACKEND_URL.replace(/\/$/, "")}/api/auth/twitch/callback`;

    const tokenRes = await axios.post("https://id.twitch.tv/oauth2/token", null, {
      params: {
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
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

    const u = userRes.data.data?.[0];
    if (!u?.id) throw new Error("No Twitch user returned");

    await Streamer.setTwitchAuth(
      u.id,
      {
        accessToken,
        refreshToken: tokenRes.data.refresh_token,
        scope: tokenRes.data.scope || [],
        obtainedAt: Date.now(),
        expiresIn: tokenRes.data.expires_in,
      },
      { username: u.login, channel: u.login }
    );

    await Streamer.updateOrCreateByOwner(u.id, {
      displayName: u.display_name,
      twitchUsername: u.login,
    });

    const dest = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
    res.redirect(dest ? `${dest}/dashboard` : "/");
  } catch (e) {
    console.error("Twitch OAuth error:", e.response?.data || e.message);
    res.status(500).send("Twitch OAuth failed");
  }
});

export default router;
