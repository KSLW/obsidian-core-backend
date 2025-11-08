// src/modules/twitch/auth.js
import axios from "axios";
import { Streamer } from "../../models/Streamer.js";

/** App-level token for EventSub, Helix app calls */
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

/** Refresh a broadcaster (user) token and persist it */
export async function refreshTwitchToken(ownerId) {
  const s = await Streamer.findOne({ ownerId }).lean(false);
  if (!s?.twitchAuth?.refreshToken) {
    throw new Error("No refresh token available");
  }

  const params = {
    client_id: process.env.TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: s.twitchAuth.refreshToken,
  };

  const { data } = await axios.post("https://id.twitch.tv/oauth2/token", null, { params });

  await Streamer.setTwitchAuth(ownerId, {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || s.twitchAuth.refreshToken, // Twitch may omit new RT
    scope: data.scope,
    obtainedAt: Date.now(),
    expiresIn: data.expires_in,
  });

  return data.access_token;
}

/** Ensure the stored token is valid; if near expiry, refresh it */
export async function ensureFreshUserToken(ownerId, skewSeconds = 300) {
  const s = await Streamer.findOne({ ownerId }).lean(false);
  if (!s?.twitchAuth?.accessToken) return null;

  const expiresAt = s.twitchAuth.expiresAt ? new Date(s.twitchAuth.expiresAt).getTime() : 0;
  const now = Date.now();

  if (!expiresAt || expiresAt - now <= skewSeconds * 1000) {
    try {
      return await refreshTwitchToken(ownerId);
    } catch (e) {
      // surface the error up – caller decides what to do next
      throw e;
    }
  }
  return s.twitchAuth.accessToken;
}
