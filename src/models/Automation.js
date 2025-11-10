// src/models/Automation.js
import mongoose from "mongoose";

const VALID_ACTION_TYPES = [
  "sendTwitchMessage",
  "obsSceneSwitch",
  "delay",
  "timeoutUser",
  "banUser",
  "playSound",
];

const VALID_TRIGGER_TYPES = [
  "twitch.chat.command",
  "twitch.chat.message",
  "twitch.redemption",
  "twitch.follow",
  "twitch.subscription",
];

// Define sub-schemas for structure clarity
const ActionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: VALID_ACTION_TYPES,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const ConditionsSchema = new mongoose.Schema(
  {
    textIncludes: { type: [String], default: [] },
    userIsMod: { type: Boolean, default: false },
    cooldownSec: {
      type: Number,
      default: 0,
      min: [0, "Cooldown must be >= 0"],
      max: [3600, "Cooldown too long"],
    },
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
      enum: VALID_TRIGGER_TYPES,
    },
    triggerName: { type: String, default: null },
    conditions: { type: ConditionsSchema, default: () => ({}) },
    actions: {
      type: [ActionSchema],
      default: [],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length <= 10,
        message: "Max 10 actions per automation",
      },
    },
  },
  { timestamps: true }
);

export const Automation =
  mongoose.models.Automation || mongoose.model("Automation", AutomationSchema);

export const AUTOMATION_ENUMS = {
  VALID_ACTION_TYPES,
  VALID_TRIGGER_TYPES,
};
