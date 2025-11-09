// src/setup/autoSeed.js
import { Automation } from "../models/Automation.js";
import { Command } from "../models/Command.js";

/* ────────────────────────────────
   🌱 Default Twitch Chat Automations
──────────────────────────────── */


const DEFAULT_AUTOMATIONS = [
  // 🧃 Hydrate
  {
    streamerId: "global",
    isGlobal: true,
    triggerType: "twitch.chat.command",
    triggerName: "hydrate",
    enabled: true,
    actions: [
      { type: "sendTwitchMessage", payload: { text: "💧 Stay hydrated, {username}!" } },
      { type: "delay", payload: { ms: 1000 } },
      { type: "obsSceneSwitch", payload: { scene: "Hydrate" } },
    ],
  },
  // 💤 Lurk
  {
    streamerId: "global",
    isGlobal: true,
    triggerType: "twitch.chat.command",
    triggerName: "lurk",
    enabled: true,
    actions: [
      { type: "sendTwitchMessage", payload: { text: "{username} is now lurking 👀" } },
    ],
  },
  // 🤝 Shoutout
  {
    isGlobal: true,
    streamerId: "global",
    isGlobal: true,
    triggerType: "twitch.chat.command",
    triggerName: "so",
    enabled: true,
    actions: [
      { type: "sendTwitchMessage", payload: { text: "Go show {targetUser} some love ➡ twitch.tv/{targetUser} ❤️" } },
    ],
  },
  // ⏱️ Uptime
  {
    streamerId: "global",
    isGlobal: true,
    triggerType: "twitch.chat.command",
    triggerName: "uptime",
    enabled: true,
    actions: [
      { type: "sendTwitchMessage", payload: { text: "The stream has been live for {uptime}!" } },
    ],
  },

  /* ────────────────────────────────
     🧠 Mental-Health & Safety Automations
  ───────────────────────────────── */
  {
    streamerId: "global",
    isGlobal: true,
    triggerType: "twitch.chat.keyword",
    triggerName: "vent",
    enabled: true,
    actions: [
      {
        type: "sendTwitchMessage",
        payload: {
          text: "💬 It’s okay to vent, {username}. You’re safe here. If you need resources, type !help or check Discord’s #mental-health-resources 💚",
        },
      },
    ],
  },
  {
    streamerId: "global",
    isGlobal: true,
    triggerType: "twitch.chat.keyword",
    triggerName: "suicide",
    enabled: true,
    actions: [
      {
        type: "sendTwitchMessage",
        payload: {
          text: "⚠️ {username}, you’re not alone. Please reach out to someone — if you’re in the UK: Samaritans 116 123 | US: 988 | Discord Mods are here to listen 💚",
        },
      },
    ],
  },
  {
    streamerId: "global",
    isGlobal: true,
    triggerType: "twitch.chat.keyword",
    triggerName: "depressed",
    enabled: true,
    actions: [
      {
        type: "sendTwitchMessage",
        payload: {
          text: "💚 Remember {username}, it’s okay to not be okay. You matter here. Take a moment to breathe. 💬 !help for support links.",
        },
      },
    ],
  },

  /* ────────────────────────────────
     🧹 Moderation / Auto-Mod Automations
  ───────────────────────────────── */
  {
    streamerId: "global",
    triggerType: "twitch.chat.filter",
    triggerName: "hate_speech",
    enabled: true,
    actions: [
      { type: "timeoutUser", payload: { duration: 600, reason: "Hate speech / slur" } },
      { type: "sendTwitchMessage", payload: { text: "⛔ Hate speech isn’t tolerated, {username}." } },
    ],
  },
  {
    streamerId: "global",
    triggerType: "twitch.chat.filter",
    triggerName: "spam_links",
    enabled: true,
    actions: [
      { type: "deleteMessage", payload: {} },
      { type: "sendTwitchMessage", payload: { text: "🚫 {username}, please avoid posting links in chat!" } },
    ],
  },
  {
    streamerId: "global",
    triggerType: "twitch.chat.filter",
    triggerName: "caps_spam",
    enabled: true,
    actions: [
      { type: "timeoutUser", payload: { duration: 60, reason: "Caps spam" } },
      { type: "sendTwitchMessage", payload: { text: "📢 Easy there, {username}! Let’s keep it readable 👀" } },
    ],
  },
];

/* ────────────────────────────────
   💬 Default Twitch Commands
──────────────────────────────── */
const DEFAULT_COMMANDS = [
  { name: "hydrate", response: "💧 Stay hydrated, {username}!", enabled: true, cooldown: 5 },
  { name: "lurk", response: "{username} is now lurking 👀", enabled: true, cooldown: 5 },
  { name: "so", response: "Go check out {targetUser} ➡ twitch.tv/{targetUser}", enabled: true, cooldown: 5 },
  { name: "uptime", response: "The stream has been live for {uptime}!", enabled: true, cooldown: 10 },
  { name: "discord", response: "Join the Discord: https://discord.gg/YOURCODE", enabled: true },
  { name: "socials", response: "Follow {username}'s socials: https://linktr.ee/YOURNAME", enabled: true },
  { name: "hello", response: "Hey {username}! 👋 Welcome in!", enabled: true },
  { name: "help", response: "💚 If you need someone to talk to, message a mod or check the #support channel on Discord.", enabled: true },
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
      console.log(`🌱 Seeded ${DEFAULT_AUTOMATIONS.length} automations (chat, safety & moderation).`);
    } else {
      console.log(`✅ ${autoCount} automations found — skipping seed.`);
    }

    if (cmdCount === 0) {
      await Command.insertMany(
        DEFAULT_COMMANDS.map((c) => ({ streamerId: "global", ...c }))
      );
      console.log(`🌱 Seeded ${DEFAULT_COMMANDS.length} chat commands.`);
    } else {
      console.log(`✅ ${cmdCount} commands found — skipping seed.`);
    }
  } catch (err) {
    console.error("❌ Auto-seed failed:", err.message);
  }
}
