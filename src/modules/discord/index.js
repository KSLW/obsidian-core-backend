// backend/src/modules/discord/index.js
import { Client, GatewayIntentBits, Events } from "discord.js";
import dotenv from "dotenv";
import { emitEvent } from "../../core/eventBus.js";
import { getCommands } from "../../core/registry.js";

dotenv.config({ path: process.env.NODE_ENV === "production" ? ".env.production" : ".env.local"});

let discordClient = null;
let connected = false;

/**
 * Initialize Discord bot
 */
export async function initDiscord() {
  const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.warn("⚠️ Discord token missing — skipping init.");
    return;
  }

  console.log("💬 Initializing Discord bot...");

  discordClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  discordClient.once(Events.ClientReady, (client) => {
    connected = true;
    console.log(`💬 Discord bot connected as ${client.user.tag}`);
  });

  discordClient.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    const prefix = "!";
    if (!message.content.startsWith(prefix)) return;

    const [commandName, ...args] = message.content
      .slice(prefix.length)
      .trim()
      .split(/\s+/);

    const streamerId = "global";
    const command = getCommands(streamerId, commandName);
    if (command) {
      console.log(`💬 Discord command triggered: ${commandName}`);
      await message.reply(command.response || "✅ Command executed!");
      emitEvent(streamerId, "discordCommand", {
        user: message.author.username,
        command: commandName,
        args,
      });
    }
  });

  try {
    await discordClient.login(token);
  } catch (err) {
    console.error("❌ Discord login failed:", err.message);
  }
}

export async function sendDiscordMessage(channelId, content) {
  if (!connected) throw new Error("Discord not connected");
  const channel = await discordClient.channels.fetch(channelId);
  await channel.send(content);
  console.log(`💬 Sent message to #${channel.name}`);
}

export async function runDiscordAction(type, params = {}) {
  switch (type) {
    case "send_message":
      return sendDiscordMessage(params.channelId, params.message);
    default:
      console.warn(`⚠️ Unknown Discord action type: ${type}`);
  }
}

/* ────────────────────────────────
   🧑‍🤝‍🧑 ROLE MANAGEMENT
──────────────────────────────── */
export async function giveRoleToUser(guildId, userId, roleId) {
  if (!connected) throw new Error("Discord not connected");
  try {
    const guild = await discordClient.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    await member.roles.add(roleId);
    console.log(`✅ Added role ${roleId} to ${member.user.username}`);
  } catch (err) {
    console.error("❌ Failed to give role:", err.message);
  }
}

export async function removeRoleFromUser(guildId, userId, roleId) {
  if (!connected) throw new Error("Discord not connected");
  try {
    const guild = await discordClient.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    await member.roles.remove(roleId);
    console.log(`🗑️ Removed role ${roleId} from ${member.user.username}`);
  } catch (err) {
    console.error("❌ Failed to remove role:", err.message);
  }
}


export function isDiscordConnected() {
  return connected;
}
