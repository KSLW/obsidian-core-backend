import { Log } from "../models/Log.js";
import { ModerationLog } from "../models/ModerationLog.js";

export async function logSystemEvent(subtype, data = {}) {
  try {
    await Log.create({ platform: "system", type: "system", subtype, data });
  } catch (e) {
    console.warn("⚠️ Failed to save system log:", e.message);
  }
}

export async function logTwitchEvent(subtype, data = {}, streamerId) {
  try {
    await Log.create({
      platform: "twitch",
      type: "twitch",
      subtype,
      streamerId,
      data,
    });
  } catch (e) {
    console.warn("⚠️ Failed to save twitch log:", e.message);
  }
}

export async function logModerationEvent(streamerId, entry) {
  try {
    await ModerationLog.create({
      streamerId,
      platform: entry.platform || "twitch",
      user: entry.user,
      message: entry.message || "",
      action: entry.action || "timeout",
      reason: entry.reason || "",
      meta: entry.meta || {},
    });
  } catch (e) {
    console.warn("⚠️ Failed to save moderation log:", e.message);
  }
}
