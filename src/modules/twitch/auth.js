import axios from "axios";
import { Streamer } from "../../models/Streamer.js";

export async function getAppAccessToken() {
  const { data } = await axios.post("https://id.twitch.tv/oauth2/token", null, {
    params: {
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: "client_credentials",
    },
  });
  return data.access_token;
}

export async function refreshTwitchToken(ownerId) {
  const streamer = await Streamer.findOne({ ownerId });
  const refresh = streamer?.twitchAuth?.refreshToken || process.env.TWITCH_REFRESH_TOKEN;
  if (!refresh) throw new Error("No refresh token available");

  const { data } = await axios.post("https://id.twitch.tv/oauth2/token", null, {
    params: {
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refresh,
    },
  });

  await Streamer.updateOne(
    { ownerId },
    {
      $set: {
        "twitchAuth.accessToken": data.access_token,
        "twitchAuth.refreshToken": data.refresh_token || refresh,
        "twitchAuth.expiresIn": data.expires_in,
        "twitchAuth.obtainedAt": Date.now(),
      },
    }
  );

  return data.access_token;
}

export function startTokenRefreshLoop() {
  // simple daily maintenance (real logic can watch expires_in)
  setInterval(async () => {
    try {
      const s = await Streamer.findOne({ "twitchAuth.accessToken": { $exists: true } }).sort({ updatedAt: -1 });
      if (s?.ownerId) await refreshTwitchToken(s.ownerId);
    } catch { /* noop */ }
  }, 1000 * 60 * 60 * 24);
}
