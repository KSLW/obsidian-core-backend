import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { logDiscordEvent } from "../../core/logger.js";
import { Streamer } from "../../models/Streamer.js";

dotenv.config();

let client = null;
let ready = false;
const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";

export async function initDiscord() {
  const token = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
  if (!token) { console.warn("⚠️ Discord token missing — skipping init."); return; }

  client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
  client.once("clientReady", () => {
    ready = true;
    console.log(`💬 Discord bot connected as ${client.user?.tag}`);
  });

  try { await client.login(token); }
  catch (e) { console.error("Discord login failed:", e.message); }

  client.on("clientReady", () => {
  console.log(`💬 Discord bot connected as ${client.user.tag}`);
  logDiscordEvent({ type: "connected", user: client.user.tag });
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  logDiscordEvent({
    type: "message",
    user: message.author.username,
    channel: message.channel.name,
    meta: { content: message.content }
  });
});

}

/**
 * Refresh Discord OAuth token
 */
export async function refreshDiscordToken(ownerId) {
  try {
    const streamer = await Streamer.findOne({ ownerId });
    if (!streamer?.discordAuth?.refreshToken) {
      console.warn(`⚠️ No Discord refresh token found for ${ownerId}`);
      return null;
    }

    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: streamer.discordAuth.refreshToken,
    });

    const { data } = await axios.post(DISCORD_TOKEN_URL, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const update = {
      "discordAuth.accessToken": data.access_token,
      "discordAuth.refreshToken": data.refresh_token ?? streamer.discordAuth.refreshToken,
      "discordAuth.expiresIn": data.expires_in,
      "discordAuth.obtainedAt": Date.now(),
    };
    await Streamer.updateOne({ ownerId }, { $set: update });
    console.log(`🔁 Discord token refreshed successfully for ${ownerId}`);
    return data.access_token;
  } catch (err) {
    console.error("⚠️ Discord token refresh failed:", err.response?.data || err.message);
    return null;
  }
}

export function isDiscordReady() { return ready; }
export { client };
