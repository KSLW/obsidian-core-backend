import tmi from "tmi.js";
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import { Streamer } from "../../models/Streamer.js";
import { emitEvent } from "../../core/eventBus.js";
import { getTwitchCommand } from "../../core/registry.js";
dotenv.config();

let twitchClient = null;
let connected = false;

/** simple hate-speech moderation list (expand later) */
const BAN_REGEX = /(slur1|slur2|kill yourself|go back to)/i;

/* App access token for EventSub */
async function getAppAccessToken() {
  const res = await axios.post("https://id.twitch.tv/oauth2/token", null, {
    params: {
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: "client_credentials",
    },
  });
  return res.data.access_token;
}

export async function initTwitch() {
  // choose the most recently updated streamer with twitch auth
  const user = await Streamer.findOne({ "twitchAuth.accessToken": { $exists: true } });
  const username = user?.twitchBot?.username || process.env.TWITCH_BOT_USERNAME;
  const channel  = user?.twitchBot?.channel  || process.env.TWITCH_CHANNEL;
  const token    = user?.twitchAuth?.accessToken || process.env.TWITCH_OAUTH_TOKEN;

  if (!username || !channel || !token) {
    console.warn("⚠️ Twitch credentials missing — skipping init.");
    return;
  }

  twitchClient = new tmi.Client({
    identity: { username, password: `oauth:${token.replace(/^oauth:/, "")}` },
    channels: [channel],
  });

  twitchClient.on("connected", () => {
    connected = true;
    console.log(`🟣 Twitch bot connected as ${username} in #${channel}`);
    emitEvent(user?._id || "global", "twitch.connected", { username, channel });
  });

  // Moderation + Commands
  twitchClient.on("message", async (target, tags, message, self) => {
    if (self) return;
    const streamerId = user?._id || "global";
    const display = tags["display-name"] || tags.username;
    const text = message.trim();

    // Moderation
    if (BAN_REGEX.test(text)) {
      await timeoutUser(display, 600, "Hate speech / slur");
      await twitchClient.say(target, `⛔ Message removed. ${display} timed out.`);
      emitEvent(streamerId, "twitch.moderation.timeout", { user: display, reason: "hate_speech" });
      return;
    }

    // Commands
    if (text.startsWith("!")) {
      const name = text.slice(1).split(" ")[0].toLowerCase();
      const cmd = getTwitchCommand(streamerId, name);
      if (cmd?.response) {
        await twitchClient.say(target, cmd.response.replace("{username}", display));
        emitEvent(streamerId, "twitch.chat.command", { user: display, command: name });
        return;
      }
      if (name === "hello") {
        await twitchClient.say(target, `Hey ${display}! 👋`);
        emitEvent(streamerId, "twitch.chat.command", { user: display, command: "hello" });
        return;
      }
    }

    // Firehose
    emitEvent(streamerId, "twitch.chat", { user: display, message: text });
  });

  await twitchClient.connect();
  console.log("✅ Twitch client initialized.");

  // Register EventSub for Channel Points (webhook)
  if (process.env.PUBLIC_URL && process.env.TWITCH_EVENTSUB_SECRET) {
    try {
      const appToken = await getAppAccessToken();
      await axios.post(
        "https://api.twitch.tv/helix/eventsub/subscriptions",
        {
          type: "channel.channel_points_custom_reward_redemption.add",
          version: "1",
          condition: { broadcaster_user_id: user.ownerId },
          transport: {
            method: "webhook",
            callback: `${process.env.PUBLIC_URL}/api/twitch/eventsub/callback`,
            secret: process.env.TWITCH_EVENTSUB_SECRET,
          },
        },
        { headers: { "Client-ID": process.env.TWITCH_CLIENT_ID, Authorization: `Bearer ${appToken}` } }
      );
      console.log("✅ EventSub registered (channel points redemptions).");
    } catch (e) {
      console.warn("⚠️ EventSub registration failed:", e.response?.data || e.message);
    }
  }
}

export function isTwitchConnected() { return connected; }
export async function sendTwitchMessage(message, channel) {
  if (!connected) throw new Error("Twitch not connected");
  const target = channel || (twitchClient.getChannels?.()[0]) || process.env.TWITCH_CHANNEL;
  await twitchClient.say(target, message);
  console.log(`🟣 Sent Twitch message -> ${target}: ${message}`);
}
export async function timeoutUser(username, seconds = 600, reason = "Timeout") {
  if (!connected) throw new Error("Twitch not connected");
  // tmi.js supports timeout if bot is mod
  const chan = (twitchClient.getChannels?.()[0]) || `#${process.env.TWITCH_CHANNEL}`;
  try {
    await twitchClient.timeout(chan, username, seconds, reason);
  } catch {
    // fallback: send /timeout
    await twitchClient.say(chan, `/timeout ${username} ${seconds} ${reason}`);
  }
}
