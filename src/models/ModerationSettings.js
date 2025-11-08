// models/ModerationSettings.js
import mongoose from "mongoose";

const ModerationSettingsSchema = new mongoose.Schema(
  {
    streamerId: { type: String, index: true, unique: true, required: true },
    level: { type: String, enum: ["OFF", "LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
    customBanned: { type: [String], default: [] }, // lowercased entries
    timeoutSeconds: { type: Number, default: 600 },
  },
  { timestamps: true }
);

export const ModerationSettings = mongoose.model(
  "ModerationSettings",
  ModerationSettingsSchema
);
