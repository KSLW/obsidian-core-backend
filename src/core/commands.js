// src/core/commands.js
import { Command } from "../models/Command.js";
import { logTwitchEvent } from "./logger.js";
import { parseTokens } from "../utils/tokenParser.js";

/**
 * Get a command by name and streamerId
 */
export async function getCommand(streamerId, name) {
  return Command.findOne({ streamerId, name, enabled: true });
}

/**
 * Execute a Twitch command (handles cooldowns, permissions, etc.)
 */
export async function executeCommand(streamerId, name, user, twitchClient, channel) {
  const cmd = await getCommand(streamerId, name);
  if (!cmd) return false;

  const now = new Date();
  if (cmd.lastUsed && now - cmd.lastUsed < cmd.cooldown * 1000) {
    console.log(`⚠️ Command "${name}" on cooldown`);
    return false;
  }

  // Replace placeholders
  const msg = cmd.response
    .replace(/\{username\}/gi, user)
    .replace(/\{command\}/gi, name)
    .replace(/\{time\}/gi, new Date().toLocaleTimeString());

  await twitchClient.say(channel, msg);

  cmd.lastUsed = now;
  await cmd.save();

  logTwitchEvent({
    type: "command",
    user,
    meta: { command: name, response: msg, streamerId },
  });

  return true;
}

/**
 * CRUD helpers
 */
export async function createCommand(streamerId, name, response, options = {}) {
  return Command.create({
    streamerId,
    name,
    response,
    ...options,
  });
}

export async function deleteCommand(streamerId, name) {
  return Command.deleteOne({ streamerId, name });
}

export async function listCommands(streamerId) {
  return Command.find({ streamerId });
}

import { parseTokens } from "../utils/tokenParser.js";

export async function executeCommand(streamerId, name, username, twitchClient, channel, args = []) {
  // 🔹 Built-in Variable Commands
  if (name === "setvar") {
    const [varName, ...rest] = args;
    if (!varName || rest.length === 0) {
      await twitchClient.say(channel, "Usage: !setvar [name] [value]");
      return true;
    }
    const val = rest.join(" ");
    await setVariable(streamerId, varName, val);
    await twitchClient.say(channel, `✅ Variable "${varName}" set to "${val}"`);
    return true;
  }

  if (name === "getvar") {
    const [varName] = args;
    const val = await getVariable(streamerId, varName);
    await twitchClient.say(channel, val ? `📦 ${varName} = ${val}` : `⚠️ No variable named "${varName}"`);
    return true;
  }

  if (name === "addvar") {
    const [varName, numStr] = args;
    const inc = parseInt(numStr || "1");
    const val = await incrementVariable(streamerId, varName, inc);
    await twitchClient.say(channel, `🔢 ${varName} = ${val}`);
    return true;
  }

  // ✅ Dynamic command lookup
  const cmd = await Command.findOne({ streamerId, name, enabled: true });
  if (!cmd) return false;

  const parsed = await parseTokens(cmd.response, {
    username,
    channel,
    streamerName: channel,
    streamerId,
  });

  await twitchClient.say(channel, parsed);
  return true;
}
