// src/core/commands.js
import { Command } from "../models/Command.js";
import { logTwitchEvent } from "./logger.js";

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
