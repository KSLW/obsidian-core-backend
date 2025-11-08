// src/core/logger.js
import mongoose from "mongoose";

// ────────────────────────────────
// Log Schema (shared for all types)
// ────────────────────────────────
const LogSchema = new mongoose.Schema(
  {
    streamerId: { type: String, required: true },
    type: { type: String, required: true }, // twitch, discord, obs, moderation, automation, system
    subtype: { type: String },
    user: { type: String },
    channel: { type: String },
    message: { type: String },
    meta: { type: Object },
  },
  { timestamps: true }
);

export const Log = mongoose.models.Log || mongoose.model("Log", LogSchema);

// ────────────────────────────────
// Generic Writer
// ────────────────────────────────
async function writeLog(type, data) {
  try {
    await Log.create({ ...data, type });
  } catch (err) {
    console.warn(`⚠️ Failed to save ${type} log:`, err.message);
  }
}

// ────────────────────────────────
// Twitch Events
// ────────────────────────────────
export async function logTwitchEvent(subtype, data, streamerId = "global") {
  await writeLog("twitch", { ...data, streamerId, subtype });
}

// ────────────────────────────────
// Discord Events
// ────────────────────────────────
export async function logDiscordEvent(subtype, data, streamerId = "global") {
  await writeLog("discord", { ...data, streamerId, subtype });
}

// ────────────────────────────────
// OBS Events
// ────────────────────────────────
export async function logOBSEvent(subtype, data, streamerId = "global") {
  await writeLog("obs", { ...data, streamerId, subtype });
}

// ────────────────────────────────
// Moderation Events
// ────────────────────────────────
export async function logModerationEvent(streamerId, data) {
  await writeLog("moderation", { ...data, streamerId, subtype: "action" });
  console.log(`🛡️ [Moderation] ${data.user || "Unknown"} → ${data.action}`);
}

// ────────────────────────────────
// Automation Events
// ────────────────────────────────
export async function logAutomationEvent(subtype, data, streamerId = "global") {
  await writeLog("automation", { ...data, streamerId, subtype });
}

// ────────────────────────────────
// System / Backend Events
// ────────────────────────────────
export async function logSystemEvent(subtype, data = {}) {
  await writeLog("system", { ...data, streamerId: "global", subtype });
  console.log(`📜 [System] ${subtype} logged.`);
}

// ────────────────────────────────
// Retrieve / Clear Logs
// ────────────────────────────────
export async function getLogs(streamerId = "global", limit = 50) {
  return await Log.find({ streamerId }).sort({ createdAt: -1 }).limit(limit);
}

export async function clearLogs(streamerId = "global") {
  await Log.deleteMany({ streamerId });
  console.log(`🧹 Cleared logs for ${streamerId}`);
}
