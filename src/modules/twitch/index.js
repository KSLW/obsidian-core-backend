// backend/src/modules/twitch/index.js
import tmi from "tmi.js";
import axios from "axios";
import { Streamer } from "../../models/Streamer.js";
import { emitEvent } from "../../core/eventBus.js";
import { getTwitchCommand } from "../../core/registry.js";

let twitchClient = null;
let connected = false;
let eventSubRegistered = false;

/* ────────────────────────────────
   🔔 Register EventSub for redemptions
──────────────────────────────── */
async function registerEventSubRedemption(broadcasterId, accessToken) {
  if (eventSubRegistered) {
    console.log("ℹ️ EventSub already registered — skipping duplicate registration.");
    return;
  }

  try {
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

    eventSubRegistered = true;
    console.log("✅ EventSub: Channel point redemptions subscribed successfully");
  } catch (err) {
    console.error("⚠️ EventSub registration failed:", err.response?.data || err.message);
  }
}

/* ────────────────────────────────
   💬 Send message
──────────────────────────────── */
export async function sendTwitchMessage(message, channel) {
  if (!connected) throw new Error("Twitch not connected");
  const target = channel || process.env.TWITCH_CHANNEL;
  await twitchClient.say(target, message);
  console.log(`🟣 Sent Twitch message to #${target}: ${message}`);
}

/* ────────────────────────────────
   ⚙️ Run Twitch Action
──────────────────────────────── */
export async function runTwitchAction(type, params = {}) {
  switch (type) {
    case "send_message":
      return sendTwitchMessage(params.message, params.channel);
    default:
      console.warn(`⚠️ Unknown Twitch action type: ${type}`);
  }
}

/* ────────────────────────────────
   🟣 Initialize Twitch Bot
──────────────────────────────── */
export async function initTwitch() {
  try {
    const activeStreamer = await Streamer.findOne({
      "twitchAuth.accessToken": { $exists: true },
    });

    const username =
      activeStreamer?.twitchBot?.username || process.env.TWITCH_BOT_USERNAME;
    const token =
      activeStreamer?.twitchAuth?.accessToken || process.env.TWITCH_OAUTH_TOKEN;
    const channel =
      activeStreamer?.twitchBot?.channel || process.env.TWITCH_CHANNEL;

    if (!username || !token || !channel) {
      console.warn("⚠️ Twitch credentials missing — skipping init.");
      return;
    }

    // 🧠 Create chat client
    twitchClient = new tmi.Client({
      identity: {
        username,
        password: `oauth:${token.replace(/^oauth:/, "")}`,
      },
      channels: [channel],
    });

    // 🟣 Connected
    twitchClient.on("connected", async () => {
      connected = true;
      console.log(`🟣 Twitch bot connected as ${username} in #${channel}`);
      emitEvent("global", "twitchConnected", { username, channel });

      // Register EventSub on first startup
      if (activeStreamer?.twitchAuth?.accessToken && !eventSubRegistered) {
        await registerEventSubRedemption(
          activeStreamer.ownerId,
          activeStreamer.twitchAuth.accessToken
        );
      }
    });

    // 💬 Handle incoming messages
    twitchClient.on("message", async (target, tags, message, self) => {
      if (self) return;
      const user = tags["display-name"] || tags.username;
      const msg = message.trim().toLowerCase();
      const streamerId = "global";

      // Check if the message matches a custom command
      const cmd = getTwitchCommand(streamerId, msg.replace("!", ""));
      if (cmd) {
        await twitchClient.say(target, cmd.response);
        emitEvent(streamerId, "twitchCommand", { user, command: msg });
        return;
      }

      // Built-in fallback example
      if (msg === "!hydrate") {
        await twitchClient.say(target, `💧 Stay hydrated, ${user}!`);
        emitEvent("global", "hydrateCommand", { user });
      }
    });

    await twitchClient.connect();
    console.log("✅ Twitch client initialized.");
  } catch (err) {
    console.error("❌ Twitch init failed:", err.message);
  }
}

/* ────────────────────────────────
   📡 Connection State
──────────────────────────────── */
export function isTwitchConnected() {
  return connected;
}
