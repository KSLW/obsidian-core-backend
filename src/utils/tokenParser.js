// src/utils/tokenParser.js
import axios from "axios";

/**
 * Replaces dynamic tokens (e.g. {username}, {channel}, {uptime})
 * in a given text template.
 */
export async function parseTokens(text, context = {}) {
  if (!text) return "";

  const {
    username = "viewer",
    channel = "",
    streamerName = "",
    streamerId = "",
    botUsername = "bot",
  } = context;

  let output = text
    .replace(/{username}/gi, username)
    .replace(/{channel}/gi, channel.replace(/^#/, ""))
    .replace(/{bot}/gi, botUsername)
    .replace(/{streamer}/gi, streamerName);

  // Optional: Twitch API powered placeholders
  if (/{uptime}/i.test(output) && streamerId) {
    try {
      const { data } = await axios.get(
        `https://api.twitch.tv/helix/streams?user_id=${streamerId}`,
        {
          headers: {
            "Client-ID": process.env.TWITCH_CLIENT_ID,
            Authorization: `Bearer ${process.env.TWITCH_OAUTH_TOKEN.replace(/^oauth:/, "")}`,
          },
        }
      );

      const live = data.data?.[0];
      if (live) {
        const started = new Date(live.started_at);
        const diff = Math.floor((Date.now() - started.getTime()) / 60000);
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        output = output.replace(
          /{uptime}/gi,
          `${hours > 0 ? `${hours}h ` : ""}${minutes}m`
        );
      } else {
        output = output.replace(/{uptime}/gi, "offline");
      }
    } catch {
      output = output.replace(/{uptime}/gi, "unknown");
    }
  }

  // fun tokens
  const emotes = ["😎", "🔥", "💧", "✨", "🥤", "🍀", "👀"];
  if (/{randomEmote}/i.test(output)) {
    output = output.replace(
      /{randomEmote}/gi,
      emotes[Math.floor(Math.random() * emotes.length)]
    );
  }

  return output;
}
