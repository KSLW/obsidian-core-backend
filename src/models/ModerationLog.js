import mongoose from "mongoose";

const ModerationLogSchema = new mongoose.Schema(
  {
    streamerId: { type: String, required: true, index: true },
    platform: { type: String, default: "twitch" },
    user: { type: String, required: true },
    message: { type: String, default: "" },
    action: { type: String, enum: ["delete", "timeout", "ban"], default: "timeout" },
    reason: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const ModerationLog = mongoose.models.ModerationLog || mongoose.model("ModerationLog", ModerationLogSchema);
