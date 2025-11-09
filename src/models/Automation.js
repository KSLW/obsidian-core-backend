import mongoose from "mongoose";

const ActionSchema = new mongoose.Schema({
  type: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: false });

const ConditionsSchema = new mongoose.Schema({
  textIncludes: { type: [String], default: [] },
  userIsMod: { type: Boolean, default: false },
  cooldownSec: { type: Number, default: 0 },
}, { _id: false });

const AutomationSchema = new mongoose.Schema(
  {
    streamerId: { type: String, required: true, index: true },
    enabled: { type: Boolean, default: true },
    triggerType: {
      type: String,
      required: true,
      enum: [
        "twitch.chat.command",
        "twitch.chat.message",
        "twitch.chat.keyword",
        "twitch.chat.filter",
        "twitch.redemption",
        "twitch.follow",
        "twitch.sub",
      ],
    },
    triggerName: { type: String },
    conditions: { type: ConditionsSchema, default: () => ({}) },
    actions: { type: [ActionSchema], default: [] },
    isGlobal: { type: Boolean, default: false }, // 👈 add this
  },
  { timestamps: true }
);

export const Automation = mongoose.model("Automation", AutomationSchema);
