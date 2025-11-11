import mongoose from "mongoose";

const ActionSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const ConditionsSchema = new mongoose.Schema(
  {
    textIncludes: { type: [String], default: [] },
    cooldownSec: { type: Number, default: 0 },
  },
  { _id: false }
);

const AutomationSchema = new mongoose.Schema(
  {
    streamerId: { type: String, required: true, index: true },
    enabled: { type: Boolean, default: true },
    triggerType: {
      type: String,
      required: true,
      enum: ["twitch.chat.command", "twitch.chat.message", "twitch.redemption"],
    },
    triggerName: { type: String },
    conditions: { type: ConditionsSchema, default: () => ({}) },
    actions: { type: [ActionSchema], default: [] },
  },
  { timestamps: true }
);

export const Automation = mongoose.models.Automation || mongoose.model("Automation", AutomationSchema);
