import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

let client = null;
let ready = false;

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
}

export function isDiscordReady() { return ready; }
// Add sendDiscordMessage/giveRole/removeRole later as needed
