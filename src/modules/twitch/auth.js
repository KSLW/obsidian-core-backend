// src/modules/twitch/auth.js
import axios from "axios";
import dotenv from "dotenv";
import { Streamer } from "../../models/Streamer.js";
dotenv.config({ path: process.env.ENV_PATH || ".env" });

// refresh streamer token
export async function refreshTwitchToken(ownerId) {
  try {
    const user = await Streamer.findOne({ ownerId });
    if (!user?.twitchAuth?.refreshToken) throw new Error("Missing refresh token");

    const res = await axios.post("https://id.twitch.tv/oauth2/token", null, {
      params: {
        grant_type: "refresh_token",
        refresh_token: user.twitchAuth.refreshToken,
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
      },
    });

    user.twitchAuth.accessToken = res.data.access_token;
    user.twitchAuth.refreshToken = res.data.refresh_token;
    user.twitchAuth.expiresIn = res.data.expires_in;
    await user.save();

    console.log("🔁 Twitch token refreshed successfully");
    return res.data.access_token;
  } catch (err) {
    console.warn("⚠️ Twitch token refresh failed:", err.response?.data || err.message);
    return null;
  }
}

// app access token for EventSub
export async function getAppAccessToken() {
  try {
    const res = await axios.post("https://id.twitch.tv/oauth2/token", null, {
      params: {
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: "client_credentials",
      },
    });
    return res.data.access_token;
  } catch (err) {
    console.error("❌ Failed to get app access token:", err.response?.data || err.message);
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
