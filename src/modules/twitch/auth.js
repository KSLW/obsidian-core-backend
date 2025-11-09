// src/modules/twitch/auth.js
import axios from "axios";
import dotenv from "dotenv";
import { Streamer } from "../../models/Streamer.js";
dotenv.config({ path: process.env.ENV_PATH || ".env" });

/**
 * Fetch an App Access Token for EventSub or server-to-server requests
 */
export async function getAppAccessToken() {
  const url = "https://id.twitch.tv/oauth2/token";
  const params = {
    client_id: process.env.TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_CLIENT_SECRET,
    grant_type: "client_credentials",
  };

  try {
    const res = await axios.post(url, null, { params });
    return res.data.access_token;
  } catch (e) {
    console.error("⚠️ Failed to fetch app access token:", e.response?.data || e.message);
    throw e;
  }
}

/**
 * Refresh a Twitch user access token
 */
export async function refreshTwitchToken(ownerId) {
  const streamer = await Streamer.findOne({ ownerId });
  if (!streamer?.twitchAuth?.refreshToken) {
    console.warn("⚠️ No refresh token for streamer:", ownerId);
    return null;
  }

  try {
    const res = await axios.post("https://id.twitch.tv/oauth2/token", null, {
      params: {
        grant_type: "refresh_token",
        refresh_token: streamer.twitchAuth.refreshToken,
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
      },
    });

    streamer.twitchAuth.accessToken = res.data.access_token;
    streamer.twitchAuth.refreshToken = res.data.refresh_token || streamer.twitchAuth.refreshToken;
    streamer.twitchAuth.obtainedAt = Date.now();
    await streamer.save();

    console.log(`🔁 Twitch token refreshed for ${streamer.displayName || streamer.ownerId}`);
    return res.data.access_token;
  } catch (err) {
    console.error("⚠️ Twitch token refresh failed:", err.response?.data || err.message);
    return null;
  }
}

// 🧠 Simple background refresher loop
export function startTokenRefreshLoop() {
  // Twitch tokens expire every 60 days — we refresh every 24h safely
  const intervalMs = 1000 * 60 * 60 * 24;

  setInterval(async () => {
    try {
      const streamers = await Streamer.find({ "twitchAuth.refreshToken": { $exists: true } });
      for (const s of streamers) {
        console.log(`⏳ Refreshing Twitch token for ${s.twitchBot?.username || s.ownerId}`);
        await refreshTwitchToken(s.ownerId);
      }
    } catch (e) {
      console.warn("⚠️ Background token refresh failed:", e.message);
    }
  }, intervalMs);
}
