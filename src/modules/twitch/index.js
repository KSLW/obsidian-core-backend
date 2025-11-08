// ────────────────────────────────
//  Twitch Integration Module
// ────────────────────────────────
import tmi from "tmi.js";
import axios from "axios";
import dotenv from "dotenv";
import { Streamer } from "../../models/Streamer.js";
import { emitEvent } from "../../core/eventBus.js";
import { getTwitchCommand } from "../../core/registry.js";
import { logTwitchEvent, logModerationEvent } from "../../core/logger.js";
import { checkMessageSafety } from "../../core/moderation.js";
import { refreshTwitchToken } from "./auth.js";
import { handleTwitchAuthFailure } from "./auth.js";

dotenv.config({ path: process.env.ENV_PATH || ".env" });

let twitchClient = null;
let connected = false;

// Reconnection backoff
const RECONNECT_DELAY = 30 * 1000; // 30s between reconnect attempts
let reconnectAttempts = 0;


/* ────────────────────────────────
   ⚙️ Config / Moderation
──────────────────────────────── */
const BAN_REGEX = /(slur1|slur2|kill yourself|go back to)/i;

/* ────────────────────────────────
   🔑 Get App Access Token (EventSub)
──────────────────────────────── */
async function getAppAccessToken() {
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

/* ────────────────────────────────
   📡 Register EventSub (Channel Points)
──────────────────────────────── */
export async function registerEventSubRedemption(broadcasterId, accessToken) {
  try {
    if (!accessToken) throw new Error("Missing EventSub access token");

    await axios.post(
      "https://api.twitch.tv/helix/eventsub/subscriptions",
      {
        type: "channel.channel_points_custom_reward_redemption.add",
        version: "1",
        condition: { broadcaster_user_id: broadcasterId },
        transport: {
          method: "webhook",
          callback: `${process.env.PUBLIC_URL}/api/twitch/eventsub/callback`,
          secret: process.env.TWITCH_EVENTSUB_SECRET,
        },
      },
      {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ EventSub registered for channel point redemptions (${broadcasterId})`);
  } catch (err) {
    const msg = err.response?.data || err.message;
    if (err.response?.status === 409) {
      console.log("⚠️ EventSub already exists (409 Conflict) — continuing");
    } else {
      console.warn("⚠️ EventSub registration failed:", msg);
    }
  }
}

/* ────────────────────────────────
   🔌 Connect Twitch Client
──────────────────────────────── */
async function connectTwitchClient(username, channel, token, user) {
  const client = new tmi.Client({
    identity: { username, password: `oauth:${token.replace(/^oauth:/, "")}` },
    channels: [channel],
    connection: { reconnect: true, secure: true },
  });

  client.on("connected", () => {
    connected = true;
    console.log(`🟣 Twitch bot connected as ${username} in #${channel}`);
    emitEvent(user?._id || "global", "twitch.connected", { username, channel });
    logTwitchEvent({ type: "connected", user: username, channel });
  });

  client.on("disconnected", (reason) => {
    connected = false;
    console.warn(`⚠️ Twitch bot disconnected: ${reason}`);
    emitEvent("global", "twitch.disconnected", { reason });
  });

  await client.connect();
  return client;
}

/* ────────────────────────────────
   🤖 Twitch Bot Initialization
──────────────────────────────── */
export async function initTwitch() {
  try {
    const user = await Streamer.findOne({ "twitchAuth.accessToken": { $exists: true } });
    if (!user) {
      console.warn("⚠️ No streamer found with Twitch credentials — skipping init.");
      return;
    }

    let username = user.twitchBot?.username || process.env.TWITCH_BOT_USERNAME;
    let channel = user.twitchBot?.channel || process.env.TWITCH_CHANNEL;
    let token = user.twitchAuth?.accessToken || process.env.TWITCH_OAUTH_TOKEN;

    // Attempt connection
    try {
      twitchClient = await connectTwitchClient(username, channel, token, user);
      // ────────────────────────────────
// 🔁 Auto-Reconnect Handlers
// ────────────────────────────────
twitchClient.on("disconnected", async (reason) => {
  connected = false;
  console.warn(`⚠️ Twitch disconnected: ${reason}`);
  emitEvent("global", "twitch.disconnected", { reason });

  // Wait a bit before retry
  setTimeout(() => reconnectTwitch(user), RECONNECT_DELAY);
});

twitchClient.on("reconnect", () => {
  console.log("🔄 Twitch is reconnecting...");
});

twitchClient.on("error", async (err) => {
  console.error("❌ Twitch client error:", err.message);
  if (err.message?.includes("authentication") || err.message?.includes("Invalid OAuth")) {
    console.warn("🔁 Detected expired token, refreshing...");
    await reconnectTwitch(user);
  }
});
setInterval(() => {
  if (connected) {
    console.log("💓 Twitch connection healthy.");
  }
}, 1000 * 60 * 5); // every 5 minutes

    } catch (err) {
      console.warn("⚠️ Twitch connection failed, trying token refresh...");
      token = await refreshTwitchToken(user.ownerId);
      if (token) twitchClient = await connectTwitchClient(username, channel, token, user);
      else throw new Error("Twitch token refresh failed.");
    }

    async function reconnectTwitch(user) {
  try {
    reconnectAttempts++;
    console.warn(`🔄 Attempting Twitch reconnect (attempt ${reconnectAttempts})...`);

    let username = user.twitchBot?.username || process.env.TWITCH_BOT_USERNAME;
    let channel = user.twitchBot?.channel || process.env.TWITCH_CHANNEL;
    let token = user.twitchAuth?.accessToken || process.env.TWITCH_OAUTH_TOKEN;

    // Refresh the token if 3+ failures or after 10 minutes
    if (reconnectAttempts % 3 === 0) {
      console.log("♻️ Forcing token refresh before reconnect...");
      token = await refreshTwitchToken(user.ownerId);
    }

    twitchClient = await connectTwitchClient(username, channel, token, user);

    const appToken = await getAppAccessToken();
    if (appToken) await registerEventSubRedemption(user.ownerId, appToken);

    reconnectAttempts = 0;
    console.log("✅ Twitch successfully reconnected and EventSub restored.");

  } catch (err) {
    console.error(`❌ Reconnect failed (${reconnectAttempts}):`, err.message);
    setTimeout(() => reconnectTwitch(user), RECONNECT_DELAY);
  }
}


    // Register EventSub once connected
    const appToken = await getAppAccessToken();
    if (appToken) await registerEventSubRedemption(user.ownerId, appToken);

    // Chat handler
    twitchClient.on("message", async (target, tags, message, self) => {
      if (self || !connected) return;
      const streamerId = user._id || "global";
      const display = tags["display-name"] || tags.username;
      const text = message.trim();

      logTwitchEvent({ type: "message", user: display, channel: target, meta: { message: text } });

      // 🚫 Moderation
      if (BAN_REGEX.test(text)) {
        await timeoutUser(display, 600, "Hate speech / slur");
        await twitchClient.say(target, `⛔ ${display} timed out.`);
        emitEvent(streamerId, "twitch.moderation.timeout", { user: display, reason: "hate_speech" });
        logModerationEvent({
          platform: "twitch",
          user: display,
          action: "timeout",
          reason: "hate_speech",
          duration: 600,
        });
        return;
      }

      // Commands
      if (text.startsWith("!")) {
        const name = text.slice(1).split(" ")[0].toLowerCase();
        const cmd = getTwitchCommand(streamerId, name);

        if (cmd?.response) {
          const msg = cmd.response.replace("{username}", display);
          await twitchClient.say(target, msg);
          emitEvent(streamerId, "twitch.chat.command", { user: display, command: name });
          logTwitchEvent({ type: "command", user: display, meta: { command: name, response: msg } });
          return;
        }
      }

      // Advanced moderation
      const modHit = await checkMessageSafety(streamerId, text);
      if (modHit) {
        await timeoutUser(tags.username, modHit.duration, modHit.reason);
        await twitchClient.say(target, `⛔ ${tags.username} timed out (${modHit.reason}).`);
        logModerationEvent({
          platform: "twitch",
          user: tags.username,
          message: text,
          action: "timeout",
          reason: modHit.reason,
          meta: { pattern: modHit.pattern, duration: modHit.duration },
        });
        return;
      }

      emitEvent(streamerId, "twitch.chat", { user: display, message: text });
    });

    // Daily refresh
    setInterval(async () => {
      console.log("⏳ Checking Twitch token validity...");
      await refreshTwitchToken(user.ownerId);
    }, 1000 * 60 * 60 * 24);

    console.log("✅ Twitch client initialized.");
  } catch (err) {
    console.error("❌ Twitch init error:", err.message);
  }
}

/* ────────────────────────────────
   🔧 Utility Methods
──────────────────────────────── */
export function isTwitchConnected() {
  return connected;
}

export async function sendTwitchMessage(message, channel) {
  if (!connected || !twitchClient) throw new Error("Twitch not connected");
  const target = channel || twitchClient.getChannels?.()[0] || process.env.TWITCH_CHANNEL;
  await twitchClient.say(target, message);
  console.log(`🟣 Sent Twitch message → ${target}: ${message}`);
  logTwitchEvent({ type: "system_message", meta: { target, message } });
}

export async function timeoutUser(username, seconds = 600, reason = "Timeout") {
  if (!connected || !twitchClient) throw new Error("Twitch not connected");
  try {
    const channel = twitchClient.getChannels?.()[0] || `#${process.env.TWITCH_CHANNEL}`;
    if (!channel) throw new Error("No Twitch channel found");

    if (typeof twitchClient.timeout === "function")
      await twitchClient.timeout(channel, username, seconds, reason);
    else await twitchClient.say(channel, `/timeout ${username} ${seconds} ${reason}`);

    console.log(`⏱️ Timed out ${username} for ${seconds}s — Reason: ${reason}`);
  } catch (err) {
    console.error(`❌ Failed to timeout ${username}:`, err.message);
  }
}

async function safeTwitchApiCall(ownerId, fn) {
  try {
    return await fn();
  } catch (err) {
    if (err.response?.status === 401) {
      const newToken = await handleTwitchAuthFailure(ownerId);
      if (newToken) {
        return await fn(newToken); // retry once with refreshed token
      }
    }
    throw err;
  }
}
