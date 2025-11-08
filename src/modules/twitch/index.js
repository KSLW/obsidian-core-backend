// ────────────────────────────────
//  Twitch Integration (Production Optimized)
// ────────────────────────────────
import tmi from "tmi.js";
import axios from "axios";
import { Streamer } from "../../models/Streamer.js";
import { emitEvent } from "../../core/eventBus.js";
import { logTwitchEvent, logModerationEvent } from "../../core/logger.js";
import { checkMessageSafety } from "../../core/moderation.js";
import { getAppAccessToken, refreshTwitchToken } from "./auth.js";
import { executeCommand } from "../../core/commands.js";

let twitchClient = null;
let connected = false;
let refreshInterval = null;

// Basic emergency moderation filter
const SIMPLE_HATE_FILTER = /(slur1|slur2|kill yourself|go back to)/i;

/* ────────────────────────────────
   🟣 Initialize Twitch Bot
──────────────────────────────── */
export async function initTwitch() {
  if (connected && twitchClient) {
    console.log("⚠️ Twitch bot already connected — skipping reinit.");
    return;
  }

  const user = await Streamer.findOne({
    "twitchAuth.accessToken": { $exists: true },
  }).sort({ updatedAt: -1 });

  if (!user || !user.ownerId) {
    console.warn("⚠️ No valid Twitch user found — skipping Twitch init.");
    return;
  }

  let username = user.twitchBot?.username || process.env.TWITCH_BOT_USERNAME;
  let channel = user.twitchBot?.channel || process.env.TWITCH_CHANNEL;
  let token = user.twitchAuth?.accessToken || process.env.TWITCH_OAUTH_TOKEN;

  if (!username || !channel || !token) {
    console.warn("⚠️ Twitch credentials missing — attempting token refresh...");
    try {
      token = await refreshTwitchToken(user.ownerId);
    } catch (err) {
      console.error("❌ Twitch login failed — skipping init:", err.message);
      return;
    }
  }

  twitchClient = new tmi.Client({
    identity: { username, password: `oauth:${String(token).replace(/^oauth:/, "")}` },
    channels: [channel],
    connection: { reconnect: true, secure: true },
  });

  /* ────────────────────────────────
     ✅ Connected Event
  ───────────────────────────────── */
  twitchClient.on("connected", async () => {
    connected = true;
    console.log(`🟣 Twitch bot connected as ${username} in #${channel}`);
    emitEvent(user._id?.toString() || "global", "twitch.connected", { username, channel });

    await logTwitchEvent({
      type: "connected",
      user: username,
      channel,
    });

    // Ensure EventSub subscription
    if (user.ownerId && process.env.PUBLIC_URL && process.env.TWITCH_EVENTSUB_SECRET) {
      try {
        const appToken = await getAppAccessToken();
        await ensureEventSub(user.ownerId, appToken);
      } catch (err) {
        console.warn("⚠️ EventSub ensure failed:", err.response?.data || err.message);
      }
    }
  });

  /* ────────────────────────────────
     ⚠️ Disconnection Handling
  ───────────────────────────────── */
  twitchClient.on("disconnected", (reason) => {
    connected = false;
    console.warn(`⚠️ Twitch bot disconnected: ${reason}`);
    emitEvent("global", "twitch.disconnected", { reason });
  });

  /* ────────────────────────────────
     💬 Message Handling (Moderation + Commands)
  ───────────────────────────────── */
  twitchClient.on("message", async (target, tags, message, self) => {
    if (self) return;

    const streamerId = user._id?.toString() || "global";
    const display = tags["display-name"] || tags.username;
    const text = message.trim();

    await logTwitchEvent({
      type: "message",
      user: display,
      channel: target,
      message: text,
      streamerId,
    });

    // 🚫 Basic moderation
    if (SIMPLE_HATE_FILTER.test(text)) {
      await timeoutUser(display, 600, "Hate speech / slur");
      await twitchClient.say(target, `⛔ Message removed. ${display} timed out.`);
      emitEvent(streamerId, "twitch.moderation.timeout", { user: display, reason: "hate_speech" });
      await logModerationEvent(streamerId, {
        platform: "twitch",
        user: display,
        action: "timeout",
        reason: "hate_speech",
        duration: 600,
      });
      return;
    }

    // 🔍 Advanced moderation (custom rules)
    const hit = await checkMessageSafety(streamerId, text);
    if (hit) {
      const reason = hit.reason || "auto_mod";
      if (hit.action === "ban") {
        await twitchClient.say(target, `/ban ${tags.username} ${reason}`);
      } else {
        await timeoutUser(tags.username, hit.duration || 600, reason);
      }
      await twitchClient.say(target, `⛔ Message removed. ${tags.username} timed out.`);
      await logModerationEvent(streamerId, {
        platform: "twitch",
        user: tags.username,
        message: text,
        action: hit.action || "timeout",
        reason,
        meta: { pattern: hit.pattern?.toString(), duration: hit.duration || 600 },
      });
      return;
    }

    // 💬 Commands
    if (text.startsWith("!")) {
      const name = text.slice(1).split(" ")[0].toLowerCase();

      // Try database-based command first
      const executed = await executeCommand(streamerId, name, display, twitchClient, target);
      if (executed) return;

      // Fallback built-in commands
      if (name === "hello") {
        await twitchClient.say(target, `Hey ${display}! 👋`);
        return;
      }
      if (name === "hydrate") {
        await twitchClient.say(target, `💧 Stay hydrated, ${display}!`);
        return;
      }
    }

    emitEvent(streamerId, "twitch.chat", { user: display, message: text });

    // Chat commands:
emitEvent(streamerId, "twitch.chat.command", {
  command: name,           // "hydrate"
  user: display,           // "SomeViewer"
  message: text,           // raw message
});

// Channel point redemptions (from EventSub handler):
emitEvent(streamerId, "twitch.redemption", {
  reward: redemptionTitleOrId,
  user: userDisplay,
  cost: redemptionCost,
  input: userInput,
});

  });

  /* ────────────────────────────────
     🔄 Connect & Token Maintenance
  ───────────────────────────────── */
  try {
    await twitchClient.connect();
    console.log("✅ Twitch client initialized.");
  } catch (err) {
    console.error("❌ Twitch init error:", err.message);
  }

  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(async () => {
    try {
      await refreshTwitchToken(user.ownerId);
    } catch (err) {
      console.warn("⚠️ Twitch token refresh failed (interval):", err.message);
    }
  }, 1000 * 60 * 60 * 24); // every 24 hours
}

/* ────────────────────────────────
   🔔 EventSub Registration Helper
──────────────────────────────── */
async function ensureEventSub(broadcasterId, appToken) {
  try {
    const { data } = await axios.get("https://api.twitch.tv/helix/eventsub/subscriptions", {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${appToken}`,
      },
    });

    const existing = data.data.find(
      (sub) =>
        sub.condition?.broadcaster_user_id === broadcasterId &&
        sub.type === "channel.channel_points_custom_reward_redemption.add"
    );

    if (existing) {
      console.log(`✅ EventSub already active for ${broadcasterId}`);
      return;
    }

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

    console.log("✅ EventSub registered successfully.");
  } catch (err) {
    console.warn("⚠️ EventSub registration failed:", err.response?.data || err.message);
  }
}

/* ────────────────────────────────
   🧩 Utility Exports
──────────────────────────────── */
export function isTwitchConnected() {
  return connected;
}

export async function sendTwitchMessage(message, channel) {
  if (!connected) throw new Error("Twitch not connected");
  const target = channel || twitchClient.getChannels?.()[0] || process.env.TWITCH_CHANNEL;
  await twitchClient.say(target, message);
  await logTwitchEvent({
    type: "system_message",
    meta: { target, message },
  });
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
    console.log(`⏱️ Timed out ${username} for ${seconds}s — Reason: ${reason}`);
  } catch (err) {
    console.warn(`⚠️ Failed to timeout ${username}:`, err.message);
  }
}
