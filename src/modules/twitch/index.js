// src/modules/twitch/index.js
import tmi from "tmi.js";
import axios from "axios";
import { Streamer } from "../../models/Streamer.js";
import { emitEvent } from "../../core/eventBus.js";
import { logTwitchEvent, logModerationEvent } from "../../core/logger.js";
import { checkMessageSafety } from "../../core/moderation.js";
import { getAppAccessToken, refreshTwitchToken } from "./auth.js";

let twitchClient = null;
let connected = false;

const SIMPLE_HATE_FILTER = /(slur1|slur2|kill yourself|go back to)/i;

export async function initTwitch() {
  const user = await Streamer.findOne({ "twitchAuth.accessToken": { $exists: true } }).sort({ updatedAt: -1 });
  if (!user) {
    console.warn("⚠️ No streamer found with Twitch credentials — skipping init.");
    return;
  }

  let username = user.twitchBot?.username || process.env.TWITCH_BOT_USERNAME;
  let channel = user.twitchBot?.channel || process.env.TWITCH_CHANNEL;
  let token = user.twitchAuth?.accessToken || process.env.TWITCH_OAUTH_TOKEN;

  if (!username || !channel || !token) {
    console.warn("⚠️ Twitch credentials missing — attempting refresh...");
    try {
      token = await refreshTwitchToken(user.ownerId);
    } catch (e) {
      console.error("❌ Twitch login failed — skipping init.", e.message);
      return;
    }
  }

  twitchClient = new tmi.Client({
    identity: { username, password: `oauth:${String(token).replace(/^oauth:/, "")}` },
    channels: [channel],
    connection: { reconnect: true, secure: true },
  });

  twitchClient.on("connected", async () => {
    connected = true;
    console.log(`🟣 Twitch bot connected as ${username} in #${channel}`);
    emitEvent(user._id?.toString() || "global", "twitch.connected", { username, channel });
    await logTwitchEvent("connected", { username, channel });

    // ensure EventSubs are registered
  if (user?.ownerId) {
  await registerAllEventSubsForStreamer(user.ownerId);
}
});

  twitchClient.on("message", async (target, tags, message, self) => {
    if (self) return;

    const streamerId = user._id?.toString() || "global";
    const display = tags["display-name"] || tags.username;
    const text = message.trim();

    await logTwitchEvent("message", { user: display, channel: target, message: text }, streamerId);

    if (SIMPLE_HATE_FILTER.test(text)) {
      await timeoutUser(display, 600, "Hate speech / slur");
      await twitchClient.say(target, `⛔ Message removed. ${display} timed out.`);
      await logModerationEvent(streamerId, { platform: "twitch", user: display, action: "timeout", reason: "hate_speech" });
      return;
    }

    const modHit = await checkMessageSafety(streamerId, text);
    if (modHit) {
      await timeoutUser(tags.username, modHit.duration, modHit.reason);
      await twitchClient.say(target, `⛔ Message removed. ${tags.username} timed out.`);
      await logModerationEvent(streamerId, {
        platform: "twitch",
        user: tags.username,
        message: text,
        action: "timeout",
        reason: modHit.reason,
      });
      return;
    }

    emitEvent(streamerId, "twitch.chat", { user: display, message: text });
  });

  await twitchClient.connect();
  console.log("✅ Twitch client initialized.");

  setInterval(async () => {
    try {
      await refreshTwitchToken(user.ownerId);
    } catch {
      /* ignore */
    }
  }, 1000 * 60 * 60 * 24);
}

async function ensureEventSub(broadcasterId, appToken) {
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
        Authorization: `Bearer ${appToken}`,
        "Content-Type": "application/json",
      },
    }
  );
}

export function isTwitchConnected() {
  return connected;
}

export async function sendTwitchMessage(message, channel) {
  if (!connected) throw new Error("Twitch not connected");
  const target = channel || twitchClient.getChannels?.()[0] || process.env.TWITCH_CHANNEL;
  await twitchClient.say(target, message);
  await logTwitchEvent("system_message", { target, message });
}

export async function timeoutUser(username, seconds = 600, reason = "Timeout") {
  if (!connected) throw new Error("Twitch not connected");
  const channel = twitchClient.getChannels?.()[0] || `#${process.env.TWITCH_CHANNEL}`;
  try {
    if (typeof twitchClient.timeout === "function") {
      await twitchClient.timeout(channel, username, seconds, reason);
    } else {
      await twitchClient.say(channel, `/timeout ${username} ${seconds} ${reason}`);
    }
  } catch (e) {
    console.warn("⚠️ Timeout fallback:", e.message);
  }
}
