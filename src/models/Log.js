// backend/src/models/Log.js
import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  platform: { type: String, enum: ["twitch", "discord", "obs", "system"], required: true },
  type: { type: String, required: true },             // e.g. "message", "command", "moderation", "error"
  user: { type: String },                             // user who triggered the event
  channel: { type: String },
  message: { type: String },
  meta: { type: Object, default: {} },                // extra context
  createdAt: { type: Date, default: Date.now },
});

export const Log = mongoose.models.Log || mongoose.model("Log", logSchema);
