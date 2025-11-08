// backend/src/core/moderation.js
import mongoose from "mongoose";

/* ────────────────────────────────
   🧩 Safety Word Lists
──────────────────────────────── */
const LOW_WORDS = ["idiot", "stupid", "trash"];
const MEDIUM_WORDS = [...LOW_WORDS, "kys", "kill yourself", "go back to", "disgusting"];
const HIGH_WORDS = [...MEDIUM_WORDS, "slur1", "slur2", "racistterm", "homophobicterm"];

export const SAFETY_LEVELS = { LOW: LOW_WORDS, MEDIUM: MEDIUM_WORDS, HIGH: HIGH_WORDS };

/* ────────────────────────────────
   🧠 Schemas for MongoDB
──────────────────────────────── */
const moderationLogSchema = new mongoose.Schema({
  streamerId: String,
  platform: String,
  user: String,
  message: String,
  action: String,
  reason: String,
  meta: Object,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const moderationSettingsSchema = new mongoose.Schema({
  streamerId: String,
  level: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
  customBanned: { type: [String], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

export const ModerationLog =
  mongoose.models.ModerationLog || mongoose.model("ModerationLog", moderationLogSchema);

export const ModerationSettings =
  mongoose.models.ModerationSettings || mongoose.model("ModerationSettings", moderationSettingsSchema);

/* ────────────────────────────────
   ⚙️ Core Utilities
──────────────────────────────── */
export function getBannedWords(level = "MEDIUM", custom = []) {
  const base = SAFETY_LEVELS[level] || SAFETY_LEVELS.MEDIUM;
  return [...new Set([...base, ...custom.map(w => w.toLowerCase())])];
}

/* ────────────────────────────────
   🔎 Message Checking + Logging
──────────────────────────────── */
export async function checkMessageSafety(streamerId, message) {
  const settings = await getModerationSettings(streamerId);
  const { level, customBanned } = settings;
  const bannedWords = getBannedWords(level, customBanned);

  const found = bannedWords.find(w => message.toLowerCase().includes(w.toLowerCase()));
  if (found) {
    await logModerationAction(streamerId, {
      platform: "twitch",
      user: "unknown",
      message,
      action: "timeout",
      reason: `AutoMod triggered (${level})`,
      meta: { pattern: found, duration: 600 },
    });
    return { pattern: found, duration: 600 };
  }
  return null;
}

export async function logModerationAction(streamerId, entry) {
  try {
    const log = new ModerationLog({ streamerId, ...entry });
    await log.save();
    console.log(`🛡️ [Moderation] Logged: ${entry.reason}`);
  } catch (err) {
    console.error("⚠️ Failed to log moderation:", err.message);
  }
}

/* ────────────────────────────────
   🧩 Streamer Settings Management
──────────────────────────────── */
export async function getModerationSettings(streamerId) {
  let settings = await ModerationSettings.findOne({ streamerId });
  if (!settings) {
    settings = await ModerationSettings.create({ streamerId });
  }
  return settings;
}

export async function setModerationLevel(streamerId, level = "MEDIUM") {
  const valid = ["LOW", "MEDIUM", "HIGH"];
  if (!valid.includes(level)) throw new Error("Invalid moderation level");
  const settings = await getModerationSettings(streamerId);
  settings.level = level;
  settings.updatedAt = Date.now();
  await settings.save();
  console.log(`⚙️ Updated moderation level for ${streamerId} → ${level}`);
  return settings;
}

export async function setCustomBanned(streamerId, words = []) {
  const settings = await getModerationSettings(streamerId);
  settings.customBanned = [...new Set(words.map(w => w.toLowerCase()))];
  settings.updatedAt = Date.now();
  await settings.save();
  console.log(`⚙️ Updated custom banned words for ${streamerId}: ${settings.customBanned.join(", ")}`);
  return settings;
}
