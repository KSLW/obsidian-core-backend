// models/ModerationLog.js
import mongoose from "mongoose";

const ModerationLogSchema = new mongoose.Schema(
  {
    streamerId: { type: String, index: true, required: true },
    platform: { type: String, default: "twitch" },
    user: String,
    message: String,
    action: { type: String, enum: ["timeout", "delete", "flag"], default: "timeout" },
    reason: String,
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const ModerationLog = mongoose.model("ModerationLog", ModerationLogSchema);
