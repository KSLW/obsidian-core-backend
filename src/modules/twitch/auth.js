// backend/src/modules/twitch/auth.js
import axios from "axios";
import dotenv from "dotenv";
import { Streamer } from "../../models/Streamer.js";
dotenv.config();

const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";

/**
 * Refresh a streamer's Twitch access token using their refresh_token.
 */
export async function refreshTwitchToken(ownerId) {
  try {
    const streamer = await Streamer.findOne({ ownerId });
    if (!streamer?.twitchAuth?.refreshToken) {
      console.warn(`⚠️ No refresh token found for ${ownerId}`);
      return null;
    }

    const { refreshToken } = streamer.twitchAuth;
    const params = new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const { data } = await axios.post(TWITCH_TOKEN_URL, params);
    const update = {
      "twitchAuth.accessToken": data.access_token,
      "twitchAuth.refreshToken": data.refresh_token ?? refreshToken,
      "twitchAuth.expiresIn": data.expires_in,
      "twitchAuth.obtainedAt": Date.now(),
    };

    await Streamer.updateOne({ ownerId }, { $set: update });
    console.log(`🔁 Twitch token refreshed successfully for ${ownerId}`);
    return data.access_token;
  } catch (err) {
    const msg = err.response?.data || err.message;
    console.error("⚠️ Twitch token refresh failed:", msg);
    return null;
  }
}

/**
 * Force a token refresh if an API call fails with 401 Unauthorized.
 */
export async function handleTwitchAuthFailure(ownerId) {
  console.warn(`⚠️ Twitch auth failed for ${ownerId}, attempting refresh...`);
  const newToken = await refreshTwitchToken(ownerId);
  if (newToken) {
    console.log("✅ Twitch token auto-refreshed after 401 error");
    return newToken;
  }
  console.error("❌ Twitch re-auth failed — manual login required.");
  return null;
}
