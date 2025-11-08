// src/core/logger.js
import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // system | twitch | discord | obs | moderation
    level: { type: String, default: "info" }, // info | warn | error
    streamerId: { type: String, default: "global" },
    payload: { type: Object, default: {} },
  },
  { timestamps: true }
);

const Log = mongoose.models.Log || mongoose.model("Log", logSchema);

export async function logSystemEvent(type, payload = {}, streamerId = "global") {
  await Log.create({ type: `system.${type}`, level: "info", streamerId, payload });
  console.log(`📜 [system] ${type} logged.`);
}

export async function logTwitchEvent(subtype, payload = {}, streamerId = "global", level = "info") {
  await Log.create({ type: `twitch.${subtype}`, level, streamerId, payload });
  if (level === "error") console.error(`📜 [Twitch error] ${subtype}.`);
}

export async function logModerationEvent(streamerId, payload = {}, level = "info") {
  await Log.create({ type: "moderation.action", level, streamerId, payload });
}

export async function getLogs(limit = 200) {
  return Log.find({}).sort({ createdAt: -1 }).limit(limit).lean();
}

export async function clearLogs() {
  await Log.deleteMany({});
}
