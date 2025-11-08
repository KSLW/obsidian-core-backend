// src/setup/autoSeed.js
import { Automation } from "../models/Automation.js";
import { Command } from "../models/Command.js";

/* ────────────────────────────────
   🌱 Default Automations
──────────────────────────────── */
const DEFAULT_AUTOMATIONS = [
  {
    streamerId: "global",
    triggerType: "twitch.chat.command",
    triggerName: "hydrate",
    enabled: true,
    actions: [
      { type: "sendTwitchMessage", payload: { text: "💧 Stay hydrated, {username}!" } },
      { type: "delay", payload: { ms: 1000 } },
      { type: "obsSceneSwitch", payload: { scene: "Hydrate" } },
    ],
  },
  {
    streamerId: "global",
    triggerType: "twitch.chat.command",
    triggerName: "lurk",
    enabled: true,
    actions: [
      { type: "sendTwitchMessage", payload: { text: "{username} has gone into lurk mode 👀" } },
    ],
  },
  {
    streamerId: "global",
    triggerType: "twitch.chat.command",
    triggerName: "shoutout",
    enabled: true,
    actions: [
      { type: "sendTwitchMessage", payload: { text: "Go check out {targetUser}'s channel at twitch.tv/{targetUser} ❤️" } },
    ],
  },
  {
    streamerId: "global",
    triggerType: "twitch.chat.command",
    triggerName: "so",
    enabled: true,
    actions: [
      { type: "sendTwitchMessage", payload: { text: "Shoutout to {targetUser}! ➡ twitch.tv/{targetUser}" } },
    ],
  },
  {
    streamerId: "global",
    triggerType: "twitch.chat.command",
    triggerName: "uptime",
    enabled: true,
    actions: [
      { type: "sendTwitchMessage", payload: { text: "{username}, the stream has been live for {uptime}!" } },
    ],
  },
];

/* ────────────────────────────────
   💬 Default Commands
──────────────────────────────── */
const DEFAULT_COMMANDS = [
  {
    streamerId: "global",
    name: "hydrate",
    response: "💧 Stay hydrated, {username}!",
    enabled: true,
    cooldown: 5,
  },
  {
    streamerId: "global",
    name: "lurk",
    response: "{username} is now lurking 👀",
    enabled: true,
    cooldown: 5,
  },
  {
    streamerId: "global",
    name: "so",
    response: "Go check out {targetUser}'s channel at twitch.tv/{targetUser} ❤️",
    enabled: true,
    cooldown: 5,
  },
  {
    streamerId: "global",
    name: "uptime",
    response: "The stream has been live for {uptime}!",
    enabled: true,
    cooldown: 10,
  },
  {
    streamerId: "global",
    name: "discord",
    response: "Join the community Discord: https://discord.gg/YOURCODE",
    enabled: true,
  },
  {
    streamerId: "global",
    name: "socials",
    response: "Follow {username}'s socials here: https://linktr.ee/YOURNAME",
    enabled: true,
  },
  {
    streamerId: "global",
    name: "hello",
    response: "Hey {username}! 👋 Welcome in!",
    enabled: true,
  },
];

/* ────────────────────────────────
   🚀 Auto-Seed Logic
──────────────────────────────── */
export async function autoSeedAll() {
  try {
    const autoCount = await Automation.countDocuments();
    const cmdCount = await Command.countDocuments();

    if (autoCount === 0) {
      await Automation.insertMany(DEFAULT_AUTOMATIONS);
      console.log(`🌱 Seeded ${DEFAULT_AUTOMATIONS.length} default automations.`);
    } else {
      console.log(`✅ Automations already exist (${autoCount} found) — skipping seeding.`);
    }

    if (cmdCount === 0) {
      await Command.insertMany(DEFAULT_COMMANDS);
      console.log(`🌱 Seeded ${DEFAULT_COMMANDS.length} default Twitch commands.`);
    } else {
      console.log(`✅ Commands already exist (${cmdCount} found) — skipping seeding.`);
    }
  } catch (err) {
    console.error("❌ Auto-seed failed:", err.message);
  }
}
