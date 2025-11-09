// src/modules/twitch/auth.js
import axios from "axios";
import dotenv from "dotenv";
import { Streamer } from "../../models/Streamer.js";
dotenv.config({ path: process.env.ENV_PATH || ".env" });

// 🧠 Helper to get a new app access token for EventSub, etc.
export async function getAppAccessToken() {
  const res = await axios.post("https://id.twitch.tv/oauth2/token", null, {
    params: {
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: "client_credentials",
    },
  });
  return res.data.access_token;
}

// 🔁 Refresh a streamer's user OAuth token
export async function refreshTwitchToken(ownerId) {
  try {
    const streamer = await Streamer.findOne({ ownerId });
    if (!streamer?.twitchAuth?.refreshToken) {
      console.warn("⚠️ No refresh token found for this streamer");
      return null;
    }

    const { data } = await axios.post("https://id.twitch.tv/oauth2/token", null, {
      params: {
        grant_type: "refresh_token",
        refresh_token: streamer.twitchAuth.refreshToken,
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
      },
    });

    // Update Mongo
    streamer.twitchAuth.accessToken = data.access_token;
    streamer.twitchAuth.refreshToken = data.refresh_token;
    await streamer.save();

    console.log("🔁 Twitch token refreshed successfully");
    return data.access_token;
  } catch (err) {
    const msg = err.response?.data || err.message;
    console.warn("⚠️ Twitch token refresh failed:", msg);
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
